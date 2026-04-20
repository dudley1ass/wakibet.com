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
