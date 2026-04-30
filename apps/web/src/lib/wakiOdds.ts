export const WAKIODDS_BASE_RATING = 1500;

export type TeamRatingInput = {
  player1Rating: number;
  player2Rating: number;
  chemistryBonus?: number; // C: 0..50
  recentForm?: number; // F: -50..50
  uncertaintyPenalty?: number; // P: 0..50
};

export type WakiOddsResult = {
  ratingA: number;
  ratingB: number;
  ratingDiff: number;
  probabilityA: number;
  probabilityB: number;
  oddsA: number;
  oddsB: number;
  spreadA: number;
  confidence: number;
};

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

export function expectedScore(ratingA: number, ratingB: number): number {
  return 1 / (1 + Math.pow(10, -(ratingA - ratingB) / 400));
}

export function doublesTeamRating(input: TeamRatingInput): number {
  const chemistry = clamp(input.chemistryBonus ?? 0, 0, 50);
  const form = clamp(input.recentForm ?? 0, -50, 50);
  const uncertainty = clamp(input.uncertaintyPenalty ?? 0, 0, 50);
  return (input.player1Rating + input.player2Rating) / 2 + chemistry + form - uncertainty;
}

export function probabilityToAmericanOdds(probability: number): number {
  const p = clamp(probability, 0.0001, 0.9999);
  if (p >= 0.5) return -Math.round(100 * p / (1 - p));
  return Math.round(100 * (1 - p) / p);
}

export function spreadFromRatingDiff(diff: number): number {
  return Math.round((diff / 50) * 2) / 2;
}

export function confidenceFromProbability(probability: number): number {
  return Math.round(Math.abs(probability - 0.5) * 100);
}

export function computeWakiOdds(ratingA: number, ratingB: number): WakiOddsResult {
  const probA = expectedScore(ratingA, ratingB);
  const probB = 1 - probA;
  const diff = ratingA - ratingB;
  return {
    ratingA,
    ratingB,
    ratingDiff: diff,
    probabilityA: probA,
    probabilityB: probB,
    oddsA: probabilityToAmericanOdds(probA),
    oddsB: probabilityToAmericanOdds(probB),
    spreadA: spreadFromRatingDiff(diff),
    confidence: confidenceFromProbability(probA),
  };
}

export function updateRating(params: {
  current: number;
  expected: number;
  didWin: boolean;
  k?: number;
  scoreDiff?: number;
  useMarginBoost?: boolean;
}): number {
  const k = params.k ?? 32;
  const actual = params.didWin ? 1 : 0;
  const marginMult =
    params.useMarginBoost && params.scoreDiff != null ? Math.log(Math.abs(params.scoreDiff) + 1) : 1;
  return params.current + k * (actual - params.expected) * marginMult;
}
