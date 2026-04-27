import { NASCAR_WEEK_KEY_WURTH400_TEXAS_MAY2026 } from "./nascarCup2026Schedule.js";

/**
 * Official 38-car entry list (2026 Würth 400 @ Texas). Keys must match `NascarDriver.driverKey` / cup driver seed.
 * Source: NASCAR / Wikipedia entry list (May 2026). (R) and (i) do not change eligibility for fantasy picks here.
 */
export const WURTH_400_TEXAS_2026_ENTRY_DRIVER_KEYS: readonly string[] = [
  "ross-chastain",
  "austin-cindric",
  "austin-dillon",
  "noah-gragson",
  "kyle-larson",
  "brad-keselowski",
  "daniel-suarez",
  "kyle-busch",
  "chase-elliott",
  "ty-dillon",
  "denny-hamlin",
  "ryan-blaney",
  "aj-allmendinger",
  "chris-buescher",
  "chase-briscoe",
  "christopher-bell",
  "josh-berry",
  "joey-logano",
  "bubba-wallace",
  "william-byron",
  "todd-gilliland",
  "riley-herbst",
  "zane-smith",
  "cole-custer",
  "john-hunter-nemechek",
  "erik-jones",
  "tyler-reddick",
  "ricky-stenhouse-jr",
  "alex-bowman-48",
  "cody-ware",
  "ty-gibbs",
  "ryan-preece",
  "chad-finchum-66",
  "corey-heim",
  "michael-mcdowell",
  "carson-hocevar",
  "connor-zilisch",
  "shane-van-gisbergen",
] as const;

const ENTRY_KEYS_BY_WEEK: Record<string, readonly string[]> = {
  [NASCAR_WEEK_KEY_WURTH400_TEXAS_MAY2026]: WURTH_400_TEXAS_2026_ENTRY_DRIVER_KEYS,
};

/** When set, only these drivers are offered for lineup / must be used for saves for that `weekKey`. */
export function entryDriverKeysForWeek(weekKey: string): readonly string[] | null {
  return ENTRY_KEYS_BY_WEEK[weekKey] ?? null;
}

export function isDriverKeyOnWeekEntryList(weekKey: string, driverKey: string): boolean {
  const allowed = entryDriverKeysForWeek(weekKey);
  if (!allowed) return true;
  return allowed.includes(driverKey);
}
