import { useEffect, useState, type ReactNode } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import LoginPage from "./components/LoginPage";
import { apiGet, loadStoredToken, setAccessToken } from "./api";
import SiteFooter from "./components/SiteFooter";
import HostPersonaPanel from "./components/HostPersonaPanel";
import GoogleAnalyticsRouteListener from "./components/GoogleAnalyticsRouteListener";
import { Dashboard, DashboardDataProvider, PickTeamsPage, RostersPage } from "./sports/pickleball";
import { NascarHubPage, NascarScoringTablePage } from "./sports/nascar";
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

  const dashboardFetchEnabled = Boolean(session && !booting);

  return (
    <DashboardDataProvider enabled={dashboardFetchEnabled}>
      <GoogleAnalyticsRouteListener />
      <AppShell
        session={session}
        booting={booting}
        onAuthSuccess={handleAuthSuccess}
        onLogout={handleLogout}
      />
    </DashboardDataProvider>
  );
}

type ShellProps = {
  session: SessionUser | null;
  booting: boolean;
  onAuthSuccess: (p: {
    access_token: string;
    user: { user_id: string; email: string; display_name: string; virtual_cents?: number };
  }) => void;
  onLogout: () => void;
};

function AppShell({ session, booting, onAuthSuccess, onLogout }: ShellProps) {
  const location = useLocation();
  const path = normalizePathname(location.pathname);
  const activityPageAside = Boolean(session && !booting) && path !== "/";

  let main: ReactNode;

  main = (
    <Routes>
      <Route path="/terms" element={<TermsPage />} />
      <Route path="/privacy" element={<PrivacyPage />} />
      <Route path="/responsible-play" element={<ResponsiblePlayPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/scoring-table" element={<ScoringTablePage />} />
      <Route path="/fantasy-rules" element={<FantasyRulesPage />} />
      <Route path="/nascar/scoring" element={<NascarScoringTablePage />} />
      <Route path="/nascar" element={<NascarHubPage />} />
      <Route
        path="/rosters"
        element={
          booting ? (
            <p className="dash-loading" style={{ color: "#7f1d1d", fontSize: "14px" }}>
              Loading…
            </p>
          ) : !session ? (
            <>
              <p style={{ color: "#fcd34d", marginBottom: 12 }}>Sign in to view your rosters.</p>
              <LoginPage onAuthSuccess={onAuthSuccess} />
            </>
          ) : (
            <RostersPage user={session} />
          )
        }
      />
      <Route
        path="/pick-teams"
        element={
          booting ? (
            <p className="dash-loading" style={{ color: "#7f1d1d", fontSize: "14px" }}>
              Loading…
            </p>
          ) : !session ? (
            <>
              <p style={{ color: "#fcd34d", marginBottom: 12 }}>Sign in to pick and edit your teams.</p>
              <LoginPage onAuthSuccess={onAuthSuccess} />
            </>
          ) : (
            <PickTeamsPage user={session} />
          )
        }
      />
      <Route
        path="/"
        element={
          booting ? (
            <p className="dash-loading" style={{ color: "#7f1d1d", fontSize: "14px" }}>
              Loading…
            </p>
          ) : !session ? (
            <LoginPage onAuthSuccess={onAuthSuccess} />
          ) : (
            <Dashboard user={session} onLogout={onLogout} />
          )
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );

  return (
    <div className="app-shell">
      <div className={`app-main${activityPageAside ? " app-main--with-aside" : ""}`}>
        {activityPageAside ? (
          <div className="app-page-with-aside">
            <div className="app-page-body">{main}</div>
            <aside className="app-page-aside" aria-label="Activity feed">
              <HostPersonaPanel user={session!} path={path} layout="aside" />
            </aside>
          </div>
        ) : (
          main
        )}
      </div>
      <SiteFooter />
    </div>
  );
}

export default App;
