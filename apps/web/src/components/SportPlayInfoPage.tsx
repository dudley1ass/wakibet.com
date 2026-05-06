import type { ReactNode } from "react";
import { Navigate, useParams } from "react-router-dom";
import { StaticLayout } from "./StaticPages";

const SPORTS = ["pickleball", "volleyball", "lacrosse", "poker"] as const;
type SportKey = (typeof SPORTS)[number];

function isSportKey(s: string): s is SportKey {
  return (SPORTS as readonly string[]).includes(s);
}

const PAGES: Record<
  SportKey,
  {
    title: string;
    body: ReactNode;
  }
> = {
  pickleball: {
    title: "Pickleball — how play works",
    body: (
      <>
        <p>
          Pickleball fantasy on WakiBet is built around <strong>WakiCash</strong> (your lineup budget) and{" "}
          <strong>WakiPoints</strong> (what your picks earn from real tournament results).
        </p>
        <h3>WakiCash</h3>
        <ul>
          <li>
            You spend WakiCash on players when you build lineups for scheduled events and tournaments. Typical budgets use{" "}
            <strong>100 WakiCash</strong> per tournament or per division lineup, depending on the format loaded in the app.
          </li>
          <li>
            Player prices reflect tier and strength bands — stars cost more, value picks leave room under the cap.
          </li>
          <li>
            You choose a <strong>captain</strong> where the format allows; the captain earns a multiplier on WakiPoints for
            that lineup (see global rules for the exact factor).
          </li>
        </ul>
        <h3>WakiPoints</h3>
        <ul>
          <li>
            After matches finish, scoring turns results into WakiPoints — wins, margins, progression through the bracket,
            medals where applicable, and listed bonuses.
          </li>
          <li>
            Season play adds up your WakiPoints across the events you enter; skipping a stop usually means zero points for
            that tournament, not a penalty row.
          </li>
        </ul>
        <p className="scoring-foot">
          Shared lineup rules and locks: <a href="/fantasy-rules">How fantasy works</a>. Full pickleball point chart:{" "}
          <a href="/scoring-table">WakiPoints table</a>.
        </p>
      </>
    ),
  },
  volleyball: {
    title: "Volleyball — how play works",
    body: (
      <>
        <p>
          Beach volleyball on WakiBet uses the same fantasy shell as other sports: <strong>WakiCash</strong> to build a
          roster under a salary cap, then <strong>WakiPoints</strong> from how your players perform in the real event.
        </p>
        <h3>WakiCash</h3>
        <ul>
          <li>
            Each tournament lineup uses a <strong>100 WakiCash</strong> cap unless the slate specifies otherwise.
          </li>
          <li>
            You fill <strong>five roster spots</strong>: one captain (scores extra WakiPoints) and four flex players.
          </li>
          <li>
            Every listed player has a WakiCash salary from recent performance and projections — mix stars and value to stay
            at or under the cap.
          </li>
          <li>When the event starts, your saved lineup locks.</li>
        </ul>
        <h3>WakiPoints</h3>
        <ul>
          <li>
            Scoring follows the volleyball table in the app (placement, match results, and bonuses defined for that
            format).
          </li>
          <li>Your event score feeds season-long totals the same way as other WakiBet sports.</li>
        </ul>
        <p className="scoring-foot">
          Volleyball scoring detail: <a href="/volleyball/scoring">Volleyball scoring table</a>. Hub (lineups when signed
          in): <a href="/volleyball">Volleyball hub</a>.
        </p>
      </>
    ),
  },
  lacrosse: {
    title: "Lacrosse — how play works",
    body: (
      <>
        <p>
          PLL-style lacrosse slates on WakiBet are pick-based: you allocate <strong>WakiCash</strong> across game lines,
          then outcomes convert to returns tied to the slate&apos;s odds model — not the same grid as pickleball match
          WakiPoints, but the same virtual economy (no real-money wagering).
        </p>
        <h3>WakiCash</h3>
        <ul>
          <li>
            You build a small set of picks (winner, spread, total, and wild-card style slots on each slate) from the lines
            offered for that week&apos;s games.
          </li>
          <li>
            You have <strong>100 WakiCash</strong> total to spread across those picks, with a typical{" "}
            <strong>maximum per pick</strong> (often 40) so one selection cannot swallow the whole budget.
          </li>
          <li>Saved stakes lock when games go live — same discipline as other sports on WakiBet.</li>
        </ul>
        <h3>Points and payouts</h3>
        <ul>
          <li>
            Each side carries implied odds; your stake and the result determine how your slate pays out in fantasy units.
          </li>
          <li>
            Team rating tables and methodology for lacrosse are documented separately from pickleball WakiPoints — see the
            lacrosse scoring reference below.
          </li>
        </ul>
        <p className="scoring-foot">
          Ratings and payout logic: <a href="/lacrosse/scoring">Lacrosse scoring table</a>. Active slate (when available):{" "}
          <a href="/lacrosse">Lacrosse hub</a>.
        </p>
      </>
    ),
  },
  poker: {
    title: "Poker — how play works",
    body: (
      <>
        <p>
          WSOP-focused poker fantasy keeps the same tension as other WakiBet games: build a lineup under a{" "}
          <strong>WakiCash</strong> salary cap; scoring uses simple outcome tables so results are easy to follow.
        </p>
        <h3>WakiCash</h3>
        <ul>
          <li>
            Each slate gives you a roster of several players (launch configs commonly use <strong>six picks</strong>) and
            a single <strong>100 WakiCash</strong> salary cap across them.
          </li>
          <li>
            Featured slates use a curated player pool — not the entire WSOP field — so casual fans can shop stars, second
            tiers, sleepers, and a wildcard without drowning in names.
          </li>
          <li>Lineups lock when the slate rules say they lock (typically around event start).</li>
        </ul>
        <h3>WakiPoints</h3>
        <ul>
          <li>
            Each slate publishes clear point values for outcomes (deep runs, cashes, final-table appearances, etc.) — check
            the live hub for the active slate&apos;s chart.
          </li>
          <li>
            Your fantasy score for the slate is the sum of what your roster earns under that table — then leaderboards stack
            slate results like other sports seasons on WakiBet.
          </li>
        </ul>
        <p className="scoring-foot">
          Live slate list and examples: <a href="/poker">WSOP fantasy hub</a>. Global fantasy conventions:{" "}
          <a href="/fantasy-rules">How fantasy works</a>.
        </p>
      </>
    ),
  },
};

export default function SportPlayInfoPage() {
  const { sportKey } = useParams<{ sportKey: string }>();
  if (!sportKey || !isSportKey(sportKey)) {
    return <Navigate to="/" replace />;
  }
  const page = PAGES[sportKey];
  return (
    <StaticLayout title={page.title}>
      {page.body}
    </StaticLayout>
  );
}
