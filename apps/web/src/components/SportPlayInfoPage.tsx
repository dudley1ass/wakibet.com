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
          <strong>WakiBet WSOP Fantasy</strong> uses a <strong>100 WakiCash</strong> salary cap and{" "}
          <strong>six-player</strong> lineups for Las Vegas WSOP slates. No real-money wagering — WakiCash is only your
          fantasy budget.
        </p>
        <h3>WakiCash</h3>
        <ul>
          <li>
            Spend up to <strong>100 WakiCash</strong> on exactly <strong>6 unique</strong> players from each slate&apos;s
            curated pool (typically <strong>50–150</strong> names). Player prices usually fall between <strong>5 and 30</strong>{" "}
            WakiCash by tier.
          </li>
          <li>
            Lineups must be at or under cap, no duplicates, and <strong>lock when the slate begins</strong>.
          </li>
        </ul>
        <h3>Scoring</h3>
        <ul>
          <li>
            Finish-based <strong>base points</strong> (cash, depth, final table, top 3, bracelet) — you get your{" "}
            <strong>best</strong> tier only, not a running sum of every row.
          </li>
          <li>
            <strong>V1:</strong> the featured Main Event slate applies the flagship <strong>×1.50</strong> multiplier to base
            finish points; more event types can follow.
          </li>
          <li>
            Optional <strong>bonuses</strong> (bracelet bonus, chip leader, multi-cash, sleeper final table) when the data
            supports them.
          </li>
          <li>
            <strong>Lineup score</strong> = sum of all six players&apos; fantasy scores after rounding rules.
          </li>
        </ul>
        <p className="scoring-foot">
          Full tables, multipliers, and MVP formula: <a href="/poker/scoring">WSOP fantasy scoring table</a>. Hub:{" "}
          <a href="/poker">Poker fantasy</a> · <a href="/fantasy-rules">How fantasy works</a>.
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
