import { useCallback, useEffect, useState } from "react";
import { apiGet } from "../api";
import type { SessionUser } from "../App";
import type { DashboardData, FantasyRosterRow } from "./Dashboard";
import "./dashboard.css";

type Props = {
  user: SessionUser;
};

export default function RostersPage({ user }: Props) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setLoading(true);
      const d = await apiGet<DashboardData>("/api/v1/users/me/dashboard");
      setData(d);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load rosters.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const rosters = data?.winter_fantasy_rosters ?? [];

  return (
    <div className="rost-shell">
      <header className="rost-head">
        <div>
          <h1 className="rost-title">My rosters</h1>
          <p className="rost-sub">
            <strong>{user.display_name || user.email}</strong> — featured divisions only
          </p>
        </div>
        <div className="rost-actions">
          <button type="button" className="dash-ghost-btn" onClick={() => void load()} disabled={loading}>
            {loading ? "Refreshing…" : "Refresh"}
          </button>
          <a className="dash-ghost-btn" href="/pick-teams">
            Pick / Edit Teams
          </a>
          <a className="dash-main-btn rost-dash-link" href="/">
            Dashboard
          </a>
        </div>
      </header>

      {error && <p className="dash-error">{error}</p>}

      {loading && !data && (
        <p className="dash-loading" role="status">
          Loading rosters…
        </p>
      )}

      {data && !loading && rosters.length === 0 && (
        <div className="rost-empty dash-card">
          <p className="rost-empty-title">No saved rosters yet</p>
          <p className="rost-empty-body">
            Build a lineup in a featured division (5+ players, or 4 with 6+ matches), then save. Your tournaments and
            picks will show here.
          </p>
          <a className="dash-main-btn" href="/pick-teams">
            Go to Pick / Edit Teams
          </a>
        </div>
      )}

      {data && rosters.length > 0 && (
        <ul className="rost-list">
          {rosters.map((r) => (
            <li key={`${r.tournament_key}-${r.division_key}`}>
              <RosterCard roster={r} pointsByDivision={data.fantasy_season.by_division} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function RosterCard({
  roster,
  pointsByDivision,
}: {
  roster: FantasyRosterRow;
  pointsByDivision: DashboardData["fantasy_season"]["by_division"];
}) {
  const pts =
    pointsByDivision.find((d) => d.division_key === roster.division_key && d.tournament_key === roster.tournament_key)
      ?.roster_points ?? pointsByDivision.find((d) => d.division_key === roster.division_key)?.roster_points;

  const sortedPicks = [...roster.picks].sort((a, b) => a.slot_index - b.slot_index);

  return (
    <article className="rost-card dash-card">
      <div className="rost-card-head">
        <div>
          <div className="rost-tournament">{roster.tournament_name}</div>
          <div className="rost-meta">
            <span className="rost-badge">{roster.tournament_key}</span>
            <span className="rost-badge" title="WakiCash spent on this lineup">
              {roster.waki_cash_spent}/{roster.waki_cash_budget} WakiCash
            </span>
            {!roster.waki_lineup_complete ? (
              <span className="rost-badge rost-badge--warn" title="Save 5 picks under Pick / Edit Teams">
                {roster.picks.length} picks — needs 5
              </span>
            ) : null}
          </div>
        </div>
        {pts != null ? (
          <div className="rost-pts" title="WakiPoints for this division roster">
            {pts} <span className="rost-pts-label">WakiPoints</span>
          </div>
        ) : null}
      </div>

      <div className="rost-event">
        <span className="rost-event-label">Event</span>
        <span className="rost-event-value">
          {roster.event_type} · {roster.skill_level} / {roster.age_bracket}
        </span>
      </div>

      <div className="rost-players">
        <span className="rost-players-label">Players</span>
        <ol className="rost-pick-list">
          {sortedPicks.map((p) => (
            <li key={p.slot_index} className="rost-pick-row">
              <span className="rost-slot">#{p.slot_index + 1}</span>
              <span className="rost-name">{p.player_name}</span>
              <span className="rost-wc" title="WakiCash for this player in this division">
                {p.waki_cash ?? "—"} WC
              </span>
              {p.is_captain ? <span className="rost-cap">Captain</span> : null}
            </li>
          ))}
        </ol>
      </div>
    </article>
  );
}
