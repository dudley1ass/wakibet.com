/**
 * Upserts NASCAR Cup driver pool (name, #, sponsor, make, team, WakiCash, elite).
 * Requires migration `20260427180000_nascar_driver_sponsor_manufacturer` applied.
 *
 * Usage (from repo root):
 *   pnpm --filter @wakibet/api run db:seed:nascar
 */
import { prisma } from "../src/lib/prisma.js";
import { NASCAR_CUP_DRIVER_SEED_ROWS } from "../src/sports/nascar/lib/nascarCupDriverSeed.js";

async function main(): Promise<void> {
  let n = 0;
  for (const row of NASCAR_CUP_DRIVER_SEED_ROWS) {
    await prisma.nascarDriver.upsert({
      where: { driverKey: row.driverKey },
      create: {
        driverKey: row.driverKey,
        displayName: row.displayName,
        carNumber: row.carNumber,
        sponsor: row.sponsor,
        manufacturer: row.manufacturer,
        teamName: row.teamName,
        wakiCashPrice: row.wakiCashPrice,
        isElite: row.isElite,
        isActive: true,
      },
      update: {
        displayName: row.displayName,
        carNumber: row.carNumber,
        sponsor: row.sponsor,
        manufacturer: row.manufacturer,
        teamName: row.teamName,
        wakiCashPrice: row.wakiCashPrice,
        isElite: row.isElite,
        isActive: true,
      },
    });
    n += 1;
  }
  console.log(`NASCAR Cup drivers upserted: ${n}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => void prisma.$disconnect());
