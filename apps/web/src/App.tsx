import { useEffect, useState } from "react";
import LoginPage from "./components/LoginPage";
import Dashboard from "./components/Dashboard";
import { apiGet, loadStoredToken, setAccessToken } from "./api";
import SiteFooter from "./components/SiteFooter";
import { ContactPage, PrivacyPage, ResponsiblePlayPage, TermsPage } from "./components/StaticPages";

export type SessionUser = {
  user_id: string;
  email: string;
  display_name: string;
  virtual_cents?: number;
};

function App() {
  const path = window.location.pathname.toLowerCase();
  const [session, setSession] = useState<SessionUser | null>(null);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    const token = loadStoredToken();
    if (!token) {
      setBooting(false);
      return;
    }
    setAccessToken(token);
    apiGet<SessionUser>("/api/v1/auth/me")
      .then((me) =>
        setSession({
          user_id: me.user_id,
          email: me.email,
          display_name: me.display_name,
          virtual_cents: me.virtual_cents,
        }),
      )
      .catch(() => {
        setAccessToken(null);
        setSession(null);
      })
      .finally(() => setBooting(false));
  }, []);

  function handleAuthSuccess(payload: {
    access_token: string;
    user: { user_id: string; email: string; display_name: string; virtual_cents?: number };
  }) {
    setAccessToken(payload.access_token);
    setSession({
      user_id: payload.user.user_id,
      email: payload.user.email,
      display_name: payload.user.display_name,
      virtual_cents: payload.user.virtual_cents,
    });
  }

  function handleLogout() {
    setAccessToken(null);
    setSession(null);
  }

  if (path === "/terms") {
    return (
      <div className="app-shell">
        <div className="app-main">
          <TermsPage />
        </div>
        <SiteFooter />
      </div>
    );
  }
  if (path === "/privacy") {
    return (
      <div className="app-shell">
        <div className="app-main">
          <PrivacyPage />
        </div>
        <SiteFooter />
      </div>
    );
  }
  if (path === "/responsible-play") {
    return (
      <div className="app-shell">
        <div className="app-main">
          <ResponsiblePlayPage />
        </div>
        <SiteFooter />
      </div>
    );
  }
  if (path === "/contact") {
    return (
      <div className="app-shell">
        <div className="app-main">
          <ContactPage />
        </div>
        <SiteFooter />
      </div>
    );
  }

  if (booting) {
    return (
      <div className="app-shell">
        <div className="app-main" style={{ color: "#7f1d1d", fontSize: "14px" }}>
          Loading…
        </div>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="app-shell">
      <div className="app-main">
        {!session ? (
          <LoginPage onAuthSuccess={handleAuthSuccess} />
        ) : (
          <Dashboard user={session} onLogout={handleLogout} />
        )}
      </div>
      <SiteFooter />
    </div>
  );
}

export default App;
