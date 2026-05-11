import { useQuery } from "@tanstack/react-query";
import type { SessionUser } from "../../App";
import { apiGet } from "../../api";

export type FantasyLbRow = {
  rank: number;
  display_name: string;
  points: number;
  is_me: boolean;
};

type FantasyPayload = {
  sport: string;
  total_players: number;
  rows: FantasyLbRow[];
};

function formatPoints(p: number): string {
  const n = Math.round(p * 100) / 100;
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
}

function FantasyBoard({
  endpoint,
  signInPrompt,
  user,
  queryKey,
}: {
  endpoint: string;
  signInPrompt: string;
  user: SessionUser | null;
  queryKey: readonly unknown[];
}) {
  const q = useQuery({
    queryKey,
    queryFn: () => apiGet<FantasyPayload>(endpoint),
    enabled: Boolean(user),
    staleTime: 30_000,
  });

  if (!user) {
    return <p className="dash-empty">{signInPrompt}</p>;
  }
  if (q.isLoading) {
    return (
      <p className="dash-loading" role="status">
        Loading user leaderboard…
      </p>
    );
  }
  if (q.isError || !q.data) {
    return <p className="dash-error">Could not load user leaderboard.</p>;
  }
  if (q.data.total_players === 0) {
    return <p className="dash-empty">No scores yet — be the first on the board once lineups lock in.</p>;
  }
  return (
    <>
      <p className="season-lb-meta">
        Showing top {Math.min(100, q.data.rows.length)} of {q.data.total_players} ranked
        {q.data.total_players === 1 ? " player" : " players"}.
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
            {q.data.rows.map((r, i) => (
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
  );
}

type Props = {
  user: SessionUser | null;
  sportLabel: string;
  fantasyEndpoint: string;
  fantasyQueryKey: readonly unknown[];
  fantasyKicker: string;
  fantasySignInPrompt: string;
  /** When true, render only the inner board (no outer section title/lead). */
  headless?: boolean;
};

export default function SportStandingsSection({
  user,
  sportLabel,
  fantasyEndpoint,
  fantasyQueryKey,
  fantasyKicker,
  fantasySignInPrompt,
  headless,
}: Props) {
  const board = (
    <div style={{ marginTop: headless ? 0 : 14 }}>
      <p className="season-lb-kicker">{fantasyKicker}</p>
      <h3 className="dash-section-title" style={{ fontSize: "1.1rem", margin: "4px 0 8px" }}>
        Wakibet user fantasy leaderboard
      </h3>
      <FantasyBoard
        endpoint={fantasyEndpoint}
        queryKey={fantasyQueryKey}
        signInPrompt={fantasySignInPrompt}
        user={user}
      />
    </div>
  );

  if (headless) return board;

  return (
    <section
      id="standings"
      className="dash-section sport-standings"
      aria-labelledby="sport-standings-title"
      style={{ scrollMarginTop: 16 }}
    >
      <h2 id="sport-standings-title" className="dash-section-title">
        {sportLabel} standings
      </h2>
      <p className="dash-section-lead">Where Wakibet players rank by fantasy points and lineup activity.</p>
      {board}
    </section>
  );
}
