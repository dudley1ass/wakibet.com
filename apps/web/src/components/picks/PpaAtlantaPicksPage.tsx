import { Bomb, CircleDot, Target, Trophy, Zap } from "lucide-react";

import { Hero, PickCard, PicksDashboardBar, PlayerRow, WakiOddsPanel } from "./picksUi";

export default function PpaAtlantaPicksPage() {
  return (
    <main className="picks-root min-h-screen bg-slate-950 px-4 py-8 text-white md:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <PicksDashboardBar />
        <Hero
          sport="Pickleball Fantasy Picks"
          title="Best Pickleball Picks This Week"
          subtitle="For PPA Atlanta, the best fantasy picks are players who can stack match wins and advance deep. Finalists usually beat one-match upset picks."
          badge="PPA Atlanta Championships"
          ctaHref="/pick-teams"
          ctaText="Build Pickleball Lineup"
          icon={CircleDot}
        />
        <WakiOddsPanel
          labelA="Anna Leigh Waters + Ben Johns"
          labelB="Anna Bright + Federico Staksrud"
          ratingA={1665}
          ratingB={1535}
          market="pickleball"
        />

        <div className="grid gap-5 md:grid-cols-3">
          <PickCard icon={Trophy} title="Top Picks" accent="text-yellow-400">
            <PlayerRow name="Anna Leigh Waters" note="Highest floor in the field and the safest deep-run pick." />
            <PlayerRow name="Ben Johns" note="Reliable finalist upside with strong progression scoring potential." />
          </PickCard>

          <PickCard icon={Zap} title="Value Picks" accent="text-emerald-400">
            <PlayerRow
              name="Federico Staksrud"
              note="Consistent deep-run threat and strong value if priced below the top tier."
            />
            <PlayerRow name="Anna Bright" note="Strong across formats with upside to pile up WakiPoints." />
          </PickCard>

          <PickCard icon={Bomb} title="Sleepers" accent="text-red-400">
            <PlayerRow name="Hayden Patriquin" note="Aggressive style creates upset and margin bonus potential." />
            <PlayerRow name="Tyra Black" note="High volatility, but dangerous if she gets rolling." />
          </PickCard>
        </div>

        <section className="rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-xl md:p-8">
          <div className="mb-4 flex items-center gap-3">
            <Target className="h-6 w-6 text-yellow-400" />
            <h2 className="text-2xl font-black text-white">Lineup Strategy</h2>
          </div>
          <ul className="grid gap-3 text-slate-300 md:grid-cols-3">
            <li className="rounded-xl bg-slate-800 p-4">Prioritize players who can reach semifinals or finals.</li>
            <li className="rounded-xl bg-slate-800 p-4">Mix elite picks with value players to stay under 100 WakiCash.</li>
            <li className="rounded-xl bg-slate-800 p-4">Use sleepers when upset and margin bonuses can swing the leaderboard.</li>
          </ul>
        </section>
      </div>
    </main>
  );
}
