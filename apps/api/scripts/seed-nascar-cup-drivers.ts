/**
 * Upserts NASCAR Cup driver pool (name, #, sponsor, make, team, WakiCash, elite).
 * Requires migration `20260427180000_nascar_driver_sponsor_manufacturer` applied.
 *
 * Usage (from repo root):
 *   pnpm --filter @wakibet/api run db:seed:nascar
 */
import { prisma } from "../src/lib/prisma.js";
import { ensureNascarCupDrivers } from "../src/sports/nascar/lib/ensureNascarCupDrivers.js";

async function main(): Promise<void> {
  const n = await ensureNascarCupDrivers(prisma);
  console.log(`NASCAR Cup drivers upserted: ${n}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => void prisma.$disconnect());
