import { useEffect, useState, type ReactNode } from "react";
import LoginPage from "./components/LoginPage";
import Dashboard from "./components/Dashboard";
import { apiGet, loadStoredToken, setAccessToken } from "./api";
import SiteFooter from "./components/SiteFooter";
import PickTeamsPage from "./components/PickTeamsPage";
import RostersPage from "./components/RostersPage";
import AppFloatingCorner from "./components/AppFloatingCorner";
import { DashboardDataProvider } from "./context/DashboardDataContext";
import {
  ContactPage,
  FantasyRulesPage,
  PrivacyPage,
  ResponsiblePlayPage,
  ScoringTablePage,
  TermsPage,
} from "./components/StaticPages";

export type SessionUser = {
  user_id: string;
  email: string;
  display_name: string;
  virtual_cents?: number;
};

function normalizePathname(p: string): string {
  const lower = p.toLowerCase();
  if (lower.length > 1 && lower.endsWith("/")) return lower.slice(0, -1);
  return lower;
}

function isTransientBootError(e: unknown): boolean {
  if (!(e instanceof Error)) return false;
  const m = e.message.toLowerCase();
  return (
    m.includes("timed out") ||
    m.includes("network") ||
    m.includes("failed to fetch") ||
    m.includes("fetch") ||
    m.includes("503") ||
    m.includes("502") ||
    m.includes("504")
  );
}

async function loadSessionWithRetry(): Promise<SessionUser> {
  const delaysMs = [0, 800, 1500];
  let lastErr: unknown = null;
  for (let i = 0; i < delaysMs.length; i++) {
    const delay = delaysMs[i]!;
    if (delay > 0) {
      await new Promise((r) => setTimeout(r, delay));
    }
    try {
      return await apiGet<SessionUser>("/api/v1/auth/me");
    } catch (e) {
      lastErr = e;
      if (!isTransientBootError(e) || i === delaysMs.length - 1) {
        throw e;
      }
    }
  }
  throw lastErr ?? new Error("Could not load session.");
}

function App() {
  const path = normalizePathname(window.location.pathname);
  const [session, setSession] = useState<SessionUser | null>(null);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    const token = loadStoredToken();
    if (!token) {
      setBooting(false);
      return;
    }
    setAccessToken(token);
    loadSessionWithRetry()
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

  let main: ReactNode;

  if (path === "/terms") {
    main = <TermsPage />;
  } else if (path === "/privacy") {
    main = <PrivacyPage />;
  } else if (path === "/responsible-play") {
    main = <ResponsiblePlayPage />;
  } else if (path === "/contact") {
    main = <ContactPage />;
  } else if (path === "/scoring-table") {
    main = <ScoringTablePage />;
  } else if (path === "/fantasy-rules") {
    main = <FantasyRulesPage />;
  } else if (path === "/rosters") {
    if (booting) {
      main = (
        <p className="dash-loading" style={{ color: "#7f1d1d", fontSize: "14px" }}>
          Loading…
        </p>
      );
    } else if (!session) {
      main = (
        <>
          <p style={{ color: "#fcd34d", marginBottom: 12 }}>Sign in to view your rosters.</p>
          <LoginPage onAuthSuccess={handleAuthSuccess} />
        </>
      );
    } else {
      main = <RostersPage user={session} />;
    }
  } else if (path === "/pick-teams") {
    if (booting) {
      main = (
        <p className="dash-loading" style={{ color: "#7f1d1d", fontSize: "14px" }}>
          Loading…
        </p>
      );
    } else if (!session) {
      main = (
        <>
          <p style={{ color: "#fcd34d", marginBottom: 12 }}>Sign in to pick and edit your teams.</p>
          <LoginPage onAuthSuccess={handleAuthSuccess} />
        </>
      );
    } else {
      main = <PickTeamsPage user={session} />;
    }
  } else if (booting) {
    main = (
      <p className="dash-loading" style={{ color: "#7f1d1d", fontSize: "14px" }}>
        Loading…
      </p>
    );
  } else if (!session) {
    main = <LoginPage onAuthSuccess={handleAuthSuccess} />;
  } else {
    main = <Dashboard user={session} onLogout={handleLogout} />;
  }

  const dashboardFetchEnabled = Boolean(session && !booting);

  return (
    <DashboardDataProvider enabled={dashboardFetchEnabled}>
      <div className="app-shell">
        {dashboardFetchEnabled ? <AppFloatingCorner user={session!} path={path} /> : null}
        <div className="app-main">{main}</div>
        <SiteFooter />
      </div>
    </DashboardDataProvider>
  );
}

export default App;
