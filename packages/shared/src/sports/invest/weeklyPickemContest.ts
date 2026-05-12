/**
 * WakiBet "Invest" sport — Weekly Stock Pick'em MVP scope.
 *
 * Virtual portfolios only. No real money is invested. Marketing/legal language:
 * "Free stock-picking contest using virtual portfolios. No real money is invested."
 */

/** Roster size for the MVP weekly contest. */
export const INVEST_WEEKLY_PICKEM_PICKS = 5;

/** Virtual starting cash (display value). */
export const INVEST_WEEKLY_PICKEM_STARTING_CASH_USD = 100_000;

/** Equivalent WakiCash budget so it slots into the existing WC mental model. */
export const INVEST_WEEKLY_PICKEM_STARTING_WAKICASH = 100;

/** Max share of starting cash that can be allocated to a single position. */
export const INVEST_WEEKLY_PICKEM_MAX_POSITION_PCT = 30;

/** Minimum eligible share price to keep penny / micro-cap noise out of the pool. */
export const INVEST_MIN_SHARE_PRICE_USD = 5;

/** Lock day-of-week (0=Sun … 6=Sat). Contest locks Monday at market open. */
export const INVEST_WEEKLY_LOCK_DOW = 1;

/** Lock time (Eastern Time wall clock) — US equities market open. */
export const INVEST_WEEKLY_LOCK_TIME_ET = "09:30 AM ET";

/** End day-of-week — Friday. */
export const INVEST_WEEKLY_END_DOW = 5;

/** End time (Eastern Time wall clock) — regular session close. */
export const INVEST_WEEKLY_END_TIME_ET = "04:00 PM ET";

/**
 * Asset types eligible for the MVP. Leveraged / inverse / OTC / penny names
 * are excluded by curation in `eligibleUniverse.ts`.
 */
export type InvestAssetType = "stock" | "etf";

export type WeeklyPickemRulesView = {
  picks: number;
  starting_cash_usd: number;
  starting_wakicash: number;
  max_position_pct: number;
  min_share_price_usd: number;
  lock_time_et: string;
  end_time_et: string;
  allowed_asset_types: InvestAssetType[];
  excluded: string[];
};

export const INVEST_WEEKLY_PICKEM_RULES: WeeklyPickemRulesView = {
  picks: INVEST_WEEKLY_PICKEM_PICKS,
  starting_cash_usd: INVEST_WEEKLY_PICKEM_STARTING_CASH_USD,
  starting_wakicash: INVEST_WEEKLY_PICKEM_STARTING_WAKICASH,
  max_position_pct: INVEST_WEEKLY_PICKEM_MAX_POSITION_PCT,
  min_share_price_usd: INVEST_MIN_SHARE_PRICE_USD,
  lock_time_et: INVEST_WEEKLY_LOCK_TIME_ET,
  end_time_et: INVEST_WEEKLY_END_TIME_ET,
  allowed_asset_types: ["stock", "etf"],
  excluded: ["OTC", "penny stocks (< $5)", "leveraged ETFs", "inverse ETFs"],
};

/** Simple portfolio return scoring: % gain × 100, signed. */
export function computePortfolioReturnScore(
  startingValue: number,
  currentValue: number,
): number {
  if (!Number.isFinite(startingValue) || startingValue <= 0) return 0;
  if (!Number.isFinite(currentValue)) return 0;
  return ((currentValue - startingValue) / startingValue) * 100;
}

/** A single weekly contest window resolved from a reference date. */
export type InvestWeeklyContestWindow = {
  contest_key: string;
  /** ISO instant (UTC) when the contest locks. */
  lock_at_iso: string;
  /** ISO instant (UTC) when the contest ends and final score is taken. */
  end_at_iso: string;
  /** Human label: "Week of May 11–15, 2026" */
  label: string;
};

const ET_OFFSET_HOURS_DST = -4;
const ET_OFFSET_HOURS_STD = -5;

/**
 * Eastern Time UTC offset for a given date. US equity DST runs from the second
 * Sunday of March to the first Sunday of November; outside that window EST is UTC-5.
 * The bounds are approximated by month so we don't need a tz database in shared.
 */
