import {
  scoreWinterFantasyRoster,
  scoreWinterPlayerFromMatches,
  type WinterJsonMatch,
} from "@wakibet/shared";
import { filterMatchesForDivision, type WinterMatch } from "./winterSpringsData.js";

export function fantasyRosterTotalPoints(
  allMatches: WinterMatch[],
  divisionKey: string,
  picks: { playerName: string; isCaptain: boolean }[],
): number {
  const divMatches = filterMatchesForDivision(allMatches, divisionKey) as WinterJsonMatch[];
  const rows = picks.map((p) => {
    const { total } = scoreWinterPlayerFromMatches(p.playerName, divMatches);
    return {
      player_name: p.playerName,
      points: total,
      is_captain: p.isCaptain,
    };
  });
  return scoreWinterFantasyRoster(rows);
}
