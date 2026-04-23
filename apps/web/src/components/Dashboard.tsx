import { useMemo } from "react";
import { WINTER_FANTASY_RULES } from "@wakibet/shared";
import type { SessionUser } from "../App";
import { useDashboardDataRequired } from "../context/DashboardDataContext";
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

function formatRankJump(before: number | null, after: number | null): string {
  if (before == null || after == null) return "Rank TBD";
  if (before === after) return `Stay ~#${before}`;
  if (before > after) return `#${before} → #${after}`;
  return `#${before} → #${after}`;
}

function whatIfTitle(kind: "win_next" | "lose_next", player: string): string {
  if (kind === "win_next") return `If ${player} wins next match`;
  return `If ${player} loses next match`;
}

function whatIfDeltaCaption(
  kind: "win_next" | "lose_next",
  rosterDelta: number,
): string {
  const r = WINTER_FANTASY_RULES;
  const d = rosterDelta;
  if (kind === "win_next") {
    const capWin = r.matchWinPoints * r.captainMultiplier;
    const plainWin = r.matchWinPoints;
    if (Math.abs(d - capWin) < 0.02) {
      return `From the scoring table (v${r.version}): match win +${r.matchWinPoints} on a captain pick ×${r.captainMultiplier} captain bonus = +${capWin} WakiPoints.`;
    }
    if (Math.abs(d - plainWin) < 0.02) {
      return `From the scoring table (v${r.version}): match win +${r.matchWinPoints} on a non-captain slot.`;
    }
    return `From the same engine as /scoring-table — stacked lines (margin, upset, playoffs, etc.) when the schedule row has the data.`;
  }
  if (d < -0.005) {
    return `From the scoring table loss path (v${r.version}) — e.g. favorite upset penalty when seeds and upset flags qualify.`;
  }
  if (d > 0.005) {
    return `Rare: a projected “loss” still nudges totals up because other roster rows or meta bonuses (streaks, same-day, etc.) shift when this match is resolved — still the same table engine.`;
  }
  return `Same WakiPoints engine as the scoring table; this scenario barely moves your total once the row is decided.`;
}

function nextMatchSummary(data: DashboardData): string | null {
  const rows = data.tournament_schedules.flatMap((t) =>
    t.my_upcoming_matches.map((m) => ({
      ...m,
      tournament_name: t.tournament_name,
    })),
  );
  rows.sort((a, b) => a.event_date.localeCompare(b.event_date));
  const m = rows[0];
  if (!m) return null;
  const when = m.event_date ? new Date(m.event_date).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : m.event_date;
  return `${m.tournament_name}: vs ${m.opponent} · ${when}`;
}