function easternOffsetHours(date: Date): number {
  const m = date.getUTCMonth() + 1;
  // Mar 8 – Nov 1 inclusive is safely DST for any year in the contest's lifetime.
  if (m >= 4 && m <= 10) return ET_OFFSET_HOURS_DST;
  if (m === 3 && date.getUTCDate() >= 8) return ET_OFFSET_HOURS_DST;
  if (m === 11 && date.getUTCDate() === 1) return ET_OFFSET_HOURS_DST;
  return ET_OFFSET_HOURS_STD;
}

/** Convert an ET wall-clock {y,m,d,hh,mm} to a UTC ISO instant. */
function etWallClockToUtcIso(y: number, m: number, d: number, hh: number, mm: number): string {
  // Build a tentative UTC instant for the ET wall clock; pick the offset
  // appropriate to that instant. (Boundary days outside the contest fold safely.)
  const tentative = new Date(Date.UTC(y, m - 1, d, hh, mm, 0));
  const offset = easternOffsetHours(tentative);
  return new Date(Date.UTC(y, m - 1, d, hh - offset, mm, 0)).toISOString();
}

/**
 * Resolve the current weekly contest window relative to `now`.
 *
 * Behavior:
 *  - If `now` is before Monday 09:30 ET this week, return the upcoming window
 *    (lock = Monday 09:30 ET, end = Friday 16:00 ET).
 *  - If `now` is within Mon 09:30 ET → Fri 16:00 ET, return the in-progress window.
 *  - If `now` is after Fri 16:00 ET, return next Monday's window.
 */
export function resolveCurrentWeeklyContest(now: Date): InvestWeeklyContestWindow {
  // Find the Monday of the current ISO week, in UTC.
  const ref = new Date(now.getTime());
  const dow = ref.getUTCDay(); // 0=Sun
  const daysSinceMonday = (dow + 6) % 7;
  const mondayUtc = new Date(
    Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth(), ref.getUTCDate() - daysSinceMonday),
  );

  function buildWindow(monday: Date): InvestWeeklyContestWindow {
    const y = monday.getUTCFullYear();
    const m = monday.getUTCMonth() + 1;
    const d = monday.getUTCDate();
    const lockIso = etWallClockToUtcIso(y, m, d, 9, 30);
    const friday = new Date(Date.UTC(y, m - 1, d + 4));
    const endIso = etWallClockToUtcIso(
      friday.getUTCFullYear(),
      friday.getUTCMonth() + 1,
      friday.getUTCDate(),
      16,
      0,
    );
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const label =
      m === friday.getUTCMonth() + 1
        ? `Week of ${months[m - 1]} ${d}–${friday.getUTCDate()}, ${y}`
        : `Week of ${months[m - 1]} ${d} – ${months[friday.getUTCMonth()]} ${friday.getUTCDate()}, ${y}`;
    const contestKey = `invest_weekly_${y}_${String(m).padStart(2, "0")}_${String(d).padStart(2, "0")}`;
    return { contest_key: contestKey, lock_at_iso: lockIso, end_at_iso: endIso, label };
  }

  const thisWeek = buildWindow(mondayUtc);
  if (now.getTime() < new Date(thisWeek.end_at_iso).getTime()) {
    return thisWeek;
  }
  const nextMonday = new Date(
    Date.UTC(
      mondayUtc.getUTCFullYear(),
      mondayUtc.getUTCMonth(),
      mondayUtc.getUTCDate() + 7,
    ),
  );
  return buildWindow(nextMonday);
}

export type InvestWeeklyContestPhase = "open" | "locked" | "settled";

/** Phase for UI: open (pre-lock), locked (running), settled (after end). */
export function computeWeeklyContestPhase(
  contest: InvestWeeklyContestWindow,
  now: Date,
): InvestWeeklyContestPhase {
  const t = now.getTime();
  if (t < new Date(contest.lock_at_iso).getTime()) return "open";
  if (t < new Date(contest.end_at_iso).getTime()) return "locked";
  return "settled";
}
