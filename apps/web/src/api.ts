const viteApiBase =
  typeof import.meta !== "undefined" ? String(import.meta.env?.VITE_API_BASE ?? "").trim() : "";

if (typeof import.meta !== "undefined" && import.meta.env.PROD && !viteApiBase) {
  throw new Error(
    "Production build requires VITE_API_BASE (API origin, no trailing slash). Set it in your static host environment and rebuild.",
  );
}

const API_BASE = viteApiBase;

const DEFAULT_FETCH_MS = import.meta.env.PROD ? 90_000 : 20_000;

/** Login/register can hit slow API cold starts; allow one extra attempt like idempotent GETs. */
const AUTH_POST_RETRY_PATHS = new Set(["/api/v1/auth/login", "/api/v1/auth/register"]);

function effectiveTimeoutMs(path: string, method: string | undefined, budgetMs: number): number {
  const m = (method ?? "GET").toUpperCase();
  if (m === "POST" && AUTH_POST_RETRY_PATHS.has(path)) {
    return Math.max(budgetMs, import.meta.env.PROD ? 135_000 : 45_000);
  }
  return budgetMs;
}

function shouldRetryOnTimeout(path: string, method: string | undefined, attempt: number): boolean {
  if (attempt >= 2) return false;
  const m = (method ?? "GET").toUpperCase();
  if (m === "GET") return true;
  return m === "POST" && AUTH_POST_RETRY_PATHS.has(path);
}

let accessToken: string | null = null;

function createTimeoutSignal(ms: number): AbortSignal {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), ms);
  ctrl.signal.addEventListener("abort", () => clearTimeout(id), { once: true });
  return ctrl.signal;
}

function isTimedOut(e: unknown): boolean {
  if (e instanceof DOMException) {
    return e.name === "AbortError" || e.name === "TimeoutError";
  }
  return e instanceof Error && e.name === "AbortError";
}

async function apiFetch(path: string, init: RequestInit, attempt = 1, timeoutMs = DEFAULT_FETCH_MS): Promise<Response> {
  const waitMs = effectiveTimeoutMs(path, init.method, timeoutMs);
  try {
    return await fetch(`${baseUrl()}${path}`, {
      ...init,
      signal: createTimeoutSignal(waitMs),
    });
  } catch (e) {
    if (isTimedOut(e)) {
      if (shouldRetryOnTimeout(path, init.method, attempt)) {
        return apiFetch(path, init, attempt + 1, timeoutMs);
      }
      throw new Error(
        `Request to ${path} timed out after ${waitMs / 1000}s. Check VITE_API_BASE, that the API is running, and your network.`,
      );
    }
    throw e;
  }
}

function baseUrl(): string {
  if (API_BASE) return API_BASE.replace(/\/$/, "");
  return "";
}

function assertJsonResponse(res: Response, path: string): void {
  const ct = res.headers.get("content-type") || "";
  if (res.ok && !ct.includes("application/json")) {
    throw new Error(
      `Expected JSON from ${path} but got "${ct}". Check VITE_API_BASE and API CORS.`,
    );
  }
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
  if (token) {
    localStorage.setItem("wakibet_token", token);
  } else {
    localStorage.removeItem("wakibet_token");
  }
}

export function loadStoredToken(): string | null {
  accessToken = localStorage.getItem("wakibet_token");
  return accessToken;
}

function authHeaders(): HeadersInit {
  const h: Record<string, string> = { Accept: "application/json" };
  if (accessToken) {
    h.Authorization = `Bearer ${accessToken}`;
  }
  return h;
}

function formatError(data: Record<string, unknown>, res: Response): string {
  const d = data?.detail;
  if (Array.isArray(d)) {
    return d.map((x: { msg?: string }) => x.msg || JSON.stringify(x)).join("; ");
  }
  if (typeof d === "string") return d;
  if (d && typeof d === "object") return JSON.stringify(d);
  if (typeof data?.message === "string") return data.message;
  return res.statusText;
}

type ApiWriteOpts = { headers?: Record<string, string> };

export async function apiPost<T>(path: string, body: unknown, opts?: ApiWriteOpts): Promise<T> {
  const res = await apiFetch(path, {
    method: "POST",
    headers: { ...authHeaders(), ...(opts?.headers ?? {}), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  assertJsonResponse(res, path);
  let data: Record<string, unknown> = {};
  try {
    data = (await res.json()) as Record<string, unknown>;
  } catch {
    data = {};
  }
  if (!res.ok) {
    throw new Error(formatError(data, res));
  }
  return data as T;
}

export async function apiPut<T>(path: string, body: unknown, opts?: ApiWriteOpts): Promise<T> {
  const res = await apiFetch(path, {
    method: "PUT",
    headers: { ...authHeaders(), ...(opts?.headers ?? {}), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  assertJsonResponse(res, path);
  let data: Record<string, unknown> = {};
  try {
    data = (await res.json()) as Record<string, unknown>;
  } catch {
    data = {};
  }
  if (!res.ok) {
    throw new Error(formatError(data, res));
  }
  return data as T;
}

export type AuthSuccessPayload = {
  access_token: string;
  user: {
    user_id: string;
    email: string;
    display_name: string;
    virtual_cents?: number;
  };
};

/** Normalize login/register JSON (snake_case or camelCase) and load /me if `user` is missing. */
export async function finalizeAuthFromLoginResponse(raw: Record<string, unknown>): Promise<AuthSuccessPayload> {
  const envelope = (raw.data as Record<string, unknown> | undefined) ?? raw;
  const access_token = (envelope.access_token ??
    envelope.accessToken ??
    envelope.token) as string | undefined;
  if (!access_token) {
    const keys = Object.keys(raw).length ? Object.keys(raw).join(", ") : "(empty JSON)";
    throw new Error(
      `Server did not return an access token (response keys: ${keys}). Check VITE_API_BASE, the API / network tab, and CORS.`,
    );
  }
  setAccessToken(access_token);

  let user = (envelope.user ?? envelope.User) as Record<string, unknown> | undefined;
  const hasUserId = Boolean(user && (user.user_id != null || user.userId != null));
  if (!hasUserId) {
    user = (await apiGet<Record<string, unknown>>("/api/v1/auth/me")) as Record<string, unknown>;
  }

  const user_id = String(user?.user_id ?? user?.userId ?? "");
  const email = String(user?.email ?? "");
  const display_name = String(user?.display_name ?? user?.displayName ?? "");
  if (!user_id || !email) {
    throw new Error("Could not load account profile after sign-in.");
  }
  const virtual_cents = Number(user?.virtual_cents ?? user?.virtualCents ?? 0);

  return {
    access_token,
    user: { user_id, email, display_name, virtual_cents },
  };
}

export type ApiGetOpts = { timeoutMs?: number; headers?: Record<string, string> };

export async function apiGet<T>(path: string, opts?: ApiGetOpts): Promise<T> {
  const timeoutMs = opts?.timeoutMs ?? DEFAULT_FETCH_MS;
  const res = await apiFetch(
    path,
    {
      headers: { ...authHeaders(), ...(opts?.headers ?? {}) },
    },
    1,
    timeoutMs,
  );
  assertJsonResponse(res, path);
  let data: Record<string, unknown> = {};
  try {
    data = (await res.json()) as Record<string, unknown>;
  } catch {
    data = {};
  }
  if (!res.ok) {
    throw new Error(formatError(data, res));
  }
  return data as T;
}
