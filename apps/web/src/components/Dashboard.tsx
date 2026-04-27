import type { SessionUser } from "../App";
import { useDashboardDataRequired } from "../context/DashboardDataContext";
import DashboardMultiSportLayout from "./dashboard/DashboardMultiSportLayout";
import DashboardNascarPointsTeaser from "./dashboard/DashboardNascarPointsTeaser";
import DashboardWhatHappensNext from "./dashboard/DashboardWhatHappensNext";
import HostPersonaPanel from "./HostPersonaPanel";
import "./dashboard.css";

export type FantasyRosterRow = {
  tournament_key: string;
  tournament_name: string;
  division_key: string;
  event_type: string;
  skill_level: string;
  age_bracket: string;
  waki_cash_spent: number;
  waki_cash_budget: number;
  waki_lineup_complete: boolean;
  picks: { slot_index: number; player_name: string; is_captain: boolean; waki_cash: number }[];
};

type FantasyPulse = {
  my_rank: number | null;
  rank_players_count: number;
  rank_change: number | null;
  pick_rows: {
    label: string;
    player_name: string;
    points_on_roster: number;
    is_captain: boolean;
    status: "alive" | "waiting";
  }[];
  recent_hits: { headline: string; points: number; occurred_at: string }[];
  progress: { label: string; cumulative_points: number }[];
  leaderboard: { rank: number; display_name: string; points: number; is_me: boolean }[];
};

export type DashboardData = {
  profile: {
    display_name: string;
    email: string;
    state: string | null;
    country: string;
    joined_at: string;
  };
  open_contests: {
    id: string;
    name: string;
    entry_fee_dills: number;
    status: string;
  }[];
  tournament_schedules: {
    tournament_key: string;
    tournament_name: string;
    generated_matches: number;
    my_upcoming_matches: {
      match_id: string;
      event_type: string;
      skill_level: string;
      age_bracket: string;
      event_date: string;
      opponent: string;
    }[];
    featured_matches: {
      match_id: string;
      event_type: string;
      event_date: string;
      player_a: string;
      player_b: string;
    }[];
  }[];
  winter_fantasy_rosters: FantasyRosterRow[];
  fantasy_season: {
    tournaments_planned: number;
    tournaments_with_schedule: number;
    total_fantasy_points: number;
    waki_cash_spent_total: number;
    waki_cash_budget_total: number;
    by_division: {
      tournament_key: string;
      tournament_name: string;
      division_key: string;
      event_type: string;
      skill_level: string;
      age_bracket: string;
      roster_points: number;
    }[];
    note: string;
  };
  fantasy_pulse: FantasyPulse;
  fantasy_what_if?: {
    scenario_key: string;
    kind: "win_next" | "lose_next";
    player_name: string;
    tournament_key: string;
    tournament_name: string;
    division_label: string;
    match_summary: string;
    opponent: string;
    event_date: string;
    roster_waki_delta: number;
    scenario_player_delta: number;
    season_waki_delta: number;
    rank_before: number | null;
    rank_after: number | null;
    impact: "high" | "standard" | "risk";
  }[];
};

type Props = {
  user: SessionUser;
  onLogout: () => void;
};

export default function Dashboard({ user, onLogout }: Props) {
  const { preview, loading, error, reload: loadDashboard } = useDashboardDataRequired();

  const joined = preview ? new Date(preview.profile.joined_at).toLocaleDateString() : "--";
  const pulse = preview?.fantasy_pulse;

  return (
    <div className="dash-shell">
      <div className="dash-head">
        <div>
          <h1>
            WakiBet <span className="brand-jp">ワキベット</span>
          </h1>
          <p>
            Welcome Back, <strong>{user.display_name || user.email}</strong>
          </p>
        </div>
        <div className="dash-head-actions">
          <a className="dash-ghost-btn" href="/rosters">
            My Rosters
          </a>
          <button type="button" onClick={() => void loadDashboard()} disabled={loading} className="dash-ghost-btn">
            {loading ? "Updating…" : "Refresh"}
          </button>
          <button type="button" onClick={onLogout} className="dash-ghost-btn">
            Log Out
          </button>
        </div>
      </div>

      {error && <p className="dash-error">{error}</p>}

      {loading && !preview && (
        <p className="dash-loading" role="status">
          Loading Your Dashboard…
        </p>
      )}

      {preview && pulse && (
        <>
          <section className="dash-prize-strip dash-kpi-strip dash-kpi-strip--compact" aria-label="Season prizes">
            <div className="dash-kpi-card dash-prize-card">
              <div className="dash-kpi-kicker">Prizes</div>
              <div className="dash-prize-value">1st Place</div>
              <div className="dash-kpi-label">WakiBet Champion Hat</div>
            </div>
            <div className="dash-kpi-card dash-prize-card">
              <div className="dash-kpi-kicker">Prizes</div>
              <div className="dash-prize-value">Best Underdog Pick</div>
              <div className="dash-kpi-label">Limited WakiBet Founders Hat</div>
            </div>
            <div className="dash-kpi-card dash-prize-card">
              <div className="dash-kpi-kicker">Prizes</div>
              <div className="dash-prize-value">Biggest Climb</div>
              <div className="dash-kpi-label">Limited WakiBet Founders Hat</div>
            </div>
          </section>

          <DashboardMultiSportLayout preview={preview} pulse={pulse} />

          <section className="dash-activity-row" aria-label="Activity feed">
            <HostPersonaPanel user={user} path="/" layout="inline" />
          </section>

          <DashboardWhatHappensNext preview={preview} />

          {/* Section 3 — Big hits */}
          <section className="dash-section dash-section--hits" aria-labelledby="dash-hits-title">
            <h2 id="dash-hits-title" className="dash-section-title">
              Big Hits
            </h2>
            <p className="dash-section-lead">Recent WakiPoints moments from your roster players.</p>
            {pulse.recent_hits.length === 0 ? (
              <p className="dash-empty">No scoring fireworks yet — results will land here as schedules fill in.</p>
            ) : (
              <ul className="dash-hit-list">
                {pulse.recent_hits.map((h, i) => (
                  <li key={`${h.headline}-${h.occurred_at}-${i}`} className="dash-hit-item">
                    <span className="dash-hit-line">{h.headline}</span>
                    <span className="dash-hit-when">{h.occurred_at}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <DashboardNascarPointsTeaser />

          <details className="dash-account-fold">
            <summary>Account</summary>
            <div className="dash-account-grid">
              <div className="dash-row">
                <span>Name</span>
                <strong>{preview.profile.display_name}</strong>
              </div>
              <div className="dash-row">
                <span>Email</span>
                <strong>{preview.profile.email}</strong>
              </div>
              <div className="dash-row">
                <span>Location</span>
                <strong>
                  {preview.profile.state ?? "--"}, {preview.profile.country}
                </strong>
              </div>
              <div className="dash-row">
                <span>Joined</span>
                <strong>{joined}</strong>
              </div>
            </div>
          </details>

          <p className="dash-footnote">{preview.fantasy_season.note}</p>
        </>
      )}
    </div>
  );
}
