const API_BASE =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE) || "";

let accessToken: string | null = null;

function baseUrl(): string {
  if (API_BASE) return API_BASE.replace(/\/$/, "");
  return "";
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

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${baseUrl()}${path}`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
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
  const access_token = (envelope.access_token ?? envelope.accessToken) as string | undefined;
  if (!access_token) {
    throw new Error("Server did not return an access token.");
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

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${baseUrl()}${path}`, {
    headers: authHeaders(),
  });
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
