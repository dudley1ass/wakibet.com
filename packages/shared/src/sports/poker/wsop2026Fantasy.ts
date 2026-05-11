/**
 * WakiBet poker fantasy — WSOP Las Vegas 2026 scope only (May 26 – Jul 15).
 * Slate tiers, roster rules, scoring, and featured-pool guidance for product + API.
 */

/** Matches `POKER_LIVE_TOUR_2026_EVENTS` entry for WSOP 2026. */
export const WSOP_2026_LAS_VEGAS_EVENT_KEY = "wsop_2026_las_vegas";

export const WSOP_2026_START_DATE = "2026-05-26";
export const WSOP_2026_END_DATE = "2026-07-15";

/** Roster size per slate (sweet spot). */
export const WSOP_FANTASY_ROSTER_SLOTS = 6;

/** Salary cap per lineup (WakiCash). */
export const WSOP_FANTASY_SALARY_CAP = 100;

/**
 * Tiered locking ("Lineup Freeze") rules.
 *
 * Phase 1 — Open (before Day 1 start time)        → unlimited edits.
 * Phase 2 — Soft lock (Days 1 through 3 inclusive) → limited player swaps + captain changes.
 * Phase 3 — Hard lock (after Day 3 start time)     → fully locked; standings become final-only.
 *
 * Marketing copy: "Lineups remain editable through Day 3 — adapt to chip counts and survive the field."
 */
export const WSOP_FANTASY_SOFT_LOCK_DAYS = 3;
export const WSOP_FANTASY_SOFT_LOCK_MAX_SWAPS = 2;

/** Captain on a lineup earns a points multiplier (applied at scoring time, post-launch). */
export const WSOP_FANTASY_CAPTAIN_MULTIPLIER = 1.5;

/** Featured player pool size per slate — not the entire WSOP field. */
export const WSOP_FEATURED_PLAYER_POOL_MIN = 50;
export const WSOP_FEATURED_PLAYER_POOL_MAX = 150;

export type WsopFantasySlateDef = {
  slate_key: string;
  title: string;
  /** Tier 1 = flagship featured events; Tier 2 = elite / hardcore audience */
  tier: 1 | 2;
  /** Tier 1 flagship events are always featured in-product. */
  always_featured: boolean;
  /** Product note for hub / rules copy */
  rationale: string;
  /** ISO date (YYYY-MM-DD) Day 1 of the event. Null for Tier-2 placeholders. */
  start_date: string | null;
  /** ISO date (YYYY-MM-DD) final day of the event. Null for Tier-2 placeholders. */
  end_date: string | null;
  /** Typical first-flight start time, displayed as-is (Pacific Time). */
  start_time_pt: string | null;
};

/** Tier 1 — main fantasy events (always featured). */
export const WSOP_2026_TIER1_SLATES: WsopFantasySlateDef[] = [
  {
    slate_key: "wsop_2026_colossus",
    title: "Colossus",
    tier: 1,
    always_featured: true,
    rationale: "Massive public participation.",
    start_date: "2026-05-29",
    end_date: "2026-06-02",
    start_time_pt: "10:00 AM PT",
  },
  {
    slate_key: "wsop_2026_monster_stack",
    title: "Monster Stack",
    tier: 1,
    always_featured: true,
    rationale: "Fans love this format — high engagement.",
    start_date: "2026-06-11",
    end_date: "2026-06-16",
    start_time_pt: "11:00 AM PT",
  },
  {
    slate_key: "wsop_2026_millionaire_maker",
    title: "Millionaire Maker",
    tier: 1,
    always_featured: true,
    rationale: "Giant fields, recognizable names, Cinderella runs.",
    start_date: "2026-06-18",
    end_date: "2026-06-22",
    start_time_pt: "10:00 AM PT",
  },
  {
    slate_key: "wsop_2026_mystery_millions",
    title: "Mystery Millions",
    tier: 1,
    always_featured: true,
    rationale: "Huge fields, social buzz, recreational + pro mix, viral sweats.",
    start_date: "2026-06-23",
    end_date: "2026-06-27",
    start_time_pt: "10:00 AM PT",
  },
  {
    slate_key: "wsop_2026_main_event",
    title: "Main Event",
    tier: 1,
    always_featured: true,
    rationale: "The crown jewel — your Super Bowl / Masters / March Madness moment for poker fantasy.",
    start_date: "2026-07-02",
    end_date: "2026-07-13",
    start_time_pt: "11:00 AM PT",
  },
];

