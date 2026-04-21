/**
 * Winter Springs division fantasy — scores from schedule + optional result fields.
 * Works before exact match times: until results exist, fantasy points stay at 0.
 */

export const WINTER_FANTASY_ROSTER_SIZE = 3;

export const WINTER_FANTASY_RULES = {
  version: 1,
  /** Per match win for a rostered player. */
  winPoints: 10,
  /** Weight on net points (points_for − points_against) per match. */
  pointDiffMultiplier: 0.25,
  medalGold: 30,
  medalSilver: 18,
  medalBronze: 12,
  /** Bonus per bracket round index (1 = early) for winners when bracket_round is set. */
  advancementPerRound: 4,
} as const;

export type WinterJsonMatch = {
  match_id: string;
  event_type: string;
  skill_level: string;
  age_bracket: string;
  event_date: string;
  player_a: string;
  player_b: string;
  status: string;
  /** When present: side that won (names resolved in scoring). */
  winner?: "player_a" | "player_b" | string;
  points_a?: number;
  points_b?: number;
  /** Medal awarded to the match winner for medal matches. */
  medal_for_winner?: "gold" | "silver" | "bronze";
  /** Higher / later rounds earn more advancement credit for the winner. */
  bracket_round?: number;
};

export type WinterFantasyScoreBreakdown = {
  label: string;
  points: number;
};

function winnerDisplayName(m: WinterJsonMatch): string | null {
  if (!m.winner) return null;
  if (m.winner === "player_a") return m.player_a;
  if (m.winner === "player_b") return m.player_b;
  if (m.winner === m.player_a || m.winner === m.player_b) return m.winner;
  return null;
}

/**
 * Fantasy points for one player across matches (typically one division slice).
 */
export function scoreWinterPlayerFromMatches(
  playerName: string,
  matches: WinterJsonMatch[],
): { total: number; breakdown: WinterFantasyScoreBreakdown[] } {
  const r = WINTER_FANTASY_RULES;
  let winsPts = 0;
  let diffPts = 0;
  let medalPts = 0;
  let advancePts = 0;

  for (const m of matches) {
    const isA = m.player_a === playerName;
    if (!isA && m.player_b !== playerName) continue;

    const w = winnerDisplayName(m);
    if (w === playerName) {
      winsPts += r.winPoints;
      if (m.medal_for_winner) {
        medalPts +=
          m.medal_for_winner === "gold"
            ? r.medalGold
            : m.medal_for_winner === "silver"
              ? r.medalSilver
              : r.medalBronze;
      }
      if (m.bracket_round != null && m.bracket_round > 0) {
        advancePts += m.bracket_round * r.advancementPerRound;
      }
    }

    const pa = m.points_a;
    const pb = m.points_b;
    if (pa != null && pb != null && Number.isFinite(pa) && Number.isFinite(pb)) {
      const mine = isA ? pa : pb;
      const theirs = isA ? pb : pa;
      diffPts += (mine - theirs) * r.pointDiffMultiplier;
    }
  }

  const round2 = (n: number) => Math.round(n * 100) / 100;
  const breakdown: WinterFantasyScoreBreakdown[] = [
    { label: "Wins", points: round2(winsPts) },
    { label: "Point differential", points: round2(diffPts) },
    { label: "Medals", points: round2(medalPts) },
    { label: "Advancement", points: round2(advancePts) },
  ];
  const total = round2(breakdown.reduce((s, b) => s + b.points, 0));
  return { total, breakdown };
}

const CAPTAIN_MULT = 1.5;

export type WinterFantasyRosterRow = {
  player_name: string;
  points: number;
  is_captain: boolean;
};

/** Sum roster fantasy points with a single captain multiplier (1.5× on captain slot). */
export function scoreWinterFantasyRoster(rows: WinterFantasyRosterRow[]): number {
  let total = 0;
  for (const row of rows) {
    const mult = row.is_captain ? CAPTAIN_MULT : 1;
    total += row.points * mult;
  }
  return Math.round(total * 100) / 100;
}
