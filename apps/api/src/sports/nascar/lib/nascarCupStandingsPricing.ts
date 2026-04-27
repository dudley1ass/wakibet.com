/**
 * Cup points order after Talladega Superspeedway — 2026-04-26 (race 10/36).
 * Keys match `NascarDriver.driverKey` in seed upserts.
 */
export const CUP_DRIVER_KEYS_BY_POINTS_RANK_APR_26_2026: readonly string[] = [
  "tyler-reddick",
  "denny-hamlin",
  "ryan-blaney",
  "chase-elliott",
  "ty-gibbs",
  "kyle-larson",
  "chris-buescher",
  "carson-hocevar",
  "christopher-bell",
  "brad-keselowski",
  "william-byron",
  "bubba-wallace",
  "ryan-preece",
  "daniel-suarez",
  "joey-logano",
  "austin-cindric",
  "chase-briscoe",
  "ross-chastain",
  "shane-van-gisbergen",
  "zane-smith",
  "aj-allmendinger",
  "todd-gilliland",
  "michael-mcdowell",
  "austin-dillon",
  "ricky-stenhouse-jr",
  "erik-jones",
  "kyle-busch",
  "josh-berry",
  "riley-herbst",
  "noah-gragson",
  "john-hunter-nemechek",
  "ty-dillon",
  "connor-zilisch",
  "cole-custer",
  "cody-ware",
  "alex-bowman-48",
  "casey-mears-66",
  "bj-mcleod",
];

/** 1-based rank → WakiCash (tiers aligned to published 100-cap strategy). */
const WAKICASH_BY_RANK: readonly number[] = [
  42, 40, 38, 36, 34, 31, 29, 28, 27, 26, 25, 24, 22, 21, 20, 19, 18, 18, 17, 16, 15, 14, 13, 13, 12, 11, 10, 10, 9, 9, 8, 7, 7, 6, 6, 6, 5, 5,
];

export function cupStandingRankForDriverKey(driverKey: string): number | undefined {
  const i = CUP_DRIVER_KEYS_BY_POINTS_RANK_APR_26_2026.indexOf(driverKey);
  if (i < 0) return undefined;
  return i + 1;
}

/** Salary from 1-based points rank; drivers not on the board default to value pricing. */
export function wakicashFromCupStandingRank(rank: number): number {
  if (rank >= 1 && rank <= WAKICASH_BY_RANK.length) return WAKICASH_BY_RANK[rank - 1]!;
  return 5;
}