/** Tier 2 — elite pro / rankings / debate slates ($10k championship tier examples). */
export const WSOP_2026_TIER2_SLATES: WsopFantasySlateDef[] = [
  {
    slate_key: "wsop_2026_championship_10k_mix",
    title: "$10k Championships",
    tier: 2,
    always_featured: false,
    rationale:
      "Great for hardcore fans: rankings, “who’s elite?”, high-level debates. Examples include flagship championship events such as PLO Championship, H.O.R.S.E., 6-Max, and Heads-Up.",
    start_date: null,
    end_date: null,
    start_time_pt: null,
  },
];

export type WsopSimpleScoringRow = {
  /** Stable code for clients */
  outcome_key: string;
  label: string;
  points: number;
};

/** Launch scoring — bonuses (captain, ownership, etc.) deferred post-launch. */
export const WSOP_2026_SIMPLE_SCORING: WsopSimpleScoringRow[] = [
  { outcome_key: "cash", label: "Cash", points: 10 },
  { outcome_key: "top_100", label: "Top 100", points: 20 },
  { outcome_key: "top_50", label: "Top 50", points: 35 },
  { outcome_key: "final_table", label: "Final table", points: 75 },
  { outcome_key: "top_3", label: "Top 3", points: 125 },
  { outcome_key: "bracelet", label: "Bracelet win", points: 200 },
];

/** Guidance for who belongs in the featured pool (automation + manual curation). */
export const WSOP_FEATURED_POOL_INCLUSION_NOTES: string[] = [
  "Automatically lean on: bracelet winners, known pros, strong Hendon-style rankings, social / media names, hot recent form.",
  "Manually add: sleepers, storylines, qualifiers, and hot-take picks.",
];

export const WSOP_POST_LAUNCH_BONUS_IDEAS: string[] = [
  "Ownership percentage",
  "Low-owned bonus",
  "Streak / “heater” boosts",
];

export type LineupFreezePhase = "open" | "soft_lock" | "hard_lock";

export type LineupFreezeStatus = {
  phase: LineupFreezePhase;
  /** Day 1 first-flight start (ISO, UTC). null if slate has no start_date. */
  soft_lock_starts_at_iso: string | null;
  /** Moment edits are hard-locked (Day {WSOP_FANTASY_SOFT_LOCK_DAYS} start, ISO UTC). null if slate has no dates. */
  hard_lock_at_iso: string | null;
  /** Hours from `now` to hard lock; negative once past, null if no dates. */
  hours_until_hard_lock: number | null;
  /** Human-readable phase label for UI badges. */
  label: string;
};

/** Convert "10:00 AM PT" / "11:00 AM PT" / "1:30 PM PT" to a 24-hour {h, m} pair. */
function parsePtTime(s: string): { h: number; m: number } {
  const trimmed = s.trim();
  const m = trimmed.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)\b/i);
  if (!m) return { h: 11, m: 0 };
  let h = Number(m[1]);
  const min = m[2] ? Number(m[2]) : 0;
  const ampm = m[3].toUpperCase();
  if (ampm === "AM" && h === 12) h = 0;
  else if (ampm === "PM" && h !== 12) h += 12;
  return { h, m: min };
}

/**
 * Pacific Time offset relative to UTC at the given date (handles DST).
 * PT is UTC-8 during PST (~Nov–Mar) and UTC-7 during PDT (~Mar–Nov).
 * For WSOP (May–Jul) it is always PDT (UTC-7).
 */