export default function Dashboard({ user, onLogout }: Props) {
  const { preview, loading, error, reload: loadDashboard } = useDashboardDataRequired();

  const joined = preview ? new Date(preview.profile.joined_at).toLocaleDateString() : "--";
  const nextMatch = preview ? nextMatchSummary(preview) : null;
  const pulse = preview?.fantasy_pulse;

  const maxProgressPts = useMemo(() => {
    if (!pulse?.progress.length) return 1;
    return Math.max(...pulse.progress.map((p) => p.cumulative_points), 1);
  }, [pulse?.progress]);

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
          {/* What happens next — projections (same WakiPoints engine as /scoring-table) */}
          <section className="dash-section dash-section--whatif" aria-labelledby="dash-whatif-title">
            <h2 id="dash-whatif-title" className="dash-section-title">
              What Happens Next
            </h2>
            <p className="dash-section-lead dash-section-lead--compact">
              Quick projections from the same engine as the{" "}
              <a href="/scoring-table">scoring table</a> — up to five scenarios. The number is your{" "}
              <strong>season WakiPoints change</strong> if that result posts (captain 1.5× already in the engine).
            </p>
            {(preview.fantasy_what_if ?? []).length === 0 ? (
              <p className="dash-empty">
                No undecided next matches found for your roster players in loaded schedules — check back after the draw posts upcoming rows.
              </p>
            ) : (
              <ul className="dash-whatif-list">
                {(preview.fantasy_what_if ?? []).map((s) => {
                  const delta = s.roster_waki_delta;
                  return (
                  <li
                    key={s.scenario_key}
                    className={`dash-whatif-card dash-whatif--${s.impact}${s.kind === "lose_next" ? " dash-whatif--downside" : ""}`}
                  >
                    <div className="dash-whatif-top">
                      <span className="dash-whatif-emoji" aria-hidden>
                        {s.impact === "high" ? "🔥" : s.impact === "risk" ? "⚠️" : "📈"}
                      </span>
                      <div className="dash-whatif-head">
                        <div className="dash-whatif-title-row">
                          <span className={`dash-whatif-kind dash-whatif-kind--${s.kind === "win_next" ? "win" : "lose"}`}>
                            {s.kind === "win_next" ? "Win" : "Loss"}
                          </span>
                          <div className="dash-whatif-title">{whatIfTitle(s.kind, s.player_name)}</div>
                        </div>
                        <div className="dash-whatif-meta">
                          {s.tournament_name} · {s.division_label}
                          <br />
                          vs {s.opponent} · {s.event_date ? new Date(s.event_date).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : s.event_date}
                        </div>
                      </div>
                      <div className="dash-whatif-delta">
                        <span className={delta >= 0 ? "dash-whatif-pts-pos" : "dash-whatif-pts-neg"}>
                          {delta >= 0 ? "+" : ""}
                          {delta} pts
                        </span>
                        <span className="dash-whatif-delta-sub">season total Δ</span>
                        <span className="dash-whatif-rankline">{formatRankJump(s.rank_before, s.rank_after)}</span>
                      </div>
                    </div>
                    <div className="dash-whatif-foot">{s.match_summary}</div>
                    <p className="dash-whatif-caption">{whatIfDeltaCaption(s.kind, delta)}</p>
                  </li>
                  );
                })}
              </ul>
            )}
          </section>

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

          <div className="dash-mid-grid">
            {/* Section 4 — Leaderboard */}
            <section className="dash-section dash-section--tight" aria-labelledby="dash-lb-title">
              <h2 id="dash-lb-title" className="dash-section-title">
                Leaderboard
              </h2>
              {pulse.leaderboard.length === 0 ? (
                <p className="dash-empty">No one on the board yet.</p>
              ) : (
                <ol className="dash-lb-list">
                  {pulse.leaderboard.map((row) => (
                    <li
                      key={`${row.rank}-${row.display_name}`}
                      className={`dash-lb-row${row.is_me ? " dash-lb-row--me" : ""}`}
                    >
                      <span className="dash-lb-rank">#{row.rank}</span>
                      <span className="dash-lb-name">{row.is_me ? "You" : row.display_name}</span>
                      <span className="dash-lb-pts">{row.points} pts</span>
                    </li>
                  ))}
                </ol>
              )}
              {pulse.my_rank != null && pulse.my_rank > pulse.leaderboard.length ? (
                <p className="dash-lb-foot">
                  You&apos;re <strong>#{pulse.my_rank}</strong> overall — showing top {pulse.leaderboard.length}.
                </p>
              ) : null}
            </section>

            {/* Section 5 — Trend */}
            <section className="dash-section dash-section--tight" aria-labelledby="dash-trend-title">
              <h2 id="dash-trend-title" className="dash-section-title">
                Season Climb
              </h2>
              <p className="dash-section-lead">Cumulative WakiPoints as each tournament schedule joins the season.</p>
              <div className="dash-trend-bars">
                {pulse.progress.map((step) => (
                  <div key={step.label} className="dash-trend-row">
                    <div className="dash-trend-label">{step.label}</div>
                    <div className="dash-trend-track">
                      <div
                        className="dash-trend-fill"
                        style={{ width: `${Math.min(100, (step.cumulative_points / maxProgressPts) * 100)}%` }}
                      />
                    </div>
                    <div className="dash-trend-val">{step.cumulative_points}</div>
                  </div>
                ))}
              </div>
              <p className="dash-trend-note">Rank history charts when we store snapshots — for now, focus on points and place.</p>
            </section>
          </div>

          {/* Section 6 — Actions */}
          <section className="dash-section dash-actions" aria-labelledby="dash-actions-title">
            <h2 id="dash-actions-title" className="dash-section-title">
              What&apos;s Next
            </h2>
            <div className="dash-action-row">
              <a className="dash-main-btn dash-action-btn" href="/pick-teams">
                Pick / Edit Teams
              </a>
              <a className="dash-ghost-btn dash-action-btn" href="/scoring-table">
                Scoring Table
              </a>
            </div>
            {nextMatch ? (
              <p className="dash-next-match">
                <span className="dash-next-label">Next Match</span>
                {nextMatch}
              </p>
            ) : (
              <p className="dash-next-match dash-next-match--muted">
                Upcoming matches appear when your display name lines up with schedule players.
              </p>
            )}
            {preview.open_contests.length > 0 ? (
              <p className="dash-contests-tease">
                Tournaments in play:{" "}
                {preview.open_contests.slice(0, 3).map((c) => c.name).join(" · ")}
              </p>
            ) : null}
          </section>

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
