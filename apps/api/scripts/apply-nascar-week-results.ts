/**
 * Apply official weekly fantasy points for one NASCAR Cup week, close the week,
 * and recompute all `NascarWeeklyLineup.totalPts` + per-pick points (captain ×1.5).
 *
 * Usage (from repo root, with DATABASE_URL):
 *   pnpm --filter @wakibet/api exec tsx apps/api/scripts/apply-nascar-week-results.ts -- --week-key=2026_cup_autotrader_400
 *
 * Override the default week key by passing `--week-key=...` (must exist in `NascarWeek`).
 */
import { prisma } from "../src/lib/prisma.js";
import {
  buildDriverPointsByKey,
  pickFantasyPoints,
  type DriverRow,
} from "../src/sports/nascar/lib/nascarWeekResultScoring.js";

/** Paste from official race / fantasy results (display name + points). */
const RESULT_ROWS: { displayName: string; points: number }[] = [
  { displayName: "Chase Elliott", points: 69 },
  { displayName: "Denny Hamlin", points: 43 },
  { displayName: "Alex Bowman", points: 35 },
  { displayName: "Tyler Reddick", points: 42 },
  { displayName: "Chris Buescher", points: 36 },
  { displayName: "Daniel Suárez", points: 36 },
  { displayName: "Carson Hocevar", points: 41 },
  { displayName: "William Byron", points: 31 },
  { displayName: "Bubba Wallace", points: 28 },
  { displayName: "Ryan Blaney", points: 27 },
  { displayName: "Riley Herbst", points: 29 },
  { displayName: "Erik Jones", points: 35 },
  { displayName: "Brad Keselowski", points: 32 },
  { displayName: "Ryan Preece", points: 29 },
  { displayName: "Austin Cindric", points: 22 },
  { displayName: "Connor Zilisch", points: 21 },
  { displayName: "Shane van Gisbergen", points: 20 },
  { displayName: "Austin Dillon", points: 19 },
  { displayName: "Ricky Stenhouse Jr.", points: 26 },
  { displayName: "Kyle Busch", points: 22 },
  { displayName: "John H Nemechek", points: 16 },
  { displayName: "Zane Smith", points: 15 },
  { displayName: "Chase Briscoe", points: 20 },
  { displayName: "Ty Dillon", points: 13 },
  { displayName: "AJ Allmendinger", points: 16 },
  { displayName: "Ross Chastain", points: 11 },
  { displayName: "Michael McDowell", points: 10 },
  { displayName: "Noah Gragson", points: 9 },
  { displayName: "Josh Berry", points: 8 },
  { displayName: "Cody Ware", points: 7 },
  { displayName: "Corey Heim", points: 0 },
  { displayName: "Todd Gilliland", points: 5 },
  { displayName: "Chad Finchum", points: 0 },
  { displayName: "Kyle Larson", points: 3 },
  { displayName: "Cole Custer", points: 2 },
  { displayName: "Ty Gibbs", points: 8 },
  { displayName: "Joey Logano", points: 1 },
  { displayName: "Christopher Bell", points: 1 },
];

const DEFAULT_WEEK_KEY = "2026_cup_autotrader_400";

function argWeekKey(): string {
  const raw = process.argv.find((a) => a.startsWith("--week-key="));
  if (!raw) return DEFAULT_WEEK_KEY;
  return raw.slice("--week-key=".length).trim() || DEFAULT_WEEK_KEY;
}

async function main(): Promise<void> {
  const weekKey = argWeekKey();
  const week = await prisma.nascarWeek.findUnique({ where: { weekKey } });
  if (!week) {
    console.error(`Unknown week_key: ${weekKey}`);
    process.exit(1);
  }

  const drivers = await prisma.nascarDriver.findMany({
    where: { isActive: true },
    select: { driverKey: true, displayName: true },
  });
  const rows: DriverRow[] = drivers;

  const { map, unresolved } = buildDriverPointsByKey(rows, RESULT_ROWS);
  if (unresolved.length > 0) {
    console.error("Could not match these result names to driverKey:", unresolved);
    process.exit(1);
  }

  await prisma.$transaction(async (tx) => {
    await tx.nascarWeek.update({
      where: { id: week.id },
      data: {
        driverPointsByKey: map,
        isClosed: true,
      },
    });

    const lineups = await tx.nascarWeeklyLineup.findMany({
      where: { weekId: week.id },
      include: { picks: { include: { driver: true } } },
    });

    for (const lu of lineups) {
      let total = 0;
      for (const p of lu.picks) {
        const pts = pickFantasyPoints({
          driverKey: p.driver.driverKey,
          driverPointsByKey: map,
          isCaptain: p.isCaptain,
        });
        total += pts;
        await tx.nascarWeeklyPick.update({
          where: { id: p.id },
          data: { points: pts },
        });
      }
      await tx.nascarWeeklyLineup.update({
        where: { id: lu.id },
        data: { totalPts: Math.round(total * 100) / 100 },
      });
    }
  });

  const nLineups = await prisma.nascarWeeklyLineup.count({ where: { weekId: week.id } });
  console.log(
    `Applied ${Object.keys(map).length} driver point rows for ${weekKey}; closed week; rescored ${nLineups} lineups.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => void prisma.$disconnect());
