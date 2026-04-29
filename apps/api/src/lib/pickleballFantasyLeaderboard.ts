import { WINTER_FANTASY_ROSTER_SIZE } from "@wakibet/shared";
import { prisma } from "./prisma.js";
import { isMlpTournament } from "./mlpTournamentData.js";
import { computeFantasyLeaderboard, type FantasyRosterDbRow } from "./fantasyPulse.js";
import {
  getTournamentData,
  parseStoredDivisionKey,
  toStoredDivisionKey,
  TOURNAMENT_KEYS,
  type TournamentKey,
} from "../sports/pickleball/lib/index.js";

export type PickleballFantasyLeaderboardRow = {
  user_id: string;
  display_name: string;
  points: number;
  rank: number;
};

type TournamentDataByKey = Record<TournamentKey, Awaited<ReturnType<typeof getTournamentData>>>;

/** Build season leaderboard rows from data already loaded for the dashboard (no extra DB round-trip). */
export function rankPickleballFantasyFromLoaded(args: {
  allFantasyRows: {
    userId: string;
    divisionKey: string;
    user: { displayName: string };
    picks: { slotIndex: number; playerName: string; isCaptain: boolean }[];
  }[];
  allFantasyTourneys: {
    userId: string;
    tournamentKey: string;
    user: { displayName: string };
    eventPicks: {
      eventKey: string;
      scheduleDivisionKey: string;
      mlpTeamName: string | null;
      slots: { slotIndex: number; playerName: string; isCaptain: boolean }[];
    }[];
  }[];
  catalogAll: { eventKey: string; wakipointsMultiplier: unknown }[];
  tournamentDataByKey: TournamentDataByKey;
}): PickleballFantasyLeaderboardRow[] {
  const catMap = new Map(args.catalogAll.map((c) => [c.eventKey, c]));

  const winterRowsForLeaderboard = args.allFantasyRows.filter((r) => {
    const p = parseStoredDivisionKey(r.divisionKey);
    if (!p) return false;
    return !args.allFantasyTourneys.some((l) => l.userId === r.userId && l.tournamentKey === p.tournament_key);
  });

  const tourneyRowsForLeaderboard: FantasyRosterDbRow[] = args.allFantasyTourneys.flatMap((L) =>
    L.eventPicks
      .filter((ep) => catMap.has(ep.eventKey))
      .filter((ep) => {
        const need = isMlpTournament(L.tournamentKey) ? 4 : WINTER_FANTASY_ROSTER_SIZE;
        return ep.slots.length === need;
      })
      .map((ep) => {
        const tk = L.tournamentKey as TournamentKey;
        const cat = catMap.get(ep.eventKey);
        return {
          userId: L.userId,
          divisionKey: toStoredDivisionKey(tk, ep.scheduleDivisionKey),
          user: L.user,
          picks: ep.slots.map((s) => ({
            slotIndex: s.slotIndex,
            playerName: s.playerName,
            isCaptain: s.isCaptain,
          })),
          wakipointsMultiplier: Number(cat?.wakipointsMultiplier ?? 1),
          mlpTeamName: ep.mlpTeamName ?? null,
        };
      }),
  );

  return computeFantasyLeaderboard(
    [...winterRowsForLeaderboard, ...tourneyRowsForLeaderboard] as FantasyRosterDbRow[],
    args.tournamentDataByKey,
  );
}

const lbCache = new Map<string, { at: number; data: PickleballFantasyLeaderboardRow[] }>();
const LB_CACHE_MS = 4000;
let lbInFlight: Promise<PickleballFantasyLeaderboardRow[]> | null = null;

/** Cached full leaderboard for API routes (global, not per-user). */
export async function getCachedPickleballFantasyLeaderboard(): Promise<PickleballFantasyLeaderboardRow[]> {
  const key = "pickleball-fantasy-lb";
  const now = Date.now();
  const hit = lbCache.get(key);
  if (hit && now - hit.at < LB_CACHE_MS) return hit.data;
  if (lbInFlight) return lbInFlight;

  lbInFlight = (async () => {
    const tournamentDataEntries = await Promise.all(
      TOURNAMENT_KEYS.map(async (k) => [k, await getTournamentData(k)] as const),
    );
    const tournamentDataByKey = Object.fromEntries(tournamentDataEntries) as TournamentDataByKey;

    const [allFantasyRows, allFantasyTourneys, catalogAll] = await Promise.all([
      prisma.winterFantasyRoster.findMany({
        include: {
          picks: { orderBy: { slotIndex: "asc" } },
          user: { select: { displayName: true } },
        },
      }),
      prisma.fantasyTournamentLineup.findMany({
        where: {
          seasonKey: "",
          tournamentKey: { in: [...TOURNAMENT_KEYS] },
        },
        include: {
          user: { select: { displayName: true } },
          eventPicks: { include: { slots: { orderBy: { slotIndex: "asc" } } } },
        },
      }),
      prisma.tournamentEventCatalog.findMany(),
    ]);

    const data = rankPickleballFantasyFromLoaded({
      allFantasyRows,
      allFantasyTourneys,
      catalogAll,
      tournamentDataByKey,
    });
    lbCache.set(key, { at: Date.now(), data });
    return data;
  })().finally(() => {
    lbInFlight = null;
  });

  return lbInFlight;
}
