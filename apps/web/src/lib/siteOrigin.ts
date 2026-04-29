/** Public site URL for canonical + Open Graph (no trailing slash). */
export function getSiteOrigin(): string {
  const fromEnv = (import.meta.env?.VITE_SITE_ORIGIN ?? "").trim().replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  if (typeof window !== "undefined") return window.location.origin.replace(/\/$/, "");
  return "https://wakibet.com";
}
