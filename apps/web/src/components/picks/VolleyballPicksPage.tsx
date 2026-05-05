import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AVP_HUNTINGTON_BEACH_OPEN_EVENT_KEY, AVP_SOUTH_BEACH_MAY_OPEN_EVENT_KEY } from "@wakibet/shared";
import { Flag, Target, Trophy, Zap, Bomb } from "lucide-react";
import { Hero, PickCard, PicksDashboardBar, PlayerRow } from "./picksUi";
import { apiGet } from "../../api";

type PlayerPoolPayload = {
  players: Array<{
    player_name: string;
    waki_cash: number;
    estimated_odds: number;
  }>;
};

export default function VolleyballPicksPage() {
  const huntingtonKey = AVP_HUNTINGTON_BEACH_OPEN_EVENT_KEY;
  const southBeachKey = AVP_SOUTH_BEACH_MAY_OPEN_EVENT_KEY;
  const [selectedEventKey, setSelectedEventKey] = useState<string>(huntingtonKey);
  const playerPoolQ = useQuery({
    queryKey: ["volleyball", "picks-page-player-pool", selectedEventKey] as const,
    queryFn: () =>
      apiGet<PlayerPoolPayload>(`/api/v1/volleyball/player-pool?event_key=${encodeURIComponent(selectedEventKey)}`),
    staleTime: 60_000,
    placeholderData: (previousData) => previousData,
  });
  const sortedBySalary = useMemo(
    () => [...(playerPoolQ.data?.players ?? [])].sort((a, b) => b.waki_cash - a.waki_cash || a.player_name.localeCompare(b.player_name)),
    [playerPoolQ.data?.players],
  );
  const topPicks = sortedBySalary.slice(0, 2);
  const valuePicks = sortedBySalary.filter((p) => p.waki_cash >= 18 && p.waki_cash <= 28).slice(0, 2);
  const sleeperPicks = [...sortedBySalary].reverse().slice(0, 2);
  const fmtOdds = (odds: number) => (odds > 0 ? `+${odds}` : `${odds}`);
  const eventLabel = selectedEventKey === huntingtonKey ? "Huntington Beach Open" : "South Beach May Open";

  return (
    <main className="picks-root min-h-screen bg-slate-950 px-4 py-8 text-white md:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <PicksDashboardBar />

        <Hero
          sport="Volleyball fantasy picks"
          title={`Best Volleyball picks — ${eventLabel}`}
          subtitle="Favor teams with stable side-out rates and clean error profiles. Captain your highest ceiling player and balance value around that anchor."
          badge={`AVP Heritage · ${eventLabel}`}
          ctaHref="/volleyball"
          ctaText="Build volleyball lineup"
          icon={Flag}
        />
        <section className="rounded-2xl border border-slate-700 bg-slate-900/80 p-5">
          <label className="text-sm font-bold text-slate-200">
            Tournament
            <select
              value={selectedEventKey}
              onChange={(e) => setSelectedEventKey(e.target.value)}
              className="mt-2 block w-full rounded-xl border border-slate-600 bg-slate-950 px-3 py-2 text-slate-100 md:w-96"
            >
              <option value={huntingtonKey}>Huntington Beach Open (May 14-17)</option>
              <option value={southBeachKey}>South Beach May Open (May 23-24)</option>
            </select>
          </label>
          {playerPoolQ.error instanceof Error ? <p className="mt-3 text-sm text-red-300">{playerPoolQ.error.message}</p> : null}
          {playerPoolQ.isLoading ? <p className="mt-3 text-sm text-slate-300">Loading current player odds...</p> : null}
        </section>

        <div className="grid gap-5 md:grid-cols-3">
          <PickCard icon={Trophy} title="Top picks" accent="text-yellow-400">
            {topPicks.map((p) => (
              <PlayerRow
                key={`top-${p.player_name}`}
                name={p.player_name}
                note={`Current odds ${fmtOdds(p.estimated_odds)} American • ${p.waki_cash} WC`}
              />
            ))}
          </PickCard>
          <PickCard icon={Zap} title="Value picks" accent="text-emerald-400">
            {valuePicks.map((p) => (
              <PlayerRow
                key={`value-${p.player_name}`}
                name={p.player_name}
                note={`Current odds ${fmtOdds(p.estimated_odds)} American • ${p.waki_cash} WC`}
              />
            ))}
          </PickCard>
          <PickCard icon={Bomb} title="Sleepers" accent="text-red-400">
            {sleeperPicks.map((p) => (
              <PlayerRow
                key={`sleep-${p.player_name}`}
                name={p.player_name}
                note={`Current odds ${fmtOdds(p.estimated_odds)} American • ${p.waki_cash} WC`}
              />
            ))}
          </PickCard>
        </div>

        <section className="rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-xl md:p-8">
          <div className="mb-4 flex items-center gap-3">
            <Target className="h-6 w-6 text-yellow-400" />
            <h2 className="text-2xl font-black text-white">Lineup strategy (volleyball)</h2>
          </div>
          <ul className="grid gap-3 text-slate-300 md:grid-cols-3">
            <li className="rounded-xl bg-slate-800 p-4">Captain your highest projected scorer for 1.5x upside.</li>
            <li className="rounded-xl bg-slate-800 p-4">Stay under 100 WakiCash by mixing one elite with value flex picks.</li>
            <li className="rounded-xl bg-slate-800 p-4">Avoid over-stacking one side of the bracket to reduce elimination risk.</li>
          </ul>
          <div className="mt-5">
            <Link
              to="/volleyball"
              className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3 font-black text-white shadow-lg transition hover:bg-emerald-500"
            >
              Open volleyball lineup builder
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
