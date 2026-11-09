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

async function request(path: string, options: RequestInit = {}): Promise<unknown> {
  if (!API_URL) throw new ApiError(0, 'Cannot reach the server. Please try again.');

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      signal: options.signal
        ? AbortSignal.any([options.signal, AbortSignal.timeout(10000)])
        : AbortSignal.timeout(10000),
    });
  } catch {
    throw new ApiError(0, 'Cannot reach the server. Please try again.');
  }

  // fetch resolves on HTTP 401/500. We must check the response ourselves.
  if (!response.ok) throw new ApiError(response.status, messageFor(response.status));
  if (response.status !== 200) throw new ApiError(response.status, messageFor(response.status));
  try {
    return await response.json();
  } catch {
    throw new ApiError(502, messageFor(502));
  }
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const value = await request('/sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = value as Partial<LoginResponse> | null;
  if (!data || typeof data.token !== 'string' || !data.token || !isUser(data.user)) {
    throw new ApiError(502, messageFor(502));
  }
  return { token: data.token, user: data.user };
}

export async function getMe(token: string, signal?: AbortSignal): Promise<User> {
  const user = await request('/users/me', {
    headers: { Authorization: `Bearer ${token}` }, signal,
  });
  if (!isUser(user)) throw new ApiError(502, messageFor(502));
  return user;
}
