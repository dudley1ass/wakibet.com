/**
 * Marketing homepage hot takes: rotate every 2 days; on Thursdays,
 * prioritize “who wins this weekend?” style takes using spotlight events.
 */

export type MarketingHotTake = {
  id: string;
  text: string;
  agree: number;
  disagree: number;
};

export type SpotlightItemLike = {
  sport_key: string;
  label_short: string;
  label_full: string;
  venue: string;
  status: "live" | "upcoming" | "ended";
};

/** Index that increments every 2 calendar days (UTC) — same takes for 48h worldwide. */
export function marketingHotTakePeriodIndex(now = new Date()): number {
  const utc = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.floor(utc / (2 * 86_400_000));
}

/** Local Thursday — weekend preview takes. */
export function isThursdayHotTakeDay(now = new Date()): boolean {
  return now.getDay() === 4;
}

const POOL_A: MarketingHotTake[] = [
  {
    id: "ht-a0",
    text: "Ben Johns is overrated in doubles when the pace gets messy — change my mind.",
    agree: 342,
    disagree: 189,
  },
  {
    id: "ht-a1",
    text: "PLL defenses are finally catching up to the offensive explosion.",
    agree: 267,
    disagree: 112,
  },
  {
    id: "ht-a2",
    text: "Volleyball analytics over-weight kills and under-weight side-out sustainability.",
    agree: 198,
    disagree: 203,
  },
  {
    id: "ht-a3",
    text: "Pickleball 5.0 ratings are inflated at half the clubs in Florida.",
    agree: 421,
    disagree: 156,
  },
  {
    id: "ht-a4",
    text: "Fantasy should reward boring consistency over one viral highlight reel.",
    agree: 512,
    disagree: 89,
  },
];

const POOL_B: MarketingHotTake[] = [
  {
    id: "ht-b0",
    text: "Server energy matters more than arm talent when sets get ugly late.",
    agree: 287,
    disagree: 201,
  },
  {
    id: "ht-b1",
    text: "Pickleball partnerships win tournaments — individuals only win headlines.",
    agree: 356,
    disagree: 142,
  },
  {
    id: "ht-b2",
    text: "PLL rides clear harder than NFL hits — and the refs still swallow whistles.",
    agree: 198,
    disagree: 267,
  },
  {
    id: "ht-b3",
    text: "Beach volleyball seeding lies after pool play — bracket luck decides half the pod.",
    agree: 223,
    disagree: 188,
  },
  {
    id: "ht-b4",
    text: "Salary-cap fantasy makes sleepers more valuable than chalk stars.",
    agree: 401,
    disagree: 176,
  },
];

const POOL_C: MarketingHotTake[] = [
  {
    id: "ht-c0",
    text: "The kitchen isn’t real defense — it’s a truce until someone breaks it.",
    agree: 512,
    disagree: 301,
  },
  {
    id: "ht-c1",
    text: "Lacrosse goalies steal playoff games more than any attackman headlines.",
    agree: 244,
    disagree: 198,
  },
  {
    id: "ht-c2",
    text: "Side-out percentage should be on every broadcast ticker.",
    agree: 312,
    disagree: 156,
  },
  {
    id: "ht-c3",
    text: "Club coaches who chase clips are sacrificing reps that show up in July.",
    agree: 289,
    disagree: 221,
  },
  {
    id: "ht-c4",
    text: "WSOP fantasy should punish punting thin events just to chase buzz.",
    agree: 367,
    disagree: 134,
  },
];

const POOL_D: MarketingHotTake[] = [
  {
    id: "ht-d0",
    text: "Soft game propaganda — rec leagues are still won at the line of scrimmage up front.",
    agree: 445,
    disagree: 267,
  },
  {
    id: "ht-d1",
    text: "Ranking lists are fanfiction unless they say which schedule they measure.",
    agree: 298,
    disagree: 189,
  },
  {
    id: "ht-d2",
    text: "Volleyball: first-touch quality beats kill count for predicting winners.",
    agree: 256,
    disagree: 212,
  },
  {
    id: "ht-d3",
    text: "PLL parity is a myth — three possessions decide most single-elim games.",
    agree: 201,
    disagree: 278,
  },
  {
    id: "ht-d4",
    text: "Debate culture beats algorithm culture — argue with receipts or sit down.",
    agree: 534,
    disagree: 97,
  },
];

const ROTATION_POOLS: MarketingHotTake[][] = [POOL_A, POOL_B, POOL_C, POOL_D];

const WEEKEND_FALLBACK_QUESTIONS: string[] = [
  "Who are you locking as your chalk winner this weekend — name the tournament.",
  "Biggest upset brewing this weekend across pickleball, volleyball, or PLL?",
  "Survivor pick: one roster you trust to cash across Saturday and Sunday?",
  "Which slate has the worst variance — where luck decides more than prep?",
  "Give one sleeper who shocks the bracket before Monday highlights arrive.",
];

function buildWeekendHotTakes(
  period: number,
  spotlightItems: SpotlightItemLike[],
  lacrosseSlateName: string | null | undefined,
): MarketingHotTake[] {
  const candidates = spotlightItems.filter((i) => i.status === "live" || i.status === "upcoming");
  const takes: MarketingHotTake[] = [];
  let n = 0;

  for (const item of candidates.slice(0, 4)) {
    takes.push({
      id: `ht-wknd-${period}-${n}`,
      text: `Who wins ${item.label_short} this weekend (${item.venue}) — favorites or the field?`,
      agree: 220 + n * 38,
      disagree: 130 + n * 22,
    });
    n += 1;
  }

  if (lacrosseSlateName && takes.length < 5) {
    takes.push({
      id: `ht-wknd-${period}-lax`,
      text: `PLL this weekend: who eats at ${lacrosseSlateName} — stars or role players in fantasy?`,
      agree: 265,
      disagree: 178,
    });
  }

  let g = 0;
  while (takes.length < 5) {
    takes.push({
      id: `ht-wknd-${period}-fb-${g}`,
      text: WEEKEND_FALLBACK_QUESTIONS[g % WEEKEND_FALLBACK_QUESTIONS.length] ?? WEEKEND_FALLBACK_QUESTIONS[0]!,
      agree: 210 + g * 31,
      disagree: 165 + g * 19,
    });
    g += 1;
  }

  return takes.slice(0, 5);
}

export function getMarketingHotTakes(params: {
  now?: Date;
  spotlightItems: SpotlightItemLike[];
  lacrosseSlateName?: string | null;
}): MarketingHotTake[] {
  const now = params.now ?? new Date();
  const period = marketingHotTakePeriodIndex(now);

  if (isThursdayHotTakeDay(now)) {
    return buildWeekendHotTakes(period, params.spotlightItems, params.lacrosseSlateName);
  }

  const poolIdx = period % ROTATION_POOLS.length;
  return ROTATION_POOLS[poolIdx] ?? POOL_A;
}
