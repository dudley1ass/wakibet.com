import {
  mlpFranchiseTiebreakMetrics,
  scoreWinterPlayerFromMatches,
  WINTER_FANTASY_RULES,
  type WinterJsonMatch,
} from "@wakibet/shared";
import {
  filterMatchesForDivision,
  isDivisionFeaturedFromMatches,
  parseStoredDivisionKey,
  type TournamentKey,
  type WinterData,
} from "./winterSpringsData.js";

function normKey(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

/** One fantasy submission row (legacy winter or tournament event) for pickleball. */
export type PickleballRosterRowForTiebreak = {
  userId: string;
  divisionKey: string;
  picks: { playerName: string; isCaptain: boolean }[];
  mlpTeamName?: string | null;
  /** User’s guess for total matches in this division (tiebreak #5). */
  predictedTotalMatches?: number | null;
};

export type PickleballTiebreakTuple = [number, number, number, number, number];

function tupleForRosterRow(
  r: PickleballRosterRowForTiebreak,
  tournamentDataByKey: Record<TournamentKey, WinterData | null | undefined>,
): PickleballTiebreakTuple | null {
  const parsed = parseStoredDivisionKey(r.divisionKey);
  if (!parsed) return null;
  const data = tournamentDataByKey[parsed.tournament_key];
  if (!data?.matches) return null;
  if (!isDivisionFeaturedFromMatches(data.matches, parsed.division_key)) return null;

  const divMatches = filterMatchesForDivision(data.matches, parsed.division_key) as WinterJsonMatch[];
  const actualMatchCount = divMatches.length;

  let bestSinglePlayerRaw = 0;
  let bestCaptainScore = 0;
  for (const p of r.picks) {
    const raw = scoreWinterPlayerFromMatches(p.playerName, divMatches).total;
    bestSinglePlayerRaw = Math.max(bestSinglePlayerRaw, raw);
    if (p.isCaptain) {
      const mult = WINTER_FANTASY_RULES.captainMultiplier;
      bestCaptainScore = Math.max(bestCaptainScore, Math.round(raw * mult * 100) / 100);
    }
  }

  const rec = data.mlp_player_to_team;
  let franchiseMatchWins = 0;
  let undefeatedFlag = 0;
  if (parsed.tournament_key.startsWith("mlp_") && r.mlpTeamName?.trim() && rec && Object.keys(rec).length > 0) {
    const m = new Map(Object.entries(rec).map(([k, v]) => [normKey(k), v] as const));
    const pm = mlpFranchiseTiebreakMetrics(divMatches, r.mlpTeamName, m);
    franchiseMatchWins = pm.franchiseMatchWins;
    undefeatedFlag = pm.undefeatedBonusApplied ? 1 : 0;
  }

  const pred = r.predictedTotalMatches;
  const matchCountPredictionCloseness =
    pred == null || !Number.isFinite(pred) ? 0 : -Math.abs(actualMatchCount - pred);

  return [bestSinglePlayerRaw, bestCaptainScore, franchiseMatchWins, undefeatedFlag, matchCountPredictionCloseness];
}

export function mergeUserTiebreaks(slices: PickleballTiebreakTuple[]): PickleballTiebreakTuple {
  if (slices.length === 0) return [0, 0, 0, 0, 0];
  return [
    Math.max(...slices.map((s) => s[0]!)),
    Math.max(...slices.map((s) => s[1]!)),
    slices.reduce((sum, s) => sum + s[2]!, 0),
    Math.max(...slices.map((s) => s[3]!)),
    slices.reduce((sum, s) => sum + s[4]!, 0),
  ];
}

export function compareTiebreakDescending(a: PickleballTiebreakTuple, b: PickleballTiebreakTuple): number {
  for (let i = 0; i < 5; i++) {
    const d = b[i]! - a[i]!;
    if (d !== 0) return d;
  }
  return 0;
}

export function userTiebreakMapFromRosters(
  allRosters: PickleballRosterRowForTiebreak[],
  tournamentDataByKey: Record<TournamentKey, WinterData | null | undefined>,
): Map<string, PickleballTiebreakTuple> {
  const byUser = new Map<string, PickleballTiebreakTuple[]>();
  for (const r of allRosters) {
    const t = tupleForRosterRow(r, tournamentDataByKey);
    if (!t) continue;
    const list = byUser.get(r.userId) ?? [];
    list.push(t);
    byUser.set(r.userId, list);
  }
  const out = new Map<string, PickleballTiebreakTuple>();
  for (const [uid, slices] of byUser) {
    out.set(uid, mergeUserTiebreaks(slices));
  }
  return out;
}
