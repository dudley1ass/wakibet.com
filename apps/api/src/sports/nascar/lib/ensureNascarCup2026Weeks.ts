import type { PrismaClient } from "../../../lib/prisma.js";
import { CUP_2026_SCHEDULE } from "./nascarCup2026Schedule.js";

const LOCK_MS = 60 * 60 * 1000;

/** Idempotent upsert of the full 2026 Cup calendar (same as `db:seed:nascar-schedule-2026`). */
export async function ensureNascarCup2026Weeks(prisma: PrismaClient): Promise<number> {
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
  return n;
}
