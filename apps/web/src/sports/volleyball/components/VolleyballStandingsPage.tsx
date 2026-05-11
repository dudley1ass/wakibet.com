import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AVP_2026_EVENTS,
  AVP_HUNTINGTON_BEACH_OPEN_EVENT_KEY,
  AVP_SOUTH_BEACH_MAY_OPEN_EVENT_KEY,
} from "@wakibet/shared";
import type { SessionUser } from "../../../App";
import { apiGet } from "../../../api";
import SportStandingsPage from "../../../components/sportStandings/SportStandingsPage";

type PlayerPoolPayload = {
  players: Array<{
    player_name: string;
    waki_cash: number;
    estimated_odds: number;
  }>;
};

export default function VolleyballStandingsPage({ user }: { user: SessionUser }) {
  const huntingtonKey = AVP_HUNTINGTON_BEACH_OPEN_EVENT_KEY;
  const southBeachKey = AVP_SOUTH_BEACH_MAY_OPEN_EVENT_KEY;
  const [selectedEventKey, setSelectedEventKey] = useState<string>(huntingtonKey);

  const playerPoolQ = useQuery({
    queryKey: ["volleyball", "player-pool", selectedEventKey] as const,
    queryFn: () =>
      apiGet<PlayerPoolPayload>(
        `/api/v1/volleyball/player-pool?event_key=${encodeURIComponent(selectedEventKey)}`,
      ),
    staleTime: 60_000,
    placeholderData: (previousData) => previousData,
  });

  const topAvpPlayers = useMemo(() => {
    const pool = playerPoolQ.data?.players ?? [];
    return [...pool].sort((a, b) => b.waki_cash - a.waki_cash).slice(0, 25);
  }, [playerPoolQ.data?.players]);

  const selectedEventLabel =
    AVP_2026_EVENTS.find((e) => e.event_key === selectedEventKey)?.name ?? "AVP";

  const hbLabel =
    AVP_2026_EVENTS.find((e) => e.event_key === huntingtonKey)?.name ?? "Huntington Beach Open";
  const pbLabel =
    AVP_2026_EVENTS.find((e) => e.event_key === southBeachKey)?.name ?? "Pompano Beach Open";

  return (
    <SportStandingsPage
      user={user}
      title="Volleyball — Standings"
      kicker="AVP 2026 · scoring leaderboard"
      backHref="/volleyball"
      backLabel="Volleyball hub"
      sportLabel="Volleyball"
      fantasyEndpoint="/api/v1/volleyball/season-leaderboard"
      fantasyQueryKey={["volleyball", "season-leaderboard"] as const}
      fantasyKicker="Wakibet · AVP 2026 fantasy"
      fantasySignInPrompt="Sign in to see the Wakibet volleyball user leaderboard."
      realWorldTitle={`Top AVP players for ${selectedEventLabel}`}
      realWorldKicker="AVP · player pool (WakiCash priced)"
      realWorldNote={
        playerPoolQ.isLoading
          ? "Loading AVP player pool…"
          : playerPoolQ.isError
            ? "Could not load AVP player pool."
            : `Top ${topAvpPlayers.length} priced players for the selected event.`
      }
      realWorldContent={
        <>
          <div style={{ marginBottom: 12 }}>
            <label className="dash-sub" style={{ display: "inline-grid", gap: 6 }}>
              Event
              <select
                value={selectedEventKey}
                onChange={(e) => setSelectedEventKey(e.target.value)}
                style={{
                  padding: "8px 12px",
                  borderRadius: 10,
                  border: "1px solid #334155",
                  background: "#0b1220",
                  color: "#e2e8f0",
                  minWidth: 280,
                }}
              >
                <option value={huntingtonKey}>{hbLabel}</option>
                <option value={southBeachKey}>{pbLabel}</option>
              </select>
            </label>
          </div>
          {playerPoolQ.isLoading || playerPoolQ.isError ? null : topAvpPlayers.length === 0 ? (
            <p className="dash-empty">No AVP players in the pool yet.</p>
          ) : (
            <div className="season-lb-table-wrap">
              <table className="season-lb-table">
                <thead>
                  <tr>
                    <th scope="col">Rank</th>
                    <th scope="col">Player</th>
                    <th scope="col" className="season-lb-th-score">WakiCash</th>
                    <th scope="col" className="season-lb-th-score">Odds</th>
                  </tr>
                </thead>
                <tbody>
                  {topAvpPlayers.map((p, i) => (
                    <tr key={`${i}-${p.player_name}`}>
                      <td className="season-lb-rank">{i + 1}</td>
                      <td className="season-lb-name">{p.player_name}</td>
                      <td className="season-lb-score">{p.waki_cash}</td>
                      <td className="season-lb-score">
                        {p.estimated_odds > 0 ? `+${p.estimated_odds}` : p.estimated_odds}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      }
    />
  );
}
