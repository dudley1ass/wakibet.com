import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchGoogleAuthConfig, loadGoogleIdentityScript } from "../lib/googleAuth";

type Props = {
  mode?: "signin" | "signup";
  onCredential: (idToken: string) => void;
  disabled?: boolean;
};

export default function GoogleSignInButton({ mode = "signup", onCredential, disabled }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scriptError, setScriptError] = useState<string | null>(null);

  const configQuery = useQuery({
    queryKey: ["auth", "google-config"] as const,
    queryFn: fetchGoogleAuthConfig,
    staleTime: 10 * 60_000,
  });

  const clientId = configQuery.data?.client_id ?? import.meta.env.VITE_GOOGLE_CLIENT_ID ?? null;
  const enabled = Boolean(configQuery.data?.enabled && clientId);

  useEffect(() => {
    if (!enabled || disabled || !containerRef.current || !clientId) return;

    let cancelled = false;
    void (async () => {
      try {
        await loadGoogleIdentityScript();
        if (cancelled || !containerRef.current || !window.google?.accounts?.id) return;
        containerRef.current.innerHTML = "";
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => {
            if (response.credential) onCredential(response.credential);
          },
        });
        window.google.accounts.id.renderButton(containerRef.current, {
          theme: "filled_black",
          size: "large",
          text: mode === "signup" ? "signup_with" : "signin_with",
          shape: "pill",
          width: 320,
        });
      } catch (e) {
        if (!cancelled) {
          setScriptError(e instanceof Error ? e.message : "Google sign-in unavailable.");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [clientId, disabled, enabled, mode, onCredential]);

  if (configQuery.isLoading) {
    return <p className="dash-sub google-signin-placeholder">Loading sign-in options…</p>;
  }

  if (!enabled) {
    return null;
  }

  if (scriptError) {
    return <p className="dash-error">{scriptError}</p>;
  }

  return <div ref={containerRef} className="google-signin-btn-host" aria-label="Sign in with Google" />;
}
