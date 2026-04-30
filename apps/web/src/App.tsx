import { Suspense, lazy, useEffect, useState, type ReactNode } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import LoginPage from "./components/LoginPage";
import { apiGet, loadStoredToken, setAccessToken } from "./api";
import SiteFooter from "./components/SiteFooter";
import GoogleAnalyticsRouteListener from "./components/GoogleAnalyticsRouteListener";
import Seo from "./components/Seo";
import { DashboardDataProvider } from "./sports/pickleball/context/DashboardDataContext";

const Dashboard = lazy(() => import("./components/Dashboard"));
const PickTeamsPage = lazy(() => import("./sports/pickleball/components/PickTeamsPage"));
const RostersPage = lazy(() => import("./sports/pickleball/components/RostersPage"));
const NascarHubPage = lazy(() => import("./sports/nascar/components/NascarHubPage"));
const NascarRostersPage = lazy(() => import("./sports/nascar/components/NascarRostersPage"));
const NascarScoringTablePage = lazy(() => import("./sports/nascar/components/NascarScoringTablePage"));
const LacrosseHubPage = lazy(() => import("./sports/lacrosse/components/LacrosseHubPage"));
const LacrosseScoringTablePage = lazy(() => import("./sports/lacrosse/components/LacrosseScoringTablePage"));
const LacrosseRostersPage = lazy(() => import("./sports/lacrosse/components/LacrosseRostersPage"));
const AdminLineupsPage = lazy(() => import("./components/AdminLineupsPage"));
const NascarTexasPicksPage = lazy(() => import("./components/picks/NascarTexasPicksPage"));
const PpaAtlantaPicksPage = lazy(() => import("./components/picks/PpaAtlantaPicksPage"));
const PickleballSeasonLeaderboardPage = lazy(() =>
  import("./components/SeasonLeaderboardPage").then((m) => ({ default: m.PickleballSeasonLeaderboardPage })),
);
const NascarSeasonLeaderboardPage = lazy(() =>
  import("./components/SeasonLeaderboardPage").then((m) => ({ default: m.NascarSeasonLeaderboardPage })),
);
const TermsPage = lazy(() =>
  import("./components/StaticPages").then((m) => ({ default: m.TermsPage })),
);
const PrivacyPage = lazy(() =>
  import("./components/StaticPages").then((m) => ({ default: m.PrivacyPage })),
);
const ResponsiblePlayPage = lazy(() =>
  import("./components/StaticPages").then((m) => ({ default: m.ResponsiblePlayPage })),
);
const ContactPage = lazy(() =>
  import("./components/StaticPages").then((m) => ({ default: m.ContactPage })),
);
const ScoringTablePage = lazy(() =>
  import("./components/StaticPages").then((m) => ({ default: m.ScoringTablePage })),
);
const FantasyRulesPage = lazy(() =>
  import("./components/StaticPages").then((m) => ({ default: m.FantasyRulesPage })),
);
const WakiOddsPage = lazy(() =>
  import("./components/StaticPages").then((m) => ({ default: m.WakiOddsPage })),
);

export type SessionUser = {
  user_id: string;
  email: string;
  display_name: string;
  virtual_cents?: number;
};

