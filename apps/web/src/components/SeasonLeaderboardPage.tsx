import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { NASCAR_CUP_SCHEDULE_SEASON_YEAR } from "@wakibet/shared";
import type { SessionUser } from "../App";
import { apiGet } from "../api";
import "./dashboard.css";

type LbRow = { rank: number; display_name: string; points: number; is_me: boolean };

type LeaderboardPayload = { total_players: number; rows: LbRow[] };

function formatPoints(p: number): string {
  const n = Math.round(p * 100) / 100;
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
}

function LeaderboardShell({
  user,
  title,
  kicker,
  backHref,
  backLabel,
  extraNav,
  payload,
  isLoading,
  error,
}: {
  user: SessionUser;
  title: string;
  kicker: string;
  backHref: string;
  backLabel: string;
  extraNav?: ReactNode;
  payload: LeaderboardPayload | undefined;
  isLoading: boolean;
  error: Error | null;
}) {
  return (
    <div className="pick-teams-shell">
      <header className="pick-teams-head">
        <div>
          <p className="season-lb-kicker">{kicker}</p>
          <h1 className="pick-teams-title">{title}</h1>
          <p className="pick-teams-sub">
            Signed in as <strong>{user.display_name || user.email}</strong>
          </p>
        </div>
        <div className="dash-head-actions">
          {extraNav}
          <Link className="dash-ghost-btn" to={backHref}>
            {backLabel}
          </Link>
          <Link className="dash-ghost-btn" to="/">
            Dashboard
          </Link>
        </div>
      </header>

      {error && <p className="dash-error">{error.message}</p>}
      {isLoading && (
        <p className="dash-loading" role="status">
          Loading leaderboard…
        </p>
      )}
      {!isLoading && !error && payload && (
        <>
          {payload.total_players === 0 ? (
            <p className="dash-empty">No scores yet — be the first on the board once lineups lock in.</p>
          ) : (
            <>
              <p className="season-lb-meta">
                Showing top {Math.min(100, payload.rows.length)} of {payload.total_players} ranked
                {payload.total_players === 1 ? " player" : " players"}.
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
                    {payload.rows.map((r, i) => (
                      <tr key={`${i}-${r.rank}-${r.display_name}`} className={r.is_me ? "season-lb-row--me" : undefined}>
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
        </>
      )}
    </div>
  );
}

export function PickleballSeasonLeaderboardPage({ user }: { user: SessionUser }) {
  const q = useQuery({
    queryKey: ["winter-fantasy", "season-leaderboard"] as const,
    queryFn: () =>
      apiGet<LeaderboardPayload & { sport: string }>("/api/v1/winter-fantasy/season-leaderboard"),
  });
  return (
    <LeaderboardShell
      user={user}
      title="Pickleball — Season leaderboard"
      kicker="Winter fantasy · all tournaments"
      backHref="/pick-teams"
      backLabel="Pick / Edit teams"
      extraNav={
        <Link className="dash-ghost-btn" to="/rosters">
          My rosters
        </Link>
      }
      payload={q.data}
      isLoading={q.isLoading}
      error={q.error instanceof Error ? q.error : q.error ? new Error("Could not load leaderboard.") : null}
    />
  );
}

export function NascarSeasonLeaderboardPage({ user }: { user: SessionUser }) {
  const seasonYear = NASCAR_CUP_SCHEDULE_SEASON_YEAR;
  const q = useQuery({
    queryKey: ["nascar", "season-leaderboard", seasonYear] as const,
    queryFn: () =>
      apiGet<LeaderboardPayload & { sport: string; season_year: number }>(
        `/api/v1/nascar/season-leaderboard?season_year=${seasonYear}`,
      ),
  });
  return (
    <LeaderboardShell
      user={user}
      title="NASCAR — Season leaderboard"
      kicker={`Cup ${seasonYear} · weekly lineups`}
      backHref="/nascar"
      backLabel="NASCAR hub"
      extraNav={
        <Link className="dash-ghost-btn" to="/nascar/rosters">
          My race lineups
        </Link>
      }
      payload={q.data}
      isLoading={q.isLoading}
      error={q.error instanceof Error ? q.error : q.error ? new Error("Could not load leaderboard.") : null}
    />
  );
}
