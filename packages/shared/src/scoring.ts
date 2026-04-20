/**
 * Pure scoring — no I/O. Unit-test this exhaustively (Phase 6).
 * Captain multiplier: optional 1.5x on one slot when isCaptain is true.
 */

export const SCORING_RULES = {
  version: 1,
  matchWon: 5,
  setWon: 2,
  setLost: -1,
  pointWon: 0.1,
  pointLost: -0.05,
  ace: 0.5,
  winner: 0.3,
  unforcedError: -0.2,
  straightSetsWinBonus: 2,
  comebackWinBonus: 3,
} as const;

export type PlayerStatsInput = {
  matchWon: boolean;
  setsWon: number;
  setsLost: number;
  pointsWon: number;
  pointsLost: number;
  aces: number;
  winners: number;
  unforcedErrors: number;
};

export function scorePlayerMatch(stats: PlayerStatsInput): number {
  const r = SCORING_RULES;
  let pts =
    (stats.matchWon ? r.matchWon : 0) +
    stats.setsWon * r.setWon +
    stats.setsLost * r.setLost +
    stats.pointsWon * r.pointWon +
    stats.pointsLost * r.pointLost +
    stats.aces * r.ace +
    stats.winners * r.winner +
    stats.unforcedErrors * r.unforcedError;

  if (stats.matchWon && stats.setsLost === 0 && stats.setsWon >= 2) {
    pts += r.straightSetsWinBonus;
  }
  if (stats.matchWon && stats.setsLost > 0 && stats.setsWon > stats.setsLost) {
    const lostFirst =
      stats.setsLost >= 1 &&
      stats.setsWon > 0 &&
      stats.setsWon + stats.setsLost >= 2;
    if (lostFirst) {
      pts += r.comebackWinBonus;
    }
  }
  return Math.round(pts * 100) / 100;
}

export type LineupScoreRow = {
  playerId: string;
  points: number;
  isCaptain?: boolean;
};

const CAPTAIN_MULT = 1.5;

export function scoreLineup(playerScores: LineupScoreRow[]): number {
  let total = 0;
  for (const row of playerScores) {
    const mult = row.isCaptain ? CAPTAIN_MULT : 1;
    total += row.points * mult;
  }
  return Math.round(total * 100) / 100;
}
