import { winterFantasyRosterTotalFromPicks, type WinterJsonMatch } from "@wakibet/shared";
import { filterMatchesForDivision, type WinterMatch } from "./winterSpringsData.js";

export function fantasyRosterTotalPoints(
  allMatches: WinterMatch[],
  divisionKey: string,
  picks: { playerName: string; isCaptain: boolean }[],
): number {
  const divMatches = filterMatchesForDivision(allMatches, divisionKey) as WinterJsonMatch[];
  return winterFantasyRosterTotalFromPicks(divMatches, picks);
}
