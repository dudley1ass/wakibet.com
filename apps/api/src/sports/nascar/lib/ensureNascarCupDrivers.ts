import type { PrismaClient } from "@prisma/client";
import { NASCAR_CUP_DRIVER_SEED_ROWS } from "./nascarCupDriverSeed.js";

/** Idempotent upsert of the full Cup driver pool (same as `db:seed:nascar`). */
export async function ensureNascarCupDrivers(prisma: PrismaClient): Promise<number> {
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
  return n;
}
