declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    rdt?: (...args: unknown[]) => void;
  }
}

export function trackEvent(name: string, params: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  if (typeof window.gtag !== "function") return;
  window.gtag("event", name, params);
}

function trackRedditEvent(name: string, params?: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  if (typeof window.rdt !== "function") return;
  if (params) {
    window.rdt("track", name, params);
    return;
  }
  window.rdt("track", name);
}

export function trackRedditSignUp(): void {
  trackRedditEvent("SignUp");
}

export function trackRedditLead(): void {
  trackRedditEvent("Lead");
}
