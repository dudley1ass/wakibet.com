import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Flag, CircleDot, Target, Trophy, Zap, Bomb } from "lucide-react";
import { Link } from "react-router-dom";
import { NASCAR_CUP_SCHEDULE_SEASON_YEAR } from "@wakibet/shared";
import { apiGet } from "../../api";
import { nascarFocusWeek, type NascarWeekRow } from "../../sports/nascar/lib/dashboardNascar";
import { Hero, PickCard, PicksDashboardBar, PlayerRow, WakiOddsPanel } from "./picksUi";

type NascarWeeksPayload = { season: string; weeks: NascarWeekRow[] };

export default function WeekPicksHubPage() {
  const seasonYear = NASCAR_CUP_SCHEDULE_SEASON_YEAR;
  const weeksQ = useQuery({
    queryKey: ["nascar", "weeks", seasonYear, "week-picks-hub"] as const,
    queryFn: () => apiGet<NascarWeeksPayload>(`/api/v1/nascar/weeks?season_year=${seasonYear}`),
  });
  const focusWeek = useMemo(() => nascarFocusWeek(weeksQ.data?.weeks ?? []), [weeksQ.data?.weeks]);
  const nascarRaceLine =
    weeksQ.isLoading && !weeksQ.data
      ? "Loading NASCAR schedule…"
      : focusWeek
        ? `${focusWeek.race_name} · ${focusWeek.track}`
        : weeksQ.data?.weeks?.length
          ? "Cup Series — see hub for the full schedule"
          : "Cup Series weekly picks";
  const nascarHubTo = focusWeek ? `/nascar?week_key=${encodeURIComponent(focusWeek.week_key)}` : "/nascar";

  return (
    <main className="picks-root min-h-screen bg-slate-950 px-4 py-8 text-white md:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <PicksDashboardBar />

        <section className="rounded-2xl border border-slate-600 bg-slate-900/80 p-5 shadow-xl md:p-6">
          <h2 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">This week on WakiBet</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-yellow-500/25 bg-slate-950/60 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-yellow-300">Pickleball</p>
              <p className="mt-1 text-lg font-black text-white">MLP Dallas 2026</p>
              <p className="mt-2 text-sm text-slate-300">Winter fantasy lineups — build five picks per division under 100 WakiCash.</p>
              <Link className="mt-3 inline-block text-sm font-bold text-yellow-300 underline underline-offset-2" to="/pick-teams">
                Enter picks →
              </Link>
            </div>
            <div className="rounded-xl border border-emerald-500/25 bg-slate-950/60 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-emerald-300">NASCAR Cup</p>
              <p className="mt-1 text-lg font-black text-white">{nascarRaceLine}</p>
              <p className="mt-2 text-sm text-slate-300">Five-driver lineup with one captain — scores after each race locks.</p>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm font-bold">
                <Link className="text-emerald-300 underline underline-offset-2" to={nascarHubTo}>
                  NASCAR hub →
                </Link>
                <Link className="text-slate-300 underline underline-offset-2" to="/nascar-texas-picks">
                  Picks write-up →
                </Link>
              </div>
            </div>
          </div>
        </section>

        <Hero
          sport="Pickleball fantasy picks"
          title="Best Pickleball picks — MLP Dallas"
          subtitle="Major League Pickleball rewards teams that stack wins in pool play and carry momentum into bracket day. Prioritize players with deep-run paths and clean matchup schedules."
          badge="MLP Dallas 2026"
          ctaHref="/pick-teams"
          ctaText="Build pickleball lineup"
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
          <PickCard icon={Trophy} title="Top picks" accent="text-yellow-400">
            <PlayerRow name="Anna Leigh Waters" note="Highest floor in the field and the safest deep-run pick." />
            <PlayerRow name="Ben Johns" note="Reliable finalist upside with strong progression scoring potential." />
          </PickCard>

          <PickCard icon={Zap} title="Value picks" accent="text-emerald-400">
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
            <Flag className="h-6 w-6 text-emerald-400" aria-hidden />
            <h2 className="text-2xl font-black text-white">NASCAR — this week&apos;s race</h2>
          </div>
          <p className="max-w-3xl text-slate-300">
            {weeksQ.isError
              ? "Could not load the schedule. Open the NASCAR hub for the active week."
              : focusWeek
                ? `Focus week: ${focusWeek.race_name} at ${focusWeek.track}. Lock time follows the official schedule — set your lineup and tiebreakers before the green flag.`
                : "Open the NASCAR hub to see the full 2026 schedule and the week that accepts lineups."}
          </p>
          <Link
            to={nascarHubTo}
            className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3 font-black text-white shadow-lg transition hover:bg-emerald-500"
          >
            Open NASCAR hub
          </Link>
        </section>

        <section className="rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-xl md:p-8">
          <div className="mb-4 flex items-center gap-3">
            <Target className="h-6 w-6 text-yellow-400" />
            <h2 className="text-2xl font-black text-white">Lineup strategy (pickleball)</h2>
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
