/**
 * Winter / multi-tournament division fantasy — scores from schedule + optional result fields.
 * v3 “full table”: core, performance, progression, Waki bonuses, streaks, specials, light penalties.
 * Rows without optional data (scores, seeds, flags) simply skip those buckets.
 */

export const WINTER_FANTASY_ROSTER_SIZE = 5;

/** v3 scoring constants (WakiBet full table). Captain multiplier stays at roster level (×1.5). */
export const WINTER_FANTASY_RULES = {
  version: 3,
  matchWinPoints: 5,
  forfeitWinPoints: 3,
  winMargin57Points: 2,
  winMargin8PlusPoints: 4,
  shutout110Points: 6,
  comebackWinPoints: 5,
  playoffQualifyPoints: 10,
  quarterfinalWinPoints: 8,
  semifinalWinPoints: 10,
  finalWinPoints: 15,
  goldMedalPoints: 25,
  silverMedalPoints: 15,
  bronzeMedalPoints: 10,
  upsetWinPoints: 8,
  beatTop3SeedPoints: 5,
  lowOwnedPickPoints: 10,
  captainMultiplier: 1.5,
  winStreak3Points: 5,
  winStreak5Points: 10,
  undefeatedPoolPoints: 10,
  perfectTournamentDivisionPoints: 20,
  doubleMedalTwoDivisionsPoints: 15,
  triplePlaySameDayPoints: 8,
  partnerUpsetComboPoints: 12,
  earlyEliminationPenalty: -5,
  favoriteUpsetLossPenalty: -3,
} as const;

