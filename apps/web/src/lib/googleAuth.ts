import { apiGet, apiPost, finalizeAuthFromLoginResponse } from "../api";

export type GoogleAuthConfig = {
  enabled: boolean;
  client_id: string | null;
};

export type GoogleAuthResult =
  | {
      kind: "authenticated";
      access_token: string;
      user: { user_id: string; email: string; display_name: string; virtual_cents?: number };
    }
  | {
      kind: "needs_profile";
      email: string;
      display_name: string;
      id_token: string;
    };

export async function fetchGoogleAuthConfig(): Promise<GoogleAuthConfig> {
  return apiGet<GoogleAuthConfig>("/api/v1/auth/google/config");
}

export async function signInWithGoogleIdToken(
  idToken: string,
  profile?: { state: string; dob: string },
): Promise<GoogleAuthResult> {
  const body: Record<string, string> = { id_token: idToken };
  if (profile) {
    body.state = profile.state;
    body.dob = profile.dob;
  }
  const data = await apiPost<Record<string, unknown>>("/api/v1/auth/google", body);
  if (data.needs_profile === true) {
    return {
      kind: "needs_profile",
      email: String(data.email ?? ""),
      display_name: String(data.display_name ?? "Player"),
      id_token: idToken,
    };
  }
  const payload = await finalizeAuthFromLoginResponse(data);
  return {
    kind: "authenticated",
    access_token: payload.access_token,
    user: payload.user,
  };
}

export function loadGoogleIdentityScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.google?.accounts?.id) return Promise.resolve();
  const existing = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
  if (existing) {
    return new Promise((resolve) => {
      existing.addEventListener("load", () => resolve(), { once: true });
      if (window.google?.accounts?.id) resolve();
    });
  }
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google sign-in."));
    document.head.appendChild(script);
  });
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              theme?: "outline" | "filled_blue" | "filled_black";
              size?: "large" | "medium" | "small";
              text?: "signin_with" | "signup_with" | "continue_with";
              shape?: "rectangular" | "pill" | "circle" | "square";
              width?: number;
            },
          ) => void;
        };
      };
    };
  }
}
