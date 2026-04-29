import { Bomb, DollarSign, Flag, Target, Trophy } from "lucide-react";

import { Hero, PickCard, PicksDashboardBar, PlayerRow } from "./picksUi";

export default function NascarTexasPicksPage() {
  return (
    <main className="picks-root min-h-screen bg-slate-950 px-4 py-8 text-white md:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <PicksDashboardBar />
        <Hero
          sport="NASCAR Fantasy Picks"
          title="Best NASCAR Picks This Week"
          subtitle="Texas Motor Speedway rewards speed, clean air, track position, and drivers who can gain spots late. Build your lineup under 100 WakiCash and chase the leaderboard."
          badge="Texas Motor Speedway"
          ctaHref="/nascar"
          ctaText="Build NASCAR Lineup"
          icon={Flag}
        />

        <div className="grid gap-5 md:grid-cols-3">
          <PickCard icon={Trophy} title="Top Picks" accent="text-yellow-400">
            <PlayerRow name="William Byron" note="Strong intermediate-track profile with top-five and laps-led upside." />
            <PlayerRow name="Kyle Larson" note="High ceiling. If he gets clean air, he can stack dominator points." />
            <PlayerRow name="Denny Hamlin" note="Veteran floor, strong race management, and consistent top-10 potential." />
          </PickCard>

          <PickCard icon={DollarSign} title="Value Picks" accent="text-emerald-400">
            <PlayerRow name="Ross Chastain" note="Aggressive late-race upside and position-gain potential." />
            <PlayerRow name="Ty Gibbs" note="Good upside if priced below the elite tier." />
            <PlayerRow name="Chris Buescher" note="Steady value play who can sneak into the top 10." />
          </PickCard>

          <PickCard icon={Bomb} title="Sleepers" accent="text-red-400">
            <PlayerRow name="Noah Gragson" note="Risky, but useful if he starts deep and can gain positions." />
            <PlayerRow name="Daniel Suárez" note="Can outperform expectations on intermediate tracks." />
          </PickCard>
        </div>

        <section className="rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-xl md:p-8">
          <div className="mb-4 flex items-center gap-3">
            <Target className="h-6 w-6 text-yellow-400" />
            <h2 className="text-2xl font-black text-white">Lineup Strategy</h2>
          </div>
          <ul className="grid gap-3 text-slate-300 md:grid-cols-3">
            <li className="rounded-xl bg-slate-800 p-4">Start with one driver who can lead laps.</li>
            <li className="rounded-xl bg-slate-800 p-4">Add value drivers who can gain positions.</li>
            <li className="rounded-xl bg-slate-800 p-4">Do not spend your whole 100 WakiCash on favorites.</li>
          </ul>
        </section>
      </div>
    </main>
  );
}
