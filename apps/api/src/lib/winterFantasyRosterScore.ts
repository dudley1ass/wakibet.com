import {
  mlpTeamLayerPointsFromMatches,
  winterFantasyRosterTotalFromPicks,
  type WinterJsonMatch,
} from "@wakibet/shared";
import { filterMatchesForDivision, type WinterMatch } from "./winterSpringsData.js";

function normKey(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

export type FantasyRosterPointsOpts = {
  mlpTeamName?: string | null;
  mlpPlayerToTeam?: Record<string, string>;
};

export function fantasyRosterTotalPoints(
  allMatches: WinterMatch[],
  divisionKey: string,
  picks: { playerName: string; isCaptain: boolean }[],
  opts?: FantasyRosterPointsOpts | null,
): number {
  const divMatches = filterMatchesForDivision(allMatches, divisionKey) as WinterJsonMatch[];
  let total = winterFantasyRosterTotalFromPicks(divMatches, picks);
  const team = opts?.mlpTeamName?.trim();
  const rec = opts?.mlpPlayerToTeam;
  if (team && rec && Object.keys(rec).length > 0) {
    const m = new Map(Object.entries(rec).map(([k, v]) => [normKey(k), v] as const));
    total += mlpTeamLayerPointsFromMatches(divMatches, team, m).total;
  }
  return Math.round(total * 100) / 100;
}
