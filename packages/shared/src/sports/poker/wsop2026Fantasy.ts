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
};

/** Tier 1 — main fantasy events (always featured). */
export const WSOP_2026_TIER1_SLATES: WsopFantasySlateDef[] = [
  {
    slate_key: "wsop_2026_main_event",
    title: "Main Event",
    tier: 1,
    always_featured: true,
    rationale: "The crown jewel — your Super Bowl / Masters / March Madness moment for poker fantasy.",
  },
  {
    slate_key: "wsop_2026_mystery_millions",
    title: "Mystery Millions",
    tier: 1,
    always_featured: true,
    rationale: "Huge fields, social buzz, recreational + pro mix, viral sweats.",
  },
  {
    slate_key: "wsop_2026_millionaire_maker",
    title: "Millionaire Maker",
    tier: 1,
    always_featured: true,
    rationale: "Giant fields, recognizable names, Cinderella runs.",
  },
  {
    slate_key: "wsop_2026_monster_stack",
    title: "Monster Stack",
    tier: 1,
    always_featured: true,
    rationale: "Fans love this format — high engagement.",
  },
  {
    slate_key: "wsop_2026_colossus",
    title: "Colossus",
    tier: 1,
    always_featured: true,
    rationale: "Massive public participation.",
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
  "Captain multiplier",
  "Low-owned bonus",
  "Streak / “heater” boosts",
];
