import {
  scoreWinterPlayerFromMatches,
  scoreWinterPlayerWinOnMatch,
  winterJsonMatchHasWinner,
  type WinterJsonMatch,
} from "@wakibet/shared";
import { fantasyRosterTotalPoints } from "./winterFantasyRosterScore.js";
import {
  filterMatchesForDivision,
  isDivisionFeaturedFromMatches,
  parseStoredDivisionKey,
  type TournamentKey,
  type WinterData,
} from "./winterSpringsData.js";

type PickRow = { slotIndex: number; playerName: string; isCaptain: boolean };

export type FantasyRosterDbRow = {
  userId: string;
  divisionKey: string;
  user: { displayName: string };
  picks: PickRow[];
};

function headlineForBreakdownLabel(label: string, pts: number): string {
  if (label === "Gold medals") return `🏆 Gold medal +${pts}`;
  if (label === "Upset wins") return `🔥 Upset win +${pts}`;
  if (label === "Playoff qualification") return `⚡ Playoff leg +${pts}`;
  if (label === "Undefeated pool runs") return `💥 Undefeated pool +${pts}`;
  if (label === "Wins") return `✅ Match win +${pts}`;
  return `✨ ${label} +${pts}`;
}

export function buildFantasyRecentHits(
  rosters: { tournament_key: TournamentKey; division_key: string; picks: { player_name: string }[] }[],
  tournamentDataByKey: Record<TournamentKey, WinterData | null | undefined>,
  limit: number,
): { headline: string; points: number; occurred_at: string }[] {
  type Hit = { headline: string; points: number; occurred_at: string; dedupe: string };
  const hits: Hit[] = [];

  for (const roster of rosters) {
    const data = tournamentDataByKey[roster.tournament_key];
    if (!data?.matches?.length) continue;
    const divMatches = filterMatchesForDivision(data.matches, roster.division_key) as WinterJsonMatch[];
    const sorted = [...divMatches].sort((a, b) => b.event_date.localeCompare(a.event_date));
    for (const m of sorted) {
      if (!winterJsonMatchHasWinner(m)) continue;
      for (const pick of roster.picks) {
        const lines = scoreWinterPlayerWinOnMatch(pick.player_name, m);
        for (const b of lines) {
          hits.push({
            headline: headlineForBreakdownLabel(b.label, b.points),
            points: b.points,
            occurred_at: m.event_date,
            dedupe: `${m.match_id}|${pick.player_name}|${b.label}`,
          });
        }
      }
    }
  }

  hits.sort((a, b) => b.occurred_at.localeCompare(a.occurred_at));
  const seen = new Set<string>();
  const out: { headline: string; points: number; occurred_at: string }[] = [];
  for (const h of hits) {
    if (seen.has(h.dedupe)) continue;
    seen.add(h.dedupe);
    out.push({ headline: h.headline, points: h.points, occurred_at: h.occurred_at });
    if (out.length >= limit) break;
  }
  return out;
}

export function buildFantasyProgressStops(
  byDivision: { tournament_key: TournamentKey; tournament_name: string; roster_points: number }[],
  tournamentKeysOrder: readonly TournamentKey[],
): { label: string; cumulative_points: number }[] {
  let cum = 0;
  const out: { label: string; cumulative_points: number }[] = [];
  for (const k of tournamentKeysOrder) {
    const chunk = byDivision.filter((d) => d.tournament_key === k);
    const add = chunk.reduce((s, d) => s + d.roster_points, 0);
    cum = Math.round((cum + add) * 100) / 100;
    if (chunk.length === 0) continue;
    const name = chunk[0]?.tournament_name ?? k;
    out.push({ label: name, cumulative_points: cum });
  }
  if (out.length === 0) {
    out.push({ label: "Season", cumulative_points: 0 });
  }
  return out;
}

export function computeFantasyLeaderboard(
  allRosters: FantasyRosterDbRow[],
  tournamentDataByKey: Record<TournamentKey, WinterData | null | undefined>,
): { user_id: string; display_name: string; points: number; rank: number }[] {
  const map = new Map<string, { display_name: string; points: number }>();
  for (const r of allRosters) {
    const parsedStored = parseStoredDivisionKey(r.divisionKey);
    if (!parsedStored) continue;
    const data = tournamentDataByKey[parsedStored.tournament_key];
    if (!data?.matches) continue;
    if (!isDivisionFeaturedFromMatches(data.matches, parsedStored.division_key)) continue;
    const pts =
      Math.round(
        fantasyRosterTotalPoints(
          data.matches,
          parsedStored.division_key,
          r.picks.map((p) => ({ playerName: p.playerName, isCaptain: p.isCaptain })),
        ) * 100,
      ) / 100;
    const cur = map.get(r.userId) ?? { display_name: r.user.displayName, points: 0 };
    cur.points = Math.round((cur.points + pts) * 100) / 100;
    map.set(r.userId, cur);
  }

  const sorted = [...map.entries()].sort((a, b) => {
    const dp = b[1].points - a[1].points;
    if (dp !== 0) return dp;
    return a[1].display_name.localeCompare(b[1].display_name);
  });

  let rank = 0;
  const rows: { user_id: string; display_name: string; points: number; rank: number }[] = [];
  for (let i = 0; i < sorted.length; i++) {
    const [user_id, v] = sorted[i]!;
    if (i === 0 || v.points < sorted[i - 1]![1].points) rank = i + 1;
    rows.push({ user_id, display_name: v.display_name, points: v.points, rank });
  }
  return rows;
}

export function pickRowStatus(
  playerName: string,
  divMatches: WinterJsonMatch[],
): "alive" | "waiting" {
  const started = divMatches.some((m) => winterJsonMatchHasWinner(m));
  const rawTotal = scoreWinterPlayerFromMatches(playerName, divMatches).total;
  if (rawTotal > 0) return "alive";
  if (started) return "waiting";
  return "alive";
}

export function rosterPointsOnLine(playerRawPoints: number, isCaptain: boolean): number {
  const mult = isCaptain ? 1.5 : 1;
  return Math.round(playerRawPoints * mult * 100) / 100;
}

export type PulsePickRow = {
  label: string;
  player_name: string;
  points_on_roster: number;
  is_captain: boolean;
  status: "alive" | "waiting";
};

export function buildPickRows(
  winterFantasyRosters: {
    tournament_key: TournamentKey;
    tournament_name: string;
    division_key: string;
    event_type: string;
    skill_level: string;
    picks: { player_name: string; is_captain: boolean }[];
  }[],
  tournamentDataByKey: Record<TournamentKey, WinterData | null | undefined>,
): PulsePickRow[] {
  return winterFantasyRosters.flatMap((roster) => {
    const data = tournamentDataByKey[roster.tournament_key];
    const divMatches = filterMatchesForDivision(data?.matches ?? [], roster.division_key) as WinterJsonMatch[];
    return roster.picks.map((p) => {
      const raw = scoreWinterPlayerFromMatches(p.player_name, divMatches).total;
      return {
        label: `${roster.tournament_name} · ${roster.event_type} / ${roster.skill_level}`,
        player_name: p.player_name,
        points_on_roster: rosterPointsOnLine(raw, p.is_captain),
        is_captain: p.is_captain,
        status: pickRowStatus(p.player_name, divMatches),
      };
    });
  });
}
