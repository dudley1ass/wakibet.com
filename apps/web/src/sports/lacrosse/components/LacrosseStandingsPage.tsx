import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { SessionUser } from "../../../App";
import SportStandingsPage from "../../../components/sportStandings/SportStandingsPage";
import { parsePllCsv } from "../lib/lacrossePower";

export default function LacrosseStandingsPage({ user }: { user: SessionUser }) {
  const csvQ = useQuery({
    queryKey: ["lacrosse", "pll-csv"] as const,
    queryFn: async () => {
      const r = await fetch("/data/pll-player-stats.csv");
      if (!r.ok) throw new Error("Could not load PLL player data.");
      return r.text();
    },
    staleTime: 60 * 60 * 1000,
  });
  const csvRows = useMemo(() => (csvQ.data ? parsePllCsv(csvQ.data) : []), [csvQ.data]);

  const topPllScorers = useMemo(() => {
    if (csvRows.length === 0) return [];
    return [...csvRows]
      .filter((r) => r.gamesPlayed > 0 || r.points > 0)
      .sort((a, b) => b.points - a.points)
      .slice(0, 25)
      .map((r) => ({
        name: `${r.firstName} ${r.lastName}`.trim(),
        team: r.team,
        position: r.position,
        gamesPlayed: r.gamesPlayed,
        points: r.points,
        goals: r.totalGoals,
        assists: r.assists,
      }));
  }, [csvRows]);

  return (
    <SportStandingsPage
      user={user}
      title="Lacrosse — Standings"
      kicker="PLL 2026 · scoring leaderboard"
      backHref="/lacrosse"
      backLabel="Lacrosse hub"
      sportLabel="Lacrosse"
      fantasyEndpoint="/api/v1/lacrosse/season-leaderboard"
      fantasyQueryKey={["lacrosse", "season-leaderboard"] as const}
      fantasyKicker="Wakibet · PLL fantasy"
      fantasySignInPrompt="Sign in to see the Wakibet lacrosse user leaderboard."
      realWorldTitle="Top PLL scorers (real-world)"
      realWorldKicker="Premier Lacrosse League · season points"
      realWorldNote={
        csvQ.isPending
          ? "Loading PLL player stats…"
          : csvQ.isError
            ? "Could not load PLL player stats."
            : `Top ${topPllScorers.length} by Points · live from the PLL player stats feed.`
      }
      realWorldContent={
        csvQ.isPending || csvQ.isError ? null : topPllScorers.length === 0 ? (
          <p className="dash-empty">No PLL stat rows available yet.</p>
        ) : (
          <div className="season-lb-table-wrap">
            <table className="season-lb-table">
              <thead>
                <tr>
                  <th scope="col">Rank</th>
                  <th scope="col">Player</th>
                  <th scope="col">Team</th>
                  <th scope="col">Pos</th>
                  <th scope="col" className="season-lb-th-score">G/A</th>
                  <th scope="col" className="season-lb-th-score">Points</th>
                </tr>
              </thead>
              <tbody>
                {topPllScorers.map((p, i) => (
                  <tr key={`${i}-${p.name}`}>
                    <td className="season-lb-rank">{i + 1}</td>
                    <td className="season-lb-name">{p.name}</td>
                    <td>{p.team}</td>
                    <td>{p.position}</td>
                    <td className="season-lb-score">{p.goals} / {p.assists}</td>
                    <td className="season-lb-score">{p.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      }
    />
  );
}
