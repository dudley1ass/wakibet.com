/**
 * Upserts the Würth 400 (Texas) Cup week for May 3, 2026 — enables weekly picks + dashboard week focus.
 *
 * Usage (repo root):
 *   pnpm --filter @wakibet/api run db:seed:nascar-week-wurth400
 */
import { prisma } from "../src/lib/prisma.js";
import { WURTH400_TEXAS_MAY2026 } from "../src/sports/nascar/lib/nascarScheduledWeeks.js";

async function main(): Promise<void> {
  const w = WURTH400_TEXAS_MAY2026;
  const row = await prisma.nascarWeek.upsert({
    where: { weekKey: w.weekKey },
    create: {
      weekKey: w.weekKey,
      seasonYear: w.seasonYear,
      raceName: w.raceName,
      trackName: w.trackName,
      raceStartAt: w.raceStartAt,
      lockAt: w.lockAt,
      isClosed: false,
    },
    update: {
      seasonYear: w.seasonYear,
      raceName: w.raceName,
      trackName: w.trackName,
      raceStartAt: w.raceStartAt,
      lockAt: w.lockAt,
      isClosed: false,
    },
  });
  console.log("NASCAR week upserted:", row.weekKey, row.raceName, "at", row.trackName);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => void prisma.$disconnect());
