import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../api";
import { trackPublicLeaderboardView } from "../lib/analytics";
import "./dashboard.css";

const SPORTS = [
  { key: "pickleball", label: "Pickleball" },
  { key: "lacrosse", label: "Lacrosse" },
  { key: "volleyball", label: "Volleyball" },
  { key: "poker", label: "WSOP" },
] as const;

type SportKey = (typeof SPORTS)[number]["key"];

type LeaderboardPayload = {
  sport: SportKey;
  total_players: number;
  rows: { rank: number; display_name: string; points: number }[];
};

function formatPoints(p: number): string {
  const n = Math.round(p * 100) / 100;
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
}

export default function PublicLeaderboardPage() {
  const { sport: sportParam } = useParams<{ sport?: string }>();
  const sport: SportKey = SPORTS.some((s) => s.key === sportParam) ? (sportParam as SportKey) : "pickleball";

  const q = useQuery({
    queryKey: ["public", "season-leaderboard", sport] as const,
    queryFn: () => apiGet<LeaderboardPayload>(`/api/v1/public/season-leaderboard?sport=${sport}`),
    staleTime: 30_000,
  });

  useEffect(() => {
    trackPublicLeaderboardView(sport);
  }, [sport]);

  return (
    <div className="pick-teams-shell">
      <header className="pick-teams-head">
        <div>
          <p className="season-lb-kicker">Public leaderboard · no login required</p>
          <h1 className="pick-teams-title">Who&apos;s winning on WakiBet</h1>
          <p className="pick-teams-sub">
            See how players rank before you build your own lineup. Create a free account to join the board.
          </p>
        </div>
        <div className="dash-head-actions">
          <Link className="dash-main-btn" to="/pick-teams">
            Build lineup
          </Link>
          <Link className="dash-ghost-btn" to="/">
            Home
          </Link>
        </div>
      </header>

      <nav className="rost-actions" aria-label="Sport" style={{ marginBottom: 12, flexWrap: "wrap" }}>
        {SPORTS.map((s) => (
          <Link
            key={s.key}
            className={s.key === sport ? "dash-main-btn" : "dash-ghost-btn"}
            to={`/leaderboard/${s.key}`}
          >
            {s.label}
          </Link>
        ))}
      </nav>

      {q.isLoading && (
        <p className="dash-loading" role="status">
          Loading leaderboard…
        </p>
      )}
      {q.error && <p className="dash-error">{(q.error as Error).message}</p>}
      {q.data && q.data.total_players === 0 && (
        <p className="dash-empty">
          No scores on the board yet for {sport}.{" "}
          <Link to="/pick-teams">Be the first — build a lineup</Link>.
        </p>
      )}
      {q.data && q.data.total_players > 0 && (
        <>
          <p className="season-lb-meta">
            Top {Math.min(100, q.data.rows.length)} of {q.data.total_players} players · updated live from saved lineups.
          </p>
          <div className="season-lb-table-wrap">
            <table className="season-lb-table">
              <thead>
                <tr>
                  <th scope="col">Rank</th>
                  <th scope="col">Player</th>
                  <th scope="col" className="season-lb-th-score">
                    Score
                  </th>
                </tr>
              </thead>
              <tbody>
                {q.data.rows.map((r) => (
                  <tr key={`${r.rank}-${r.display_name}`}>
                    <td className="season-lb-rank">{r.rank}</td>
                    <td className="season-lb-name">{r.display_name}</td>
                    <td className="season-lb-score">{formatPoints(r.points)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
