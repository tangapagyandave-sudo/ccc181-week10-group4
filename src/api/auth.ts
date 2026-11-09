export interface User {
  id: number;
  name: string;
  email: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export const TOKEN_KEY = 'campusconnect.token';
const API_URL = import.meta.env.VITE_API_URL?.replace(/\/+$/, '');
let requestNumber = 0;

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

function messageFor(status: number): string {
  if (status === 400 || status === 401) return 'Wrong email or password.';
  if (status >= 500) return 'Something went wrong on our side. Please try again later.';
  return 'Could not complete this request. Please try again.';
}

function isUser(value: unknown): value is User {
  if (!value || typeof value !== 'object') return false;
  const user = value as Record<string, unknown>;
  return typeof user.id === 'number' && typeof user.name === 'string'
    && typeof user.email === 'string';
}

// Make a separate copy for the console. The actual request/response stays intact.
function redactForLog(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redactForLog);
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, entry]) => [
      key,
      /password|token|authorization|secret|cookie/i.test(key)
        ? '[REDACTED]'
        : redactForLog(entry),
    ]));
  }
  return value;
}

function payloadForLog(body: RequestInit['body']): unknown {
  if (body == null) return null;
  if (typeof body !== 'string') return '[Non-JSON body omitted]';
  try {
    return JSON.parse(body) as unknown;
  } catch {
    return '[Non-JSON body omitted]';
  }
}

async function request(path: string, options: RequestInit = {}): Promise<unknown> {
  const requestId = ++requestNumber;
  const method = options.method ?? 'GET';

  if (!API_URL) {
    console.error('[API error]', {
      requestId, method, path, stage: 'configuration',
      message: 'VITE_API_URL is missing. No request was sent.',
    });
    throw new ApiError(0, 'Cannot reach the server. Please try again.');
  }

  const url = `${API_URL}${path}`;
  // 1. Log the request BEFORE fetch sends it.
  console.log('[API request]', {
    requestId,
    method,
    url,
    headers: redactForLog(Object.fromEntries(new Headers(options.headers).entries())),
    payload: redactForLog(payloadForLog(options.body)),
  });

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      signal: options.signal
        ? AbortSignal.any([options.signal, AbortSignal.timeout(10000)])
        : AbortSignal.timeout(10000),
    });
  } catch (error: unknown) {
    if (options.signal?.aborted) {
      // React may intentionally cancel an abandoned session-check request.
      console.log('[API cancelled]', { requestId, method, url });
    } else {
      console.error('[API error]', {
        requestId, method, url, stage: 'network',
        errorType: error instanceof Error ? error.name : 'NetworkError',
        message: 'No API response was received. Check the backend, URL, and CORS.',
      });
    }
    throw new ApiError(0, 'Cannot reach the server. Please try again.');
  }

  // 2. Read the body ONCE, including error bodies from HTTP 400/401/500.
  let data: unknown;
  let invalidJson = false;
  try {
    data = await response.json();
  } catch {
    invalidJson = true;
    data = '[Response body could not be read as JSON]';
  }

  // 3. Log the status and parsed response BEFORE deciding whether to throw.
  console.log('[API response]', {
    requestId,
    method,
    url,
    status: response.status,
    statusText: response.statusText,
    data: redactForLog(data),
  });

  if (!response.ok || response.status !== 200) {
    console.error('[API error]', {
      requestId, method, url, stage: 'http', status: response.status,
      data: redactForLog(data),
    });
    throw new ApiError(response.status, messageFor(response.status));
  }

  if (invalidJson) {
    console.error('[API error]', {
      requestId, method, url, stage: 'response format', status: response.status,
      message: 'The API response was not readable JSON.',
    });
    throw new ApiError(502, messageFor(502));
  }

  return data;
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const value = await request('/sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = value as Partial<LoginResponse> | null;
  if (!data || typeof data.token !== 'string' || !data.token || !isUser(data.user)) {
    console.error('[API error]', {
      endpoint: '/sessions', stage: 'response validation',
      message: 'Expected a token and a user with id, name, and email.',
      data: redactForLog(value),
    });
    throw new ApiError(502, messageFor(502));
  }
  return { token: data.token, user: data.user };
}

export async function getMe(token: string, signal?: AbortSignal): Promise<User> {
  const user = await request('/users/me', {
    headers: { Authorization: `Bearer ${token}` }, signal,
  });
  if (!isUser(user)) {
    console.error('[API error]', {
      endpoint: '/users/me', stage: 'response validation',
      message: 'Expected a user with id, name, and email.',
      data: redactForLog(user),
    });
    throw new ApiError(502, messageFor(502));
  }
  return user;
}
