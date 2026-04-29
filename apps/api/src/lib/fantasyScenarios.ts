import {
  mlpTeamLayerPointsFromMatches,
  nextUndecidedMatchForPlayer,
  replaceMatchWithOutcome,
  scoreWinterPlayerFromMatches,
  syntheticMatchWithWinner,
  winterFantasyRosterTotalFromPicks,
  WINTER_FANTASY_RULES,
  type MatchWinnerSide,
  type WinterJsonMatch,
} from "@wakibet/shared";
import { filterMatchesForDivision, type TournamentKey, type WinterData } from "./winterSpringsData.js";

function normKey(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

function rosterSliceTotalWithMlp(
  divMatches: WinterJsonMatch[],
  picksDb: { playerName: string; isCaptain: boolean }[],
  mult: number,
  mlpTeam: string | null | undefined,
  mlpMap: Record<string, string> | undefined,
): number {
  let base = winterFantasyRosterTotalFromPicks(divMatches, picksDb);
  const team = mlpTeam?.trim();
  if (team && mlpMap && Object.keys(mlpMap).length > 0) {
    const m = new Map(Object.entries(mlpMap).map(([k, v]) => [normKey(k), v] as const));
    base += mlpTeamLayerPointsFromMatches(divMatches, team, m).total;
  }
  return Math.round(base * mult * 100) / 100;
}

export type WhatIfScenario = {
  scenario_key: string;
  kind: "win_next" | "lose_next";
  player_name: string;
  tournament_key: TournamentKey;
  tournament_name: string;
  division_label: string;
  match_summary: string;
  opponent: string;
  event_date: string;
  /** WakiPoints change for this division roster only (captain rules applied via engine). */
  roster_waki_delta: number;
  /**
   * Change for the scenario headline player only (same match can move other rostered players too).
   * Use this for "If {name} wins/loses" display; see roster_waki_delta for full lineup net.
   */
  scenario_player_delta: number;
  /** Same as roster delta for this user (only one division touched per scenario). */
  season_waki_delta: number;
  rank_before: number | null;
  rank_after: number | null;
  impact: "high" | "standard" | "risk";
};

type LeaderRow = { user_id: string; display_name: string; points: number };

function recomputeRank(board: LeaderRow[], userId: string, newPoints: number): number {
  const next = board.map((r) => (r.user_id === userId ? { ...r, points: newPoints } : r));
  next.sort((a, b) => {
    const d = b.points - a.points;
    if (d !== 0) return d;
    const dn = a.display_name.localeCompare(b.display_name, undefined, { sensitivity: "base" });
    if (dn !== 0) return dn;
    return a.user_id.localeCompare(b.user_id);
  });
  let rank = 0;
  for (let i = 0; i < next.length; i++) {
    if (i === 0 || next[i]!.points < next[i - 1]!.points) rank = i + 1;
    if (next[i]!.user_id === userId) return rank;
  }
  return next.length;
}

function classifyImpact(
  kind: "win_next" | "lose_next",
  seasonDelta: number,
  rankBefore: number | null,
  rankAfter: number | null,
): WhatIfScenario["impact"] {
  if (kind === "lose_next" || seasonDelta < 0) return "risk";
  if (rankBefore != null && rankAfter != null && rankBefore > rankAfter && rankBefore - rankAfter >= 3) {
    return "high";
  }
  if (seasonDelta >= 12) return "high";
  return "standard";
}

export function buildWhatIfScenarios(
  userId: string,
  myDisplayName: string,
  currentSeasonPoints: number,
  winterFantasyRosters: {
    tournament_key: TournamentKey;
    tournament_name: string;
    division_key: string;
    event_type: string;
    skill_level: string;
    age_bracket: string;
    picks: { player_name: string; is_captain: boolean }[];
    /** Optional tier multiplier (fantasy tournament events). */
    wakipoints_multiplier?: number;
    /** MLP fantasy tournament event: franchise bonus pick. */
    mlp_team_name?: string | null;
  }[],
  tournamentDataByKey: Record<TournamentKey, WinterData | null | undefined>,
  leaderboardRows: { user_id: string; display_name: string; points: number; rank: number }[],
  maxScenarios: number,
): WhatIfScenario[] {
  const board: LeaderRow[] = leaderboardRows.map((r) => ({
    user_id: r.user_id,
    display_name: r.display_name,
    points: r.points,
  }));
  if (!board.some((r) => r.user_id === userId)) {
    board.push({
      user_id: userId,
      display_name: myDisplayName,
      points: Math.round(currentSeasonPoints * 100) / 100,
    });
  }
  const rankBefore =
    board.length === 0 ? null : recomputeRank(board, userId, Math.round(currentSeasonPoints * 100) / 100);

  const out: WhatIfScenario[] = [];

  for (const roster of winterFantasyRosters) {
    const data = tournamentDataByKey[roster.tournament_key];
    if (!data?.matches?.length) continue;
    const divMatches = filterMatchesForDivision(data.matches, roster.division_key) as WinterJsonMatch[];
    const picksDb = roster.picks.map((p) => ({
      playerName: p.player_name,
      isCaptain: p.is_captain,
    }));

    const mult = roster.wakipoints_multiplier ?? 1;
    const baseRoster = rosterSliceTotalWithMlp(
      divMatches,
      picksDb,
      mult,
      roster.mlp_team_name,
      data.mlp_player_to_team,
    );
    const divLabel = `${roster.event_type} / ${roster.skill_level} · ${roster.age_bracket}`;

    for (const pick of roster.picks) {
      const nm = pick.player_name;
      const next = nextUndecidedMatchForPlayer(divMatches, nm);
      if (!next) continue;

      const opp = next.player_a === nm ? next.player_b : next.player_a;
      const winSide: MatchWinnerSide = next.player_a === nm ? "player_a" : "player_b";
      const loseSide: MatchWinnerSide = winSide === "player_a" ? "player_b" : "player_a";

      const pickCfg = picksDb.find((p) => p.playerName === nm);

      const pushScenario = (
        kind: "win_next" | "lose_next",
        side: MatchWinnerSide,
        scenario_key_suffix: string,
      ) => {
        const syn = syntheticMatchWithWinner(next, side);
        const aug = replaceMatchWithOutcome(divMatches, next.match_id, syn);
        const rosterAfter = rosterSliceTotalWithMlp(aug, picksDb, mult, roster.mlp_team_name, data.mlp_player_to_team);
        const rosterDelta = Math.round((rosterAfter - baseRoster) * 100) / 100;

        let scenarioPlayerDelta = 0;
        if (pickCfg) {
          const beforeP = scoreWinterPlayerFromMatches(nm, divMatches).total;
          const afterP = scoreWinterPlayerFromMatches(nm, aug).total;
          const cap = pickCfg.isCaptain ? WINTER_FANTASY_RULES.captainMultiplier : 1;
          scenarioPlayerDelta = Math.round((afterP * cap - beforeP * cap) * mult * 100) / 100;
        }

        if (Math.abs(rosterDelta) < 1e-9 && Math.abs(scenarioPlayerDelta) < 1e-9) return;

        const seasonDelta = rosterDelta;
        const newSeason = Math.round((currentSeasonPoints + seasonDelta) * 100) / 100;
        const ra = board.length === 0 ? null : recomputeRank(board, userId, newSeason);
        const impact = classifyImpact(kind, seasonDelta, rankBefore, ra);

        out.push({
          scenario_key: `${roster.division_key}::${next.match_id}::${scenario_key_suffix}::${nm}`,
          kind,
          player_name: nm,
          tournament_key: roster.tournament_key,
          tournament_name: roster.tournament_name,
          division_label: divLabel,
          match_summary: `${next.player_a} vs ${next.player_b}`,
          opponent: opp,
          event_date: next.event_date,
          roster_waki_delta: rosterDelta,
          scenario_player_delta: scenarioPlayerDelta,
          season_waki_delta: seasonDelta,
          rank_before: rankBefore,
          rank_after: ra,
          impact,
        });
      };

      pushScenario("win_next", winSide, "win");
      pushScenario("lose_next", loseSide, "lose");
    }
  }

  out.sort((a, b) => {
    const ma = Math.max(Math.abs(a.roster_waki_delta), Math.abs(a.scenario_player_delta));
    const mb = Math.max(Math.abs(b.roster_waki_delta), Math.abs(b.scenario_player_delta));
    return mb - ma;
  });
  return out.slice(0, maxScenarios);
}
