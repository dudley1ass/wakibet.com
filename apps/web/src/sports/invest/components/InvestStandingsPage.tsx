import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../../../api";
import type { SessionUser } from "../../../App";
import "../../../components/dashboard.css";

type Props = { user: SessionUser };

type LeaderboardPayload = {
  sport: "invest";
  contest_key: string;
  phase: "open" | "locked" | "settled";
  total_players: number;
  rows: { rank: number; display_name: string; points: number; is_me: boolean }[];
};

export default function InvestStandingsPage({ user }: Props) {
  const boardQ = useQuery({
    queryKey: ["invest", "season-leaderboard"] as const,
    queryFn: () => apiGet<LeaderboardPayload>("/api/v1/invest/season-leaderboard"),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const data = boardQ.data;
  const phaseLabel = data?.phase === "settled"
    ? "Final"
    : data?.phase === "locked"
      ? "Live (locked)"
      : "Open — pre-lock indicative";

  return (
    <div className="rost-shell">
      <header className="rost-head">
        <div>
          <h1 className="rost-title">Invest — Standings</h1>
          <p className="rost-sub">
            <strong>{user.display_name || user.email}</strong> — weekly pick&apos;em leaderboard
          </p>
        </div>
        <div className="rost-actions">
          <Link className="dash-ghost-btn" to="/invest">
            Invest hub
          </Link>
          <Link className="dash-ghost-btn" to="/invest/pick">
            Build portfolio
          </Link>
          <Link className="dash-ghost-btn" to="/invest/portfolios">
            My portfolios
          </Link>
          <Link className="dash-ghost-btn" to="/invest/scoring">
            Scoring table
          </Link>
          <Link className="dash-main-btn rost-dash-link" to="/">
            Dashboard
          </Link>
        </div>
      </header>

      {boardQ.isLoading ? <p className="dash-loading">Loading standings…</p> : null}
      {boardQ.isError ? <p className="dash-error">Could not load standings.</p> : null}

      {data ? (
        <p className="dash-footnote">
          Contest <strong>{data.contest_key}</strong> · {phaseLabel} · {data.total_players} player{data.total_players === 1 ? "" : "s"}
        </p>
      ) : null}

      {data && data.rows.length === 0 ? (
        <p className="rost-empty-body">
          Standings will fill in once weekly contests settle. Score = portfolio return % vs $
          {(100_000).toLocaleString()} starting bank.
        </p>
      ) : null}

      {data && data.rows.length > 0 ? (
        <ul className="rost-list">
          {data.rows.map((r) => (
            <li key={r.rank}>
              <article className={`rost-card dash-card${r.is_me ? " dash-card--me" : ""}`}>
                <div className="rost-card-head">
                  <div className="rost-card-head-main">
                    <div className="rost-tournament">
                      #{r.rank} {r.display_name}
                    </div>
                    <div className="rost-meta">
                      <span className="rost-badge">{r.points.toFixed(2)}%</span>
                    </div>
                  </div>
                </div>
              </article>
            </li>
          ))}
        </ul>
      ) : null}

      <p className="dash-footnote">
        Free stock-picking contest using virtual portfolios. No real money is invested. Not investment advice.
      </p>
    </div>
  );
}
