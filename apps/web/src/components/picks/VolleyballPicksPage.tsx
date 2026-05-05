import { Link } from "react-router-dom";
import { Flag, Target, Trophy, Zap, Bomb } from "lucide-react";
import { Hero, PickCard, PicksDashboardBar, PlayerRow } from "./picksUi";

export default function VolleyballPicksPage() {
  return (
    <main className="picks-root min-h-screen bg-slate-950 px-4 py-8 text-white md:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <PicksDashboardBar />

        <Hero
          sport="Volleyball fantasy picks"
          title="Best Volleyball picks — Huntington Beach Open"
          subtitle="Favor teams with stable side-out rates and clean error profiles. Captain your highest ceiling player and balance value around that anchor."
          badge="AVP Heritage · Huntington Beach"
          ctaHref="/volleyball"
          ctaText="Build volleyball lineup"
          icon={Flag}
        />

        <div className="grid gap-5 md:grid-cols-3">
          <PickCard icon={Trophy} title="Top picks" accent="text-yellow-400">
            <PlayerRow name="Molly Shaw" note="Reliable point pressure with strong ace upside in clean weather windows." />
            <PlayerRow name="Corinne Quiggle" note="High floor profile for long tournament runs and captain safety." />
          </PickCard>
          <PickCard icon={Zap} title="Value picks" accent="text-emerald-400">
            <PlayerRow name="Julia Scoles" note="Strong transition scoring and value if salary lags recent form." />
            <PlayerRow name="Megan Kraft" note="Defensive consistency adds steady dig and conversion opportunities." />
          </PickCard>
          <PickCard icon={Bomb} title="Sleepers" accent="text-red-400">
            <PlayerRow name="Toni Rodriguez" note="Volatile but can spike leaderboard jumps with upset paths." />
            <PlayerRow name="Kristen Nuss" note="High event volatility can create ownership leverage." />
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
