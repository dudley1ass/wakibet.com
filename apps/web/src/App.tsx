import { useEffect, useState } from "react";
import LoginPage from "./components/LoginPage";
import Dashboard from "./components/Dashboard";
import { apiGet, loadStoredToken, setAccessToken } from "./api";

export type SessionUser = {
  user_id: string;
  email: string;
  display_name: string;
  virtual_cents?: number;
};

function App() {
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

  if (booting) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(145deg, #fff7ed 0%, #ffedd5 40%, #fef3c7 100%)",
          color: "#7f1d1d",
          fontSize: "14px",
        }}
      >
        Loading…
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(145deg, #fff7ed 0%, #ffedd5 40%, #fef3c7 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
    >
      {!session ? (
        <LoginPage onAuthSuccess={handleAuthSuccess} />
      ) : (
        <Dashboard user={session} onLogout={handleLogout} />
      )}
    </div>
  );
}

export default App;
