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
      slot: "winner" | "spread" | "total" | "wild";
      line_id: string;
      team_a: string;
      team_b: string;
      side: string;
      stake: number;
      odds_at_save: number;
      est_return: number;
      confidence: number;
      spread_a: number;
    }>;
    stack: { winner_line_id: string; side: "A" | "B"; players: string[] } | null;
  }>;
};

const SLOT_LABELS = ["Winner", "Spread", "Total", "Wild Card"] as const;
const SLOT_KEYS = ["winner", "spread", "total", "wild"] as const;

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
          <p className="rost-empty-body">
            Build all 4 lineup slots (Winner, Spread, Total, Wild Card), allocate WakiCash, and save to track your slate confidence.
          </p>
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
                    <p className="dash-sub" style={{ margin: "4px 0 0", fontSize: 11, textAlign: "right" }}>
                      If every pick hits
                    </p>
                  </div>
                </div>
                <div className="rost-players">
                  <span className="rost-players-label">Lineup Slots</span>
                  <ol className="rost-pick-list">
                    {SLOT_KEYS.map((slot, i) => {
                      const p = row.picks.find((x) => x.slot === slot);
                      return (
                        <li key={`${row.slate_key}-${slot}`} className="rost-pick-row">
                          <span className="rost-slot">#{i + 1}</span>
                          <span className="rost-cap">{SLOT_LABELS[i] ?? `Pick ${i + 1}`}</span>
                          {p ? (
                            <>
                              <span className="rost-name">
                                {p.team_a} vs {p.team_b} — pick {p.side === "A" ? p.team_a : p.team_b}
                              </span>
                              <span className="rost-odds">
                                {p.stake} @ {fmtOdds(p.odds_at_save)}
                              </span>
                              <span className="rost-odds">Est {p.est_return.toFixed(1)}</span>
                              <span className="rost-odds">Conf {p.confidence}</span>
                            </>
                          ) : (
                            <span className="rost-name" style={{ opacity: 0.7 }}>
                              Not saved for this slot.
                            </span>
                          )}
                        </li>
                      );
                    })}
                  </ol>
                  {row.stack ? (
                    <div style={{ marginTop: 12 }}>
                      <span className="rost-players-label">Winner stack</span>
                      <p className="dash-sub" style={{ margin: "6px 0 0", fontSize: 12 }}>
                        {(() => {
                          const winnerPick = row.picks.find((p) => p.slot === "winner");
                          const team = winnerPick ? (row.stack.side === "A" ? winnerPick.team_a : winnerPick.team_b) : "Winner team";
                          return team;
                        })()}{" "}
                        —{" "}
                        {row.stack.players.join(", ")}
                      </p>
                    </div>
                  ) : null}
                  <div style={{ marginTop: 12 }}>
                    <span className="rost-players-label">Lineup stats</span>
                    <p className="dash-sub" style={{ margin: "6px 0 0", fontSize: 12 }}>
                      Picks saved: {row.picks.length}/4 · Potential profit: {(row.est_return - row.spent_wakicash).toFixed(1)}
                    </p>
                  </div>
                </div>
              </article>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