/** MLP tournament fantasy — team bonus layer (applied on top of player scoring). */
export const MLP_TEAM_FANTASY_RULES = {
  version: 1,
  /** Each schedule row your franchise wins (via the winning player’s team). */
  teamMatchWinPoints: 20,
  /** Once per event when the schedule marks a clincher (see `mlp_team_event_win` or gold final). */
  teamEventWinPoints: 40,
  /** When your franchise finishes every in-division match with zero losses (and at least one win). */
  teamUndefeatedBonusPoints: 15,
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
  bracket_round?: number;
  stage?: string;
  bracket_stage?: string;
  is_upset?: boolean;
  upset_win?: boolean;
  undefeated_pool?: boolean;
  undefeated_run?: boolean;
  /** Pipeline can set when win came via forfeit / walkover. */
  forfeit?: boolean;
  /** MLP: when true, the winning player’s franchise clinches the team “event win” bonus (+40 by default). */
  mlp_team_event_win?: boolean;
  /** Optional seeds (1 = top seed). Used for upset / beat-top-3 / favorite-loss penalties. */
  player_a_seed?: number;
  player_b_seed?: number;
  /** Set when winner came back from down ≥5 (otherwise ignored). */
  comeback_win?: boolean;
  /** Bonus flags when present in schedule JSON. */
  double_medal_two_divisions?: boolean;
  triple_play_same_day?: boolean;
  partner_upset_combo?: boolean;
  /** When set with roster-level ownership %, engine may add low-owned bonus (future). */
  low_owned_pick_bonus?: boolean;
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

/** True when the schedule row has a resolved winner (fantasy scoring can apply). */
export function winterJsonMatchHasWinner(m: WinterJsonMatch): boolean {
  return winnerDisplayName(m) !== null;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

function stageText(m: WinterJsonMatch): string {
  return String(m.stage ?? m.bracket_stage ?? "").toLowerCase();
}

function isForfeitWin(m: WinterJsonMatch, playerWon: boolean): boolean {
  if (!playerWon) return false;
  if (m.forfeit === true) return true;
  const st = m.status?.toLowerCase() ?? "";
  return st.includes("forfeit") || st.includes("walkover") || st.includes(" fft") || st.includes("ff ");
}

function bracketProgressionLine(m: WinterJsonMatch): WinterFantasyScoreBreakdown | null {
  const s = stageText(m);
  const r = WINTER_FANTASY_RULES;
  if (/\bfinal\b/.test(s) || s.includes("championship")) {
    return { label: "Final win", points: r.finalWinPoints };
  }
  if (s.includes("semi")) {
    return { label: "Semifinal win", points: r.semifinalWinPoints };
  }
  if (s.includes("quarter") || /\bqf\b/.test(s)) {
    return { label: "Quarterfinal win", points: r.quarterfinalWinPoints };
  }
  if (s.includes("playoff") || s.includes("bracket") || s.includes("elimination")) {
    return { label: "Playoff qualification", points: r.playoffQualifyPoints };
  }
  return null;
}

function marginAndShutoutLines(m: WinterJsonMatch, winnerName: string): WinterFantasyScoreBreakdown[] {
  const pa = m.points_a;
  const pb = m.points_b;
  if (pa == null || pb == null || Number.isNaN(pa) || Number.isNaN(pb)) return [];
  const wScore = winnerName === m.player_a ? pa : pb;
  const lScore = winnerName === m.player_a ? pb : pa;
  const margin = wScore - lScore;
  const r = WINTER_FANTASY_RULES;
  const out: WinterFantasyScoreBreakdown[] = [];
  if (wScore >= 11 && lScore === 0) {
    out.push({ label: "Shutout (11–0)", points: r.shutout110Points });
    return out;
  }
  if (margin >= 8) out.push({ label: "Win margin (8+)", points: r.winMargin8PlusPoints });
  else if (margin >= 5) out.push({ label: "Win margin (5–7)", points: r.winMargin57Points });
  return out;
}

function medalLine(m: WinterJsonMatch): WinterFantasyScoreBreakdown | null {
  const r = WINTER_FANTASY_RULES;
  if (m.medal_for_winner === "gold") return { label: "Gold medal", points: r.goldMedalPoints };
  if (m.medal_for_winner === "silver") return { label: "Silver medal", points: r.silverMedalPoints };
  if (m.medal_for_winner === "bronze") return { label: "Bronze medal", points: r.bronzeMedalPoints };
  return null;
}

function seedOfPlayer(m: WinterJsonMatch, playerName: string): number | null {
  if (m.player_a === playerName) {
    return m.player_a_seed != null && !Number.isNaN(m.player_a_seed) ? m.player_a_seed : null;
  }
  if (m.player_b === playerName) {
    return m.player_b_seed != null && !Number.isNaN(m.player_b_seed) ? m.player_b_seed : null;
  }
  return null;
}

function opponentName(m: WinterJsonMatch, playerName: string): string | null {
  if (m.player_a === playerName) return m.player_b;
  if (m.player_b === playerName) return m.player_a;
  return null;
}

function beatTop3SeedLine(m: WinterJsonMatch, playerName: string, winnerName: string): WinterFantasyScoreBreakdown | null {
  if (winnerName !== playerName) return null;
  const opp = opponentName(m, playerName);
  if (!opp) return null;
  const oppSeed =
    opp === m.player_a
      ? m.player_a_seed
      : opp === m.player_b
        ? m.player_b_seed
        : null;
  if (oppSeed == null || oppSeed > 3 || oppSeed < 1) return null;
  return { label: "Beat top-3 seed", points: WINTER_FANTASY_RULES.beatTop3SeedPoints };
}

function lowOwnedLine(m: WinterJsonMatch): WinterFantasyScoreBreakdown | null {
  if (m.low_owned_pick_bonus === true) {
    return { label: "Low-owned pick bonus", points: WINTER_FANTASY_RULES.lowOwnedPickPoints };
  }
  return null;
}

function specialFlagLines(m: WinterJsonMatch): WinterFantasyScoreBreakdown[] {
  const r = WINTER_FANTASY_RULES;
  const out: WinterFantasyScoreBreakdown[] = [];
  if (m.double_medal_two_divisions === true) {
    out.push({ label: "Double medal (two divisions)", points: r.doubleMedalTwoDivisionsPoints });
  }
  if (m.partner_upset_combo === true) {
    out.push({ label: "Partner upset combo", points: r.partnerUpsetComboPoints });
  }
  return out;
}

/**
 * Fantasy credit lines for one player on a single match (wins + optional loss penalties).
 */
export function scoreWinterPlayerWinOnMatch(playerName: string, m: WinterJsonMatch): WinterFantasyScoreBreakdown[] {
  const isA = m.player_a === playerName;
  if (!isA && m.player_b !== playerName) return [];
  const w = winnerDisplayName(m);
  if (!w) return [];

  const r = WINTER_FANTASY_RULES;
  const lines: WinterFantasyScoreBreakdown[] = [];

  if (w === playerName) {
    const forfeit = isForfeitWin(m, true);
    if (forfeit) lines.push({ label: "Forfeit win", points: r.forfeitWinPoints });
    else lines.push({ label: "Match win", points: r.matchWinPoints });

    if (!forfeit) lines.push(...marginAndShutoutLines(m, w));
    if (m.comeback_win === true) {
      lines.push({ label: "Comeback win", points: r.comebackWinPoints });
    }
    const prog = bracketProgressionLine(m);
    if (prog) lines.push(prog);
    const medal = medalLine(m);
    if (medal) lines.push(medal);
    if (m.is_upset === true || m.upset_win === true) {
      lines.push({ label: "Upset win", points: r.upsetWinPoints });
    }
    const b3 = beatTop3SeedLine(m, playerName, w);
    if (b3) lines.push(b3);
    const low = lowOwnedLine(m);
    if (low) lines.push(low);
    if (m.undefeated_pool === true || m.undefeated_run === true) {
      lines.push({ label: "Undefeated pool", points: r.undefeatedPoolPoints });
    }
    lines.push(...specialFlagLines(m));
    return lines.map((x) => ({ ...x, points: round2(x.points) })).filter((x) => x.points !== 0);
  }

  // Loss path — penalties only when we can infer favorite / upset
  const loser = playerName;
  const upset = m.is_upset === true || m.upset_win === true;
  const mySeed = seedOfPlayer(m, loser);
  const oppN = opponentName(m, loser);
  const oppSeed =
    oppN === m.player_a ? m.player_a_seed : oppN === m.player_b ? m.player_b_seed : null;
  if (upset && mySeed != null && oppSeed != null && mySeed < oppSeed) {
    lines.push({ label: "Favorite upset loss (penalty)", points: r.favoriteUpsetLossPenalty });
  }
  return lines.map((x) => ({ ...x, points: round2(x.points) })).filter((x) => x.points !== 0);
}

function addToMap(map: Map<string, number>, label: string, pts: number): void {
  if (pts === 0) return;
  map.set(label, round2((map.get(label) ?? 0) + pts));
}

function mergeMapToBreakdown(map: Map<string, number>): WinterFantasyScoreBreakdown[] {
  return [...map.entries()]
    .map(([label, points]) => ({ label, points: round2(points) }))
    .filter((b) => b.points !== 0)
    .sort((a, b) => a.label.localeCompare(b.label));
}

function winLossSequence(sorted: WinterJsonMatch[], playerName: string): ("W" | "L" | "P")[] {
  const seq: ("W" | "L" | "P")[] = [];
  for (const m of sorted) {
    const isA = m.player_a === playerName;
    const isB = m.player_b === playerName;
    if (!isA && !isB) continue;
    const w = winnerDisplayName(m);
    if (!w) {
      seq.push("P");
      continue;
    }
    seq.push(w === playerName ? "W" : "L");
  }
  return seq;
}

function maxWinStreak(seq: ("W" | "L" | "P")[]): number {
  let cur = 0;
  let best = 0;
  for (const s of seq) {
    if (s === "W") {
      cur += 1;
      best = Math.max(best, cur);
    } else {
      cur = 0;
    }
  }
  return best;
}

function triplePlaySameDayBonus(sorted: WinterJsonMatch[], playerName: string): number {
  const winsByDay = new Map<string, number>();
  for (const m of sorted) {
    const w = winnerDisplayName(m);
    if (!w || w !== playerName) continue;
    const day = (m.event_date || "").slice(0, 10);
    if (!day) continue;
    winsByDay.set(day, (winsByDay.get(day) ?? 0) + 1);
  }
  let bonus = 0;
  for (const c of winsByDay.values()) {
    if (c >= 3) bonus += WINTER_FANTASY_RULES.triplePlaySameDayPoints;
  }
  return bonus;
}

function divisionMetaBonuses(
  playerName: string,
  sorted: WinterJsonMatch[],
): WinterFantasyScoreBreakdown[] {
  const r = WINTER_FANTASY_RULES;
  const out: WinterFantasyScoreBreakdown[] = [];
  const seq = winLossSequence(sorted, playerName);
  const maxStreak = maxWinStreak(seq);
  if (maxStreak >= 5) {
    out.push({ label: "5-match win streak", points: r.winStreak5Points });
    out.push({ label: "3-match win streak", points: r.winStreak3Points });
  } else if (maxStreak >= 3) {
    out.push({ label: "3-match win streak", points: r.winStreak3Points });
  }

  const triple = triplePlaySameDayBonus(sorted, playerName);
  if (triple > 0) {
    out.push({ label: "Triple play (same day)", points: round2(triple) });
  }

  const played = seq.filter((s) => s !== "P");
  const wins = seq.filter((s) => s === "W").length;
  const losses = seq.filter((s) => s === "L").length;
  const pending = seq.filter((s) => s === "P").length;
  if (pending === 0 && played.length >= 4 && wins === 0) {
    out.push({ label: "Early elimination", points: r.earlyEliminationPenalty });
  }
  if (pending === 0 && played.length >= 3 && losses === 0 && wins > 0) {
    out.push({ label: "Perfect tournament (division)", points: r.perfectTournamentDivisionPoints });
  }
  return out;
}

/**
 * Fantasy points for one player across matches (one division slice).
 */
export function scoreWinterPlayerFromMatches(
  playerName: string,
  matches: WinterJsonMatch[],
): { total: number; breakdown: WinterFantasyScoreBreakdown[] } {
  const sorted = [...matches].sort((a, b) => a.event_date.localeCompare(b.event_date));
  const map = new Map<string, number>();

  for (const m of sorted) {
    for (const line of scoreWinterPlayerWinOnMatch(playerName, m)) {
      addToMap(map, line.label, line.points);
    }
  }
  for (const line of divisionMetaBonuses(playerName, sorted)) {
    addToMap(map, line.label, line.points);
  }

  const breakdown = mergeMapToBreakdown(map);
  const total = round2(breakdown.reduce((s, b) => s + b.points, 0));
  return { total, breakdown };
}

const CAPTAIN_MULT = WINTER_FANTASY_RULES.captainMultiplier;

export type WinterFantasyRosterRow = {
  player_name: string;
  points: number;
  is_captain: boolean;
};

/** Sum roster fantasy points with captain multiplier (1.5×) on the captain slot’s raw points. */
export function scoreWinterFantasyRoster(rows: WinterFantasyRosterRow[]): number {
  let total = 0;
  for (const row of rows) {
    const mult = row.is_captain ? CAPTAIN_MULT : 1;
    total += row.points * mult;
  }
  return Math.round(total * 100) / 100;
}

/**
 * Total WakiPoints for one division roster — the same math the API uses for a saved lineup
 * (per-player totals from the scoring table, then captain ×1.5 on one slot).
 */
export function winterFantasyRosterTotalFromPicks(
  divisionMatches: WinterJsonMatch[],
  picks: { playerName: string; isCaptain: boolean }[],
): number {
  const rows = picks.map((p) => ({
    player_name: p.playerName,
    points: scoreWinterPlayerFromMatches(p.playerName, divisionMatches).total,
    is_captain: p.isCaptain,
  }));
  return scoreWinterFantasyRoster(rows);
}

function normFantasyKey(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

function teamForPlayerNorm(
  playerName: string,
  playerToTeamByNormPlayer: Map<string, string>,
): string | null {
  const t = playerToTeamByNormPlayer.get(normFantasyKey(playerName));
  return t ? t.trim() : null;
}

/**
 * MLP-only: WakiPoints from the single franchise “team pick” for one event division slice.
 * `playerToTeamByNormPlayer` maps normalized player names → official franchise label (must match pick UI).
 */
export function mlpTeamLayerPointsFromMatches(
  divisionMatches: WinterJsonMatch[],
  pickedTeamRaw: string | null | undefined,
  playerToTeamByNormPlayer: Map<string, string>,
): { total: number; breakdown: WinterFantasyScoreBreakdown[] } {
  const picked = pickedTeamRaw?.trim();
  if (!picked) return { total: 0, breakdown: [] };
  const pickedN = normFantasyKey(picked);
  const sorted = [...divisionMatches].sort((a, b) => (a.event_date || "").localeCompare(b.event_date || ""));

  const r = MLP_TEAM_FANTASY_RULES;
  let matchRowsWon = 0;
  let eventWinGranted = false;

  for (const m of sorted) {
    const wn = winnerDisplayName(m);
    if (!wn) continue;
    const winTeam = teamForPlayerNorm(wn, playerToTeamByNormPlayer);
    if (!winTeam || normFantasyKey(winTeam) !== pickedN) continue;
    matchRowsWon += 1;

    const st = String(m.stage ?? m.bracket_stage ?? "").toLowerCase();
    const clinch =
      m.mlp_team_event_win === true ||
      (m.medal_for_winner === "gold" && (/\bfinal\b/.test(st) || st.includes("championship")));
    if (clinch && !eventWinGranted) eventWinGranted = true;
  }

  const matchPts = matchRowsWon * r.teamMatchWinPoints;
  const eventPts = eventWinGranted ? r.teamEventWinPoints : 0;

  let pickedWins = 0;
  let pickedLosses = 0;
  let pickedPending = 0;
  for (const m of sorted) {
    const ta = teamForPlayerNorm(m.player_a, playerToTeamByNormPlayer);
    const tb = teamForPlayerNorm(m.player_b, playerToTeamByNormPlayer);
    if (!ta || !tb) continue;
    if (normFantasyKey(ta) === normFantasyKey(tb)) continue;
    const touches = normFantasyKey(ta) === pickedN || normFantasyKey(tb) === pickedN;
    if (!touches) continue;
    const wn = winnerDisplayName(m);
    if (!wn) {
      pickedPending += 1;
      continue;
    }
    const wt = teamForPlayerNorm(wn, playerToTeamByNormPlayer);
    const loser = wn === m.player_a ? m.player_b : m.player_a;
    const lt = teamForPlayerNorm(loser, playerToTeamByNormPlayer);
    if (wt && normFantasyKey(wt) === pickedN) pickedWins += 1;
    if (lt && normFantasyKey(lt) === pickedN) pickedLosses += 1;
  }

  const und =
    pickedPending === 0 && pickedWins > 0 && pickedLosses === 0 ? r.teamUndefeatedBonusPoints : 0;

  const breakdown: WinterFantasyScoreBreakdown[] = [];
  if (matchPts > 0) {
    breakdown.push({ label: `MLP team match wins (${matchRowsWon}×)`, points: round2(matchPts) });
  }
  if (eventPts > 0) breakdown.push({ label: "MLP team event win", points: round2(eventPts) });
  if (und > 0) breakdown.push({ label: "MLP team undefeated (event)", points: round2(und) });

  const total = round2(breakdown.reduce((s, b) => s + b.points, 0));
  return { total, breakdown };
}

export type MatchWinnerSide = "player_a" | "player_b";

/** Replace one row by `match_id`, or append if missing (defensive). */
export function replaceMatchWithOutcome(
  divisionMatches: WinterJsonMatch[],
  matchId: string,
  updated: WinterJsonMatch,
): WinterJsonMatch[] {
  let hit = false;
  const next = divisionMatches.map((m) => {
    if (m.match_id !== matchId) return m;
    hit = true;
    return updated;
  });
  return hit ? next : [...divisionMatches, updated];
}

/**
 * Force a completed match for projections. Upset bonus uses seeds only (same rules as live scoring).
 */
export function syntheticMatchWithWinner(m: WinterJsonMatch, winner: MatchWinnerSide): WinterJsonMatch {
  const ws = winner === "player_a" ? m.player_a_seed : m.player_b_seed;
  const ls = winner === "player_a" ? m.player_b_seed : m.player_a_seed;
  const upset =
    ws != null &&
    ls != null &&
    !Number.isNaN(Number(ws)) &&
    !Number.isNaN(Number(ls)) &&
    Number(ws) > Number(ls);
  return {
    ...m,
    winner,
    ...(upset ? { upset_win: true as const } : {}),
  };
}

/** Earliest undecided match in this division that lists `playerName` on either side. */
export function nextUndecidedMatchForPlayer(
  divisionMatches: WinterJsonMatch[],
  playerName: string,
): WinterJsonMatch | null {
  const sorted = [...divisionMatches].sort((a, b) => a.event_date.localeCompare(b.event_date));
  for (const m of sorted) {
    if (winnerDisplayName(m)) continue;
    if (m.player_a !== playerName && m.player_b !== playerName) continue;
    return m;
  }
  return null;
}
