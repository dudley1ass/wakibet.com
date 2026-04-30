import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { apiGet } from "../../../api";
import type { SessionUser } from "../../../App";
import "../../../components/dashboard.css";

type Props = {
  user: SessionUser;
};

type Payload = {
  rows: Array<{
    slate_key: string;
    slate_name: string;
    lock_at: string;
    spent_wakicash: number;
    est_return: number;
    picks: Array<{
      line_id: string;
      team_a: string;
      team_b: string;
      side: string;
      stake: number;
      odds_at_save: number;
      est_return: number;
    }>;
  }>;
};

function fmtOdds(v: number): string {
  return v > 0 ? `+${v}` : String(v);
}

export default function LacrosseRostersPage({ user }: Props) {
  const { data, isPending, error, refetch } = useQuery({
    queryKey: ["lacrosse", "lineups"] as const,
    queryFn: () => apiGet<Payload>("/api/v1/lacrosse/lineups"),
    staleTime: 30_000,
  });
  const err = error instanceof Error ? error.message : error ? "Could not load lacrosse lineups." : null;
  const rows = data?.rows ?? [];

  return (
    <div className="rost-shell">
      <header className="rost-head">
        <div>
          <h1 className="rost-title">My Lacrosse Rosters</h1>
          <p className="rost-sub">
            <strong>{user.display_name || user.email}</strong> — saved WakiCash allocations by slate
          </p>
        </div>
        <div className="rost-actions">
          <button type="button" className="dash-ghost-btn" onClick={() => void refetch()} disabled={isPending}>
            {isPending ? "Refreshing…" : "Refresh"}
          </button>
          <Link className="dash-ghost-btn" to="/lacrosse">
            Lacrosse hub
          </Link>
          <Link className="dash-main-btn rost-dash-link" to="/">
            Dashboard
          </Link>
        </div>
      </header>

      {err ? <p className="dash-error">{err}</p> : null}
      {isPending && !data ? <p className="dash-loading">Loading lacrosse lineups…</p> : null}
      {!isPending && rows.length === 0 ? (
        <div className="rost-empty dash-card">
          <p className="rost-empty-title">No lacrosse lineups saved yet</p>
          <p className="rost-empty-body">Allocate WakiCash on the Lacrosse hub and save to track your slate confidence.</p>
          <Link className="dash-main-btn" to="/lacrosse">
            Open Lacrosse Hub
          </Link>
        </div>
      ) : null}

      {rows.length > 0 ? (
        <ul className="rost-list">
          {rows.map((row) => (
            <li key={row.slate_key}>
              <article className="rost-card dash-card">
                <div className="rost-card-head">
                  <div className="rost-card-head-main">
                    <div className="rost-tournament">{row.slate_name}</div>
                    <div className="rost-meta">
                      <span className="rost-badge">{row.slate_key}</span>
                      <span className="rost-badge">Spent {row.spent_wakicash}/100</span>
                    </div>
                  </div>
                  <div className="rost-card-head-side">
                    <div className="rost-pts">
                      {row.est_return.toFixed(1)}
                      <span className="rost-pts-label">Est return</span>
                    </div>
                  </div>
                </div>
                <div className="rost-players">
                  <span className="rost-players-label">Picks</span>
                  <ol className="rost-pick-list">
                    {row.picks.map((p, i) => (
                      <li key={`${p.line_id}-${i}`} className="rost-pick-row">
                        <span className="rost-slot">#{i + 1}</span>
                        <span className="rost-name">
                          {p.team_a} vs {p.team_b} — pick {p.side === "A" ? p.team_a : p.team_b}
                        </span>
                        <span className="rost-odds">
                          {p.stake} @ {fmtOdds(p.odds_at_save)}
                        </span>
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
