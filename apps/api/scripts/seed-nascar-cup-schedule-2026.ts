/**
 * Upserts full 2026 NASCAR Cup schedule into `NascarWeek` (upcoming races for hub + lineups).
 *
 * Usage:
 *   pnpm --filter @wakibet/api run db:seed:nascar-schedule-2026
 */
import { prisma } from "../src/lib/prisma.js";
import { CUP_2026_SCHEDULE } from "../src/sports/nascar/lib/nascarCup2026Schedule.js";

const LOCK_MS = 60 * 60 * 1000;

async function main(): Promise<void> {
  let n = 0;
  for (const row of CUP_2026_SCHEDULE) {
    const raceStartAt = new Date(row.raceStartIso);
    const lockAt = new Date(raceStartAt.getTime() - LOCK_MS);
    await prisma.nascarWeek.upsert({
      where: { weekKey: row.weekKey },
      create: {
        weekKey: row.weekKey,
        seasonYear: 2026,
        raceName: row.raceName,
        trackName: row.trackName,
        raceStartAt,
        lockAt,
        isClosed: false,
      },
      update: {
        seasonYear: 2026,
        raceName: row.raceName,
        trackName: row.trackName,
        raceStartAt,
        lockAt,
      },
    });
    n += 1;
  }
  console.log(`NASCAR Cup 2026 schedule upserted: ${n} weeks`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => void prisma.$disconnect());