const SESSION_CACHE_KEY = "wakibet_session_user";

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
  // Keep resilience for transient failures, but avoid multi-second boot stalls.
  const delaysMs = [0, 250, 750];
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
    // Optimistic dashboard boot: hydrate immediately from last known session while /auth/me refreshes.
    const cachedRaw = localStorage.getItem(SESSION_CACHE_KEY);
    if (cachedRaw) {
      try {
        const cached = JSON.parse(cachedRaw) as SessionUser;
        if (cached?.user_id && cached?.email) {
          setSession(cached);
          setBooting(false);
        }
      } catch {
        // ignore cache parse errors
      }
    }
    loadSessionWithRetry()
      .then((me) => {
        const next = {
          user_id: me.user_id,
          email: me.email,
          display_name: me.display_name,
          virtual_cents: me.virtual_cents,
        };
        setSession(next);
        localStorage.setItem(SESSION_CACHE_KEY, JSON.stringify(next));
      })
      .catch(() => {
        setAccessToken(null);
        setSession(null);
        localStorage.removeItem(SESSION_CACHE_KEY);
      })
      .finally(() => setBooting(false));
  }, []);

  function handleAuthSuccess(payload: {
    access_token: string;
    user: { user_id: string; email: string; display_name: string; virtual_cents?: number };
  }) {
    setAccessToken(payload.access_token);
    const next = {
      user_id: payload.user.user_id,
      email: payload.user.email,
      display_name: payload.user.display_name,
      virtual_cents: payload.user.virtual_cents,
    };
    setSession(next);
    localStorage.setItem(SESSION_CACHE_KEY, JSON.stringify(next));
  }

  function handleLogout() {
    setAccessToken(null);
    setSession(null);
    localStorage.removeItem(SESSION_CACHE_KEY);
  }

  const dashboardFetchEnabled = Boolean(session && !booting);

  return (
    <DashboardDataProvider enabled={dashboardFetchEnabled}>
      <Seo />
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
  let main: ReactNode;

  main = (
    <Suspense
      fallback={
        <p className="dash-loading" style={{ color: "#7f1d1d", fontSize: "14px" }}>
          Loading…
        </p>
      }
    >
      <Routes>
        <Route path="/terms" element={<TermsPage />} />
      <Route path="/privacy" element={<PrivacyPage />} />
      <Route path="/responsible-play" element={<ResponsiblePlayPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/scoring-table" element={<ScoringTablePage />} />
      <Route path="/wakiodds" element={<WakiOddsPage />} />
      <Route path="/fantasy-rules" element={<FantasyRulesPage />} />
      <Route path="/lacrosse" element={<LacrosseHubPage user={session} />} />
      <Route path="/lacrosse/scoring" element={<LacrosseScoringTablePage />} />
      <Route
        path="/lacrosse/rosters"
        element={
          booting ? (
            <p className="dash-loading" style={{ color: "#7f1d1d", fontSize: "14px" }}>
              Loading…
            </p>
          ) : !session ? (
            <>
              <p style={{ color: "#fcd34d", marginBottom: 12 }}>Sign in to view your lacrosse rosters.</p>
              <LoginPage onAuthSuccess={onAuthSuccess} />
            </>
          ) : (
            <LacrosseRostersPage user={session} />
          )
        }
      />
      <Route path="/nascar-texas-picks" element={<NascarTexasPicksPage />} />
      <Route path="/ppa-atlanta-picks" element={<PpaAtlantaPicksPage />} />
      <Route path="/picks/ppa-atlanta" element={<Navigate to="/ppa-atlanta-picks" replace />} />
      <Route path="/picks/nascar-texas" element={<Navigate to="/nascar-texas-picks" replace />} />
      <Route path="/nascar/scoring" element={<NascarScoringTablePage />} />
      <Route
        path="/pick-teams/leaderboard"
        element={
          booting ? (
            <p className="dash-loading" style={{ color: "#7f1d1d", fontSize: "14px" }}>
              Loading…
            </p>
          ) : !session ? (
            <>
              <p style={{ color: "#fcd34d", marginBottom: 12 }}>Sign in to view the season leaderboard.</p>
              <LoginPage onAuthSuccess={onAuthSuccess} />
            </>
          ) : (
            <PickleballSeasonLeaderboardPage user={session} />
          )
        }
      />
      <Route
        path="/nascar/leaderboard"
        element={
          booting ? (
            <p className="dash-loading" style={{ color: "#7f1d1d", fontSize: "14px" }}>
              Loading…
            </p>
          ) : !session ? (
            <>
              <p style={{ color: "#fcd34d", marginBottom: 12 }}>Sign in to view the season leaderboard.</p>
              <LoginPage onAuthSuccess={onAuthSuccess} />
            </>
          ) : (
            <NascarSeasonLeaderboardPage user={session} />
          )
        }
      />
      <Route
        path="/admin/lineups"
        element={
          booting ? (
            <p className="dash-loading" style={{ color: "#7f1d1d", fontSize: "14px" }}>
              Loading…
            </p>
          ) : !session ? (
            <>
              <p style={{ color: "#fcd34d", marginBottom: 12 }}>Sign in to access admin tools.</p>
              <LoginPage onAuthSuccess={onAuthSuccess} />
            </>
          ) : (
            <AdminLineupsPage user={session} />
          )
        }
      />
      <Route
        path="/nascar/rosters"
        element={
          booting ? (
            <p className="dash-loading" style={{ color: "#7f1d1d", fontSize: "14px" }}>
              Loading…
            </p>
          ) : !session ? (
            <>
              <p style={{ color: "#fcd34d", marginBottom: 12 }}>Sign in to view your NASCAR race lineups.</p>
              <LoginPage onAuthSuccess={onAuthSuccess} />
            </>
          ) : (
            <NascarRostersPage user={session} />
          )
        }
      />
      <Route
        path="/nascar"
        element={
          <NascarHubPage user={session} />
        }
      />
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
    </Suspense>
  );

  return (
    <div className="app-shell">
      <div className="app-main">{main}</div>
      <SiteFooter />
    </div>
  );
}

export default App;