function ptOffsetHoursAt(_yyyy_mm_dd: string): number {
  // All WSOP 2026 events fall inside Pacific Daylight Time.
  return -7;
}

/**
 * Convert a PT wall-clock date+time to a UTC ISO instant.
 * `dateIso` is YYYY-MM-DD interpreted as a PT calendar date.
 */
function ptWallClockToUtcIso(dateIso: string, hh: number, mm: number): string {
  const [y, m, d] = dateIso.split("-").map((n) => Number(n));
  if (!y || !m || !d) return new Date(NaN).toISOString();
  const ptOffset = ptOffsetHoursAt(dateIso); // negative number, e.g. -7
  // PT wall clock → UTC: add (−ptOffset) hours, since UTC = PT − ptOffset.
  // (e.g., 11:00 PDT → 18:00 UTC when ptOffset = -7)
  const utcHours = hh - ptOffset;
  const dt = new Date(Date.UTC(y, m - 1, d, utcHours, mm, 0));
  return dt.toISOString();
}

/** Add N calendar days to a YYYY-MM-DD string. */
function addDaysIsoDate(dateIso: string, days: number): string {
  const [y, m, d] = dateIso.split("-").map((n) => Number(n));
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  const yyyy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(dt.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Compute the Lineup Freeze phase for a slate at a given moment.
 *
 *  phase | when
 *  ----- | -----
 *  open       | now < Day 1 start time PT
 *  soft_lock  | Day 1 start ≤ now < Day (WSOP_FANTASY_SOFT_LOCK_DAYS) start
 *  hard_lock  | now ≥ Day (WSOP_FANTASY_SOFT_LOCK_DAYS) start
 *
 * Slates without dates (e.g. Tier-2 placeholders) always return phase `"open"`.
 */
export function computeLineupFreezeStatus(
  slate: Pick<WsopFantasySlateDef, "start_date" | "start_time_pt">,
  now: Date,
): LineupFreezeStatus {
  if (!slate.start_date || !slate.start_time_pt) {
    return {
      phase: "open",
      soft_lock_starts_at_iso: null,
      hard_lock_at_iso: null,
      hours_until_hard_lock: null,
      label: "Lineups open",
    };
  }
  const t = parsePtTime(slate.start_time_pt);
  const softLockIso = ptWallClockToUtcIso(slate.start_date, t.h, t.m);
  const hardLockDate = addDaysIsoDate(slate.start_date, WSOP_FANTASY_SOFT_LOCK_DAYS);
  const hardLockIso = ptWallClockToUtcIso(hardLockDate, t.h, t.m);

  const nowMs = now.getTime();
  const softMs = new Date(softLockIso).getTime();
  const hardMs = new Date(hardLockIso).getTime();
  const hoursToHard = (hardMs - nowMs) / 3_600_000;

  let phase: LineupFreezePhase;
  let label: string;
  if (nowMs < softMs) {
    phase = "open";
    label = "Lineups open";
  } else if (nowMs < hardMs) {
    phase = "soft_lock";
    label = "Soft lock — Day 1–3";
  } else {
    phase = "hard_lock";
    label = "Lineup Freeze";
  }

  return {
    phase,
    soft_lock_starts_at_iso: softLockIso,
    hard_lock_at_iso: hardLockIso,
    hours_until_hard_lock: hoursToHard,
    label,
  };
}

/**
 * Compute how many of the lineup's pick slots have changed vs the baseline snapshot
 * taken at the soft-lock transition. Captain changes are NOT counted here — they're
 * tracked separately and allowed throughout the soft-lock window.
 */
export function countLineupSwapsAgainstBaseline(
  current: ReadonlyArray<string>,
  baseline: ReadonlyArray<string>,
): number {
  const n = Math.max(current.length, baseline.length);
  let swaps = 0;
  for (let i = 0; i < n; i++) {
    const c = (current[i] ?? "").trim();
    const b = (baseline[i] ?? "").trim();
    if (c !== b) swaps += 1;
  }
  return swaps;
}
