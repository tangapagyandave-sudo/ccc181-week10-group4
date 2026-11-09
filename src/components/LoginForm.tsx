// Part 2: keep the original validation and CSS classes; authenticate with the API.
import { useEffect, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import type { LoginErrors, LoginFormValues } from "../types";
import { ApiError, getMe, login, TOKEN_KEY } from "../api/auth";
import type { User } from "../api/auth";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const INITIAL_VALUES: LoginFormValues = {
  email: "",
  password: "",
  remember: false,
};

function validate(values: LoginFormValues): LoginErrors {
  const errors: LoginErrors = {};
  if (!EMAIL_PATTERN.test(values.email)) {
    errors.email = "Enter a valid email address.";
  }
  if (values.password.length < 8) {
    errors.password = "Password must be at least 8 characters.";
  }
  return errors;
}

export default function LoginForm() {
  const [values, setValues] = useState<LoginFormValues>(INITIAL_VALUES);
  const [errors, setErrors] = useState<LoginErrors>({});
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [apiError, setApiError] = useState("");

  useEffect(() => {
    const token = sessionStorage.getItem(TOKEN_KEY);
    if (!token) {
      setCheckingSession(false);
      return;
    }
    const controller = new AbortController();
    getMe(token, controller.signal)
      .then((currentUser) => {
        if (!controller.signal.aborted) setUser(currentUser);
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        if (error instanceof ApiError && error.status === 401) {
          sessionStorage.removeItem(TOKEN_KEY);
        } else {
          setApiError(
            error instanceof ApiError
              ? error.message
              : "Cannot reach the server. Please try again.",
          );
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setCheckingSession(false);
      });
    return () => controller.abort();
  }, []);

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const { name, type, value, checked } = event.target;
    setValues((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    const nextErrors = validate(values);
    setErrors(nextErrors);
    setApiError("");
    if (Object.keys(nextErrors).length > 0) return; // No API request for invalid input.

    setLoading(true);
    try {
      const result = await login(values.email.trim(), values.password);
      sessionStorage.setItem(TOKEN_KEY, result.token);
      setUser(result.user); // Reached only after the API returned 200.
      setValues(INITIAL_VALUES);
    } catch (error: unknown) {
      setApiError(
        error instanceof ApiError
          ? error.message
          : "Could not save your sign-in. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    sessionStorage.removeItem(TOKEN_KEY);
    setUser(null);
    setApiError("");
    setErrors({});
    setValues(INITIAL_VALUES);
    setShowPassword(false);
  }

  if (checkingSession) {
    return (
      <section className="login-card" aria-busy="true">
        <p role="status">Checking your session...</p>
      </section>
    );
  }

  if (user) {
    return (
      <section
        className="login-card welcome-card"
        aria-labelledby="welcome-title"
      >
        <h2 id="welcome-title" className="login-card__title">
          Welcome, {user.name}
        </h2>
        <p className="auth-email">{user.email}</p>
        <button
          type="button"
          className="btn btn--primary"
          onClick={handleLogout}
        >
          Log out
        </button>
      </section>
    );
  }

  return (
    <section className="login-card" aria-labelledby="login-title">
      <h2 id="login-title" className="login-card__title">
        Sign in
      </h2>
      <p className="login-card__subtitle">Use your school email to continue.</p>

      {apiError && (
        <p className="auth-message auth-message--error" role="alert">
          {apiError}
        </p>
      )}

      <form
        className="login-form"
        onSubmit={handleSubmit}
        noValidate
        aria-busy={loading}
      >
        <div className="form-field">
          <label htmlFor="email">School email</label>
          <input
            id="email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="name@school.edu.ph"
            value={values.email}
            onChange={handleChange}
            disabled={loading}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "email-error" : undefined}
          />
          {errors.email && (
            <p id="email-error" className="form-error" role="alert">
              {errors.email}
            </p>
          )}
        </div>

        <div className="form-field">
          <label htmlFor="password">Password</label>
          <div className="password-row">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={values.password}
              onChange={handleChange}
              disabled={loading}
              aria-invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? "password-error" : undefined}
            />
            <button
              type="button"
              className="btn btn--ghost toggle-password"
              aria-controls="password"
              aria-pressed={showPassword}
              onClick={() => setShowPassword((current) => !current)}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
          {errors.password && (
            <p id="password-error" className="form-error" role="alert">
              {errors.password}
            </p>
          )}
        </div>

        <div className="form-options">
          <label className="checkbox">
            <input
              type="checkbox"
              name="remember"
              checked={values.remember}
              onChange={handleChange}
            />
            <span>Keep me signed in</span>
          </label>
          <a className="link" href="#forgot">
            Forgot password?
          </a>
        </div>

        <button type="submit" className="btn btn--primary" disabled={loading}>
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>

      <div className="login-card__divider">
        <span>or</span>
      </div>

      <div className="alt-actions">
        <button type="button" className="btn btn--secondary">
          Create account
        </button>
        <button type="button" className="btn btn--secondary">
          Continue as guest
        </button>
      </div>
    </section>
  );
}
