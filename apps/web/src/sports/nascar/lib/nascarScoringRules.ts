/**
 * WakiBet NASCAR weekly fantasy — public scoring contract.
 * Refined to reduce ties (decimal laps led), reward position gain, and add DNF risk.
 */
export const NASCAR_SCORING_VERSION = "1.0";

export type NascarScoringBlock = {
  title: string;
  rows: { label: string; pts: string }[];
  /** Small note under the table (e.g. worked example). */
  footnote?: string;
};

export const NASCAR_SCORING_BLOCKS: NascarScoringBlock[] = [
  {
    title: "Finish position",
    rows: [
      { label: "1st (win)", pts: "+25" },
      { label: "2nd–5th", pts: "+15" },
      { label: "6th–10th", pts: "+10" },
      { label: "11th–20th", pts: "+5" },
      { label: "21st+", pts: "0" },
    ],
  },
  {
    title: "Position movement",
    rows: [
      { label: "Each position gained", pts: "+1" },
      { label: "Each position lost", pts: "−0.5" },
    ],
    footnote: "Example: start 20th → finish 8th = +12 points (12 positions gained).",
  },
  {
    title: "Performance bonuses",
    rows: [
      { label: "Fastest lap", pts: "+5" },
      { label: "Laps led", pts: "+0.1 per lap" },
    ],
  },
  {
    title: "Risk / penalties",
    rows: [{ label: "DNF (did not finish)", pts: "−10" }],
  },
  {
    title: "Captain bonus",
    rows: [{ label: "Captain driver", pts: "1.5× that driver’s total race points" }],
  },
];

/** Worked example (same numbers as product spec). */
export const NASCAR_EXAMPLE_SCORE = {
  narrative: [
    "Starts 18th → finishes 6th",
    "Gains 12 spots → +12",
    "Finish band (6th–10th) → +10",
    "Leads 20 laps → +2",
    "Fastest lap → +5",
  ],
  /** Additive breakdown shown to users. */
  sumExpression: "10 + 12 + 2 + 5",
  rawTotal: 29,
  captainTotal: 43.5,
};

export const NASCAR_WHY_IT_WORKS: string[] = [
  "Reduces ties — decimal scoring from laps led spreads the field.",
  "Rewards smart picks — position gain is its own line item.",
  "Adds risk — DNF penalty keeps chalk from being free.",
  "Stays simple enough to explain in one screen.",
];

export const NASCAR_LINEUP_RULES_ROWS: { label: string; pts: string }[] = [
  { label: "WakiCash budget (weekly)", pts: "100" },
  { label: "Drivers picked", pts: "5" },
  { label: "Max elite drivers", pts: "2" },
  { label: "Captain", pts: "1 required (1.5×)" },
  { label: "Tie-breakers", pts: "2 required" },
];
