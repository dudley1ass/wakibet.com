/**
 * Texas Würth week key + full 2026 Cup calendar (see `nascarCup2026Schedule.ts`).
 * Kept for imports that expect `WURTH400_TEXAS_MAY2026` or the week key constant.
 */
import {
  CUP_2026_SCHEDULE,
  NASCAR_WEEK_KEY_WURTH400_TEXAS_MAY2026,
} from "./nascarCup2026Schedule.js";

export { CUP_2026_SCHEDULE, NASCAR_WEEK_KEY_WURTH400_TEXAS_MAY2026 } from "./nascarCup2026Schedule.js";

const LOCK_MS = 60 * 60 * 1000;

function wurthFromSchedule() {
  const r = CUP_2026_SCHEDULE.find((x) => x.weekKey === NASCAR_WEEK_KEY_WURTH400_TEXAS_MAY2026);
  if (!r) throw new Error("Würth / Texas row missing from CUP_2026_SCHEDULE");
  const raceStartAt = new Date(r.raceStartIso);
  return {
    weekKey: r.weekKey,
    seasonYear: 2026,
    raceName: r.raceName,
    trackName: r.trackName,
    raceStartAt,
    lockAt: new Date(raceStartAt.getTime() - LOCK_MS),
  } as const;
}

export const WURTH400_TEXAS_MAY2026 = wurthFromSchedule();
