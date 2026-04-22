/**
 * Winter Springs division fantasy — scores from schedule + optional result fields.
 * Works before exact match times: until results exist, fantasy points stay at 0.
 */

export const WINTER_FANTASY_ROSTER_SIZE = 3;

export const WINTER_FANTASY_RULES = {
  version: 2,
  /** MVP scoring table. */
  winPoints: 5,
  playoffQualifyBonus: 10,
  goldMedalBonus: 25,
  upsetWinBonus: 8,
  undefeatedPoolBonus: 10,
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
  /** Optional explicit stage marker from data pipeline. */
  stage?: string;
  /** Optional explicit stage marker from data pipeline. */
  bracket_stage?: string;
  /** Optional marker for upset wins. */
  is_upset?: boolean;
  upset_win?: boolean;
  /** Optional marker for undefeated pool bonus. */
  undefeated_pool?: boolean;
  undefeated_run?: boolean;
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
  let playoffPts = 0;
  let goldPts = 0;
  let upsetPts = 0;
  let undefeatedPts = 0;

  for (const m of matches) {
    const isA = m.player_a === playerName;
    if (!isA && m.player_b !== playerName) continue;

    const w = winnerDisplayName(m);
    if (w === playerName) {
      winsPts += r.winPoints;
      const stageRaw = String(m.stage ?? m.bracket_stage ?? "").toLowerCase();
      if (
        stageRaw.includes("playoff") ||
        stageRaw.includes("quarter") ||
        stageRaw.includes("semi") ||
        stageRaw.includes("final")
      ) {
        playoffPts += r.playoffQualifyBonus;
      }
      if (m.medal_for_winner === "gold") {
        goldPts += r.goldMedalBonus;
      }
      if (m.is_upset === true || m.upset_win === true) {
        upsetPts += r.upsetWinBonus;
      }
      if (m.undefeated_pool === true || m.undefeated_run === true) {
        undefeatedPts += r.undefeatedPoolBonus;
      }
    }
  }

  const round2 = (n: number) => Math.round(n * 100) / 100;
  const breakdown: WinterFantasyScoreBreakdown[] = [
    { label: "Wins", points: round2(winsPts) },
    { label: "Playoff qualification", points: round2(playoffPts) },
    { label: "Gold medals", points: round2(goldPts) },
    { label: "Upset wins", points: round2(upsetPts) },
    { label: "Undefeated pool runs", points: round2(undefeatedPts) },
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
