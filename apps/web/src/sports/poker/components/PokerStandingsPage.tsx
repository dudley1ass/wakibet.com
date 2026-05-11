import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import type { SessionUser } from "../../../App";
import { apiGet } from "../../../api";
import SportStandingsPage from "../../../components/sportStandings/SportStandingsPage";

type WsopLeaderboardPlayerPayload = {
  wsop_rank: number;
  player_name: string;
  country: string;
  earnings_usd: number;
  bracelets: number;
  rings: number;
  cashes: number;
};

type WorldRankingsPayload = {
  players: Array<{ rank: number; country: string; player_name: string; rating: number }>;
  wsop_leaderboard_top_50: WsopLeaderboardPlayerPayload[];
  wsop_players_not_in_world_top_200: WsopLeaderboardPlayerPayload[];
  generated_at: string;
};

function fmtUsd(n: number): string {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

export default function PokerStandingsPage({ user }: { user: SessionUser }) {
  const rankingsQ = useQuery({
    queryKey: ["poker", "world-rankings"] as const,
    queryFn: () => apiGet<WorldRankingsPayload>("/api/v1/poker/world-rankings"),
    staleTime: 300_000,
  });

  const wsopBoard = rankingsQ.data?.wsop_leaderboard_top_50 ?? [];

  return (
    <SportStandingsPage
      user={user}
      title="Poker — Standings"
      kicker="WSOP 2026 · scoring leaderboard"
      backHref="/poker/pick"
      backLabel="WSOP fantasy"
      sportLabel="Poker"
      fantasyEndpoint="/api/v1/poker/season-leaderboard"
      fantasyQueryKey={["poker", "season-leaderboard"] as const}
      fantasyKicker="Wakibet · WSOP 2026 fantasy"
      fantasySignInPrompt="Sign in to see the Wakibet poker user leaderboard."
      realWorldTitle="WSOP.com-style leaderboard (top 50)"
      realWorldKicker="World Series of Poker · earnings board"
      realWorldNote={
        rankingsQ.isLoading
          ? "Loading WSOP leaderboard…"
          : rankingsQ.isError
            ? "Could not load WSOP leaderboard data."
            : "Snapshot from the WSOP site’s earnings-driven board — not the same methodology as the global composite index."
      }
      realWorldContent={
        rankingsQ.isLoading || rankingsQ.isError ? null : (
          <>
            <p className="dash-sub" style={{ marginBottom: 8 }}>
              <Link to="/articles/poker-which-poker-ranking-is-real">Why lists disagree →</Link>
            </p>
            <div style={{ overflowX: "auto", maxHeight: 480, overflowY: "auto" }}>
              <table className="dash-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Player</th>
                    <th>Country</th>
                    <th>Earnings</th>
                    <th>B / R / Cashes</th>
                  </tr>
                </thead>
                <tbody>
                  {wsopBoard.map((p) => (
                    <tr key={`wsop-${p.wsop_rank}-${p.player_name}`}>
                      <td>{p.wsop_rank}</td>
                      <td>{p.player_name}</td>
                      <td>{p.country}</td>
                      <td>{fmtUsd(p.earnings_usd)}</td>
                      <td>
                        {p.bracelets} / {p.rings} / {p.cashes}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )
      }
    />
  );
}
