import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { apiGet } from "../../../api";
import type { SessionUser } from "../../../App";
import "../../../components/dashboard.css";

type Props = { user: SessionUser };

type Payload = {
  rows: Array<{
    event_key: string;
    event_name: string;
    picks: Array<{
      slot_index: number;
      player_name: string;
      is_captain: boolean;
      waki_cash: number;
    }>;
    total_salary: number;
    salary_cap: number;
    updated_at: string;
  }>;
};

export default function VolleyballRostersPage({ user }: Props) {
  const { data, isPending, error, refetch } = useQuery({
    queryKey: ["volleyball", "lineups"] as const,
    queryFn: () => apiGet<Payload>("/api/v1/volleyball/lineups"),
    staleTime: 30_000,
  });
  const err = error instanceof Error ? error.message : error ? "Could not load volleyball lineups." : null;
  const rows = data?.rows ?? [];

  return (
    <div className="rost-shell">
      <header className="rost-head">
        <div>
          <h1 className="rost-title">My Volleyball Rosters</h1>
          <p className="rost-sub">
            <strong>{user.display_name || user.email}</strong> — saved lineups by tournament event
          </p>
        </div>
        <div className="rost-actions">
          <button type="button" className="dash-ghost-btn" onClick={() => void refetch()} disabled={isPending}>
            {isPending ? "Refreshing..." : "Refresh"}
          </button>
          <Link className="dash-ghost-btn" to="/volleyball">
            Volleyball hub
          </Link>
          <Link className="dash-main-btn rost-dash-link" to="/">
            Dashboard
          </Link>
        </div>
      </header>

      {err ? <p className="dash-error">{err}</p> : null}
      {isPending && !data ? <p className="dash-loading">Loading volleyball rosters...</p> : null}
      {!isPending && rows.length === 0 ? (
        <div className="rost-empty dash-card">
          <p className="rost-empty-title">No volleyball lineups saved yet</p>
          <p className="rost-empty-body">Pick a tournament, build your 5-player roster, then save it to see it here.</p>
          <Link className="dash-main-btn" to="/volleyball">
            Open Volleyball
          </Link>
        </div>
      ) : null}

      {rows.length > 0 ? (
        <ul className="rost-list">
          {rows.map((row) => (
            <li key={row.event_key}>
              <article className="rost-card dash-card">
                <div className="rost-card-head">
                  <div className="rost-card-head-main">
                    <div className="rost-tournament">{row.event_name}</div>
                    <div className="rost-meta">
                      <span className="rost-badge">{row.event_key}</span>
                      <span className="rost-badge">
                        {row.total_salary}/{row.salary_cap} WC
                      </span>
                    </div>
                  </div>
                </div>
                <div className="rost-players">
                  <span className="rost-players-label">Players</span>
                  <ol className="rost-pick-list">
                    {row.picks.map((p) => (
                      <li key={`${row.event_key}-${p.slot_index}`} className="rost-pick-row">
                        <span className="rost-slot">#{p.slot_index + 1}</span>
                        <span className="rost-name">{p.player_name}</span>
                        <span className="rost-odds">{p.waki_cash} WC</span>
                        {p.is_captain ? <span className="rost-cap">Captain</span> : null}
                      </li>
                    ))}
                  </ol>
                </div>
              </article>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
