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
  const sign = pts > 0 ? "+" : "";
  if (label === "Match win") return `✅ Match win ${sign}${pts}`;
  if (label === "Forfeit win") return `🏁 Forfeit win ${sign}${pts}`;
  if (label === "Gold medal") return `🏆 Gold medal ${sign}${pts}`;
  if (label === "Silver medal") return `🥈 Silver medal ${sign}${pts}`;
  if (label === "Bronze medal") return `🥉 Bronze medal ${sign}${pts}`;
  if (label === "Upset win") return `🔥 Upset win ${sign}${pts}`;
  if (label === "Playoff qualification") return `⚡ Playoff berth ${sign}${pts}`;
  if (label === "Quarterfinal win") return `⚡ Quarterfinal ${sign}${pts}`;
  if (label === "Semifinal win") return `⚡ Semifinal ${sign}${pts}`;
  if (label === "Final win") return `👑 Final win ${sign}${pts}`;
  if (label === "Undefeated pool") return `💥 Undefeated pool ${sign}${pts}`;
  if (label === "Win margin (8+)") return `📈 Big margin ${sign}${pts}`;
  if (label === "Win margin (5–7)") return `📈 Solid margin ${sign}${pts}`;
  if (label === "Shutout (11–0)") return `🧱 Shutout ${sign}${pts}`;
  if (label === "Comeback win") return `🎯 Comeback ${sign}${pts}`;
  if (label === "Beat top-3 seed") return `🎯 Top-3 takedown ${sign}${pts}`;
  if (label === "Low-owned pick bonus") return `🃏 Low-owned ${sign}${pts}`;
  if (label === "3-match win streak") return `🔥 3-win streak ${sign}${pts}`;
  if (label === "5-match win streak") return `🔥🔥 5-win streak ${sign}${pts}`;
  if (label === "Triple play (same day)") return `🎰 Triple play ${sign}${pts}`;
  if (label === "Perfect tournament (division)") return `✨ Perfect run ${sign}${pts}`;
  return `✨ ${label} ${sign}${pts}`;
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
          if (b.points <= 0) continue;
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
