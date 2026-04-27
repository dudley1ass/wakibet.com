/**
 * Upserts full 2026 NASCAR Cup schedule into `NascarWeek` (upcoming races for hub + lineups).
 *
 * Usage:
 *   pnpm --filter @wakibet/api run db:seed:nascar-schedule-2026
 */
import { prisma } from "../src/lib/prisma.js";
import { ensureNascarCup2026Weeks } from "../src/sports/nascar/lib/ensureNascarCup2026Weeks.js";

async function main(): Promise<void> {
  const n = await ensureNascarCup2026Weeks(prisma);
  console.log(`NASCAR Cup 2026 schedule upserted: ${n} weeks`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => void prisma.$disconnect());
