import { playerWakiCashCost, WAKICASH_BUDGET_PER_LINEUP, WINTER_FANTASY_ROSTER_SIZE } from "@wakibet/shared";
import { prisma } from "./prisma.js";
import {
  buildFantasyProgressStops,
  buildFantasyRecentHits,
  buildPickRows,
  computeFantasyLeaderboard,
  type FantasyRosterDbRow,
  buildWhatIfScenarios,
  fantasyRosterTotalPoints,
  filterMatchesForDivision,
  FANTASY_SEASON_V1,
  getTournamentData,
  isDivisionFeaturedFromMatches,
  listTournamentOptions,
  parseStoredDivisionKey,
  parseDivisionKey,
  toStoredDivisionKey,
  TOURNAMENT_KEYS,
  type TournamentKey,
} from "../sports/pickleball/lib/index.js";
import type { AuthUser } from "./requireAuthUser.js";

const SEASON_TOURNAMENTS_PLANNED = TOURNAMENT_KEYS.length;

export type DashboardFullPayload = {
  profile: {
    display_name: string;
    email: string;
    state: string | null;
    country: string;
    joined_at: string;
  };
  open_contests: {
    id: string;
    name: string;
    entry_fee_dills: number;
    status: string;
  }[];
  tournament_schedules: {
    tournament_key: (typeof TOURNAMENT_KEYS)[number];
    tournament_name: string;
    generated_matches: number;
    my_upcoming_matches: {
      match_id: string;
      event_type: string;
      skill_level: string;
      age_bracket: string;
      event_date: string;
      opponent: string;
    }[];
    featured_matches: {
      match_id: string;
      event_type: string;
      event_date: string;
      player_a: string;
      player_b: string;
    }[];
  }[];
  winter_fantasy_rosters: {
    tournament_key: TournamentKey;
    tournament_name: string;
    division_key: string;
    event_type: string;
    skill_level: string;
    age_bracket: string;
    waki_cash_spent: number;
    waki_cash_budget: number;
    waki_lineup_complete: boolean;
    picks: { slot_index: number; player_name: string; is_captain: boolean; waki_cash: number }[];
  }[];
  fantasy_season: {
    tournaments_planned: number;
    tournaments_with_schedule: number;
    total_fantasy_points: number;
    waki_cash_spent_total: number;
    waki_cash_budget_total: number;
    by_division: {
      tournament_key: TournamentKey;
      tournament_name: string;
      division_key: string;
      event_type: string;
      skill_level: string;
      age_bracket: string;
      roster_points: number;
    }[];
    note: string;
  };
  fantasy_pulse: {
    my_rank: number | null;
    rank_players_count: number;
    rank_change: number | null;
    pick_rows: {
      label: string;
      player_name: string;
      points_on_roster: number;
      is_captain: boolean;
      status: "alive" | "waiting";
    }[];
    recent_hits: { headline: string; points: number; occurred_at: string }[];
    progress: { label: string; cumulative_points: number }[];
    leaderboard: { rank: number; display_name: string; points: number; is_me: boolean }[];
  };
  fantasy_what_if: {
    scenario_key: string;
    kind: "win_next" | "lose_next";
    player_name: string;
    tournament_key: TournamentKey;
    tournament_name: string;
    division_label: string;
    match_summary: string;
    opponent: string;
    event_date: string;
    roster_waki_delta: number;
    scenario_player_delta: number;
    season_waki_delta: number;
    rank_before: number | null;
    rank_after: number | null;
    impact: "high" | "standard" | "risk";
  }[];
};

const cache = new Map<string, { at: number; data: DashboardFullPayload }>();
const CACHE_MS = 4000;
const inFlight = new Map<string, Promise<DashboardFullPayload>>();

async function computeDashboardFull(user: AuthUser): Promise<DashboardFullPayload> {
  const userId = user.id;
  const tournamentDataEntries = await Promise.all(
    TOURNAMENT_KEYS.map(async (k) => [k, await getTournamentData(k)] as const),
  );
  const tournamentDataByKey = Object.fromEntries(tournamentDataEntries) as Record<
    (typeof TOURNAMENT_KEYS)[number],
    Awaited<ReturnType<typeof getTournamentData>>
  >;

  const [fantasyRows, allFantasyRows, myFantasyTourneys, allFantasyTourneys, catalogAll] = await Promise.all([
    prisma.winterFantasyRoster.findMany({
      where: { userId },
      include: { picks: { orderBy: { slotIndex: "asc" } } },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.winterFantasyRoster.findMany({
      include: {
        picks: { orderBy: { slotIndex: "asc" } },
        user: { select: { displayName: true } },
      },
    }),
    prisma.fantasyTournamentLineup.findMany({
      where: {
        userId,
        seasonKey: "",
        tournamentKey: { in: [...TOURNAMENT_KEYS] },
      },
      include: {
        eventPicks: { include: { slots: { orderBy: { slotIndex: "asc" } } } },
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
  const catMap = new Map(catalogAll.map((c) => [c.eventKey, c]));
  const myTourneyTournamentKeys = new Set(
    myFantasyTourneys.filter((l) => l.eventPicks.length > 0).map((l) => l.tournamentKey),
  );

  const featuredRows = fantasyRows.filter((r) => {
    const parsedStored = parseStoredDivisionKey(r.divisionKey);
    if (!parsedStored) return false;
    if (myTourneyTournamentKeys.has(parsedStored.tournament_key)) return false;
    const data = tournamentDataByKey[parsedStored.tournament_key];
    if (!data || !data.matches?.length) return true;
    const ms = filterMatchesForDivision(data.matches, parsedStored.division_key);
    if (ms.length === 0) return true;
    return isDivisionFeaturedFromMatches(data.matches, parsedStored.division_key);
  });
  const winter_fantasy_rosters_from_winter = featuredRows
    .map((r) => {
      const parsedStored = parseStoredDivisionKey(r.divisionKey);
      if (!parsedStored) return null;
      const parsed = parseDivisionKey(parsedStored.division_key);
      const tournamentData = tournamentDataByKey[parsedStored.tournament_key];
      const skill = parsed?.skill_level ?? "";
      const picks = r.picks.map((p) => ({
        slot_index: p.slotIndex,
        player_name: p.playerName,
        is_captain: p.isCaptain,
        waki_cash: playerWakiCashCost(skill, p.playerName),
      }));
      const waki_cash_spent = picks.reduce((s, p) => s + p.waki_cash, 0);
      const waki_lineup_complete = r.picks.length === WINTER_FANTASY_ROSTER_SIZE;
      return {
        tournament_key: parsedStored.tournament_key,
        tournament_name: tournamentData?.summary.tournament_name ?? parsedStored.tournament_key,
        division_key: parsedStored.division_key,
        event_type: parsed?.event_type ?? "",
        skill_level: skill,
        age_bracket: parsed?.age_bracket ?? "",
        waki_cash_spent,
        waki_cash_budget: WAKICASH_BUDGET_PER_LINEUP,
        waki_lineup_complete,
        picks,
      };
    })
    .filter((row): row is NonNullable<typeof row> => Boolean(row));

  const winter_fantasy_rosters_from_tourney = myFantasyTourneys.flatMap((lineup) => {
    const tk = lineup.tournamentKey as TournamentKey;
    const tournamentData = tournamentDataByKey[tk];
    return lineup.eventPicks.map((ep) => {
      const parsed = parseDivisionKey(ep.scheduleDivisionKey);
      const cat = catMap.get(ep.eventKey);
      const skill = parsed?.skill_level ?? cat?.skillLevel ?? "";
      const wakiMult = Number(cat?.wakicashMultiplier ?? 1);
      const wpsMult = Number(cat?.wakipointsMultiplier ?? 1);
      const picks = ep.slots.map((p) => ({
        slot_index: p.slotIndex,
        player_name: p.playerName,
        is_captain: p.isCaptain,
        waki_cash: Math.ceil(playerWakiCashCost(skill, p.playerName) * wakiMult),
      }));
      const waki_cash_spent = picks.reduce((s, p) => s + p.waki_cash, 0);
      return {
        tournament_key: tk,
        tournament_name: tournamentData?.summary.tournament_name ?? tk,
        division_key: ep.scheduleDivisionKey,
        event_type: parsed?.event_type ?? "",
        skill_level: skill,
        age_bracket: parsed?.age_bracket ?? "",
        waki_cash_spent,
        waki_cash_budget: lineup.wakicashBudget,
        waki_lineup_complete: ep.slots.length === WINTER_FANTASY_ROSTER_SIZE,
        picks,
        wakipoints_multiplier: wpsMult,
      };
    });
  });

  const winter_fantasy_rosters = [
    ...winter_fantasy_rosters_from_winter,
    ...winter_fantasy_rosters_from_tourney.map(
      ({ wakipoints_multiplier: _m, ...rest }) => rest as (typeof winter_fantasy_rosters_from_winter)[number],
    ),
  ];

  const by_division = [
    ...winter_fantasy_rosters_from_winter.map((roster) => ({
      tournament_key: roster.tournament_key,
      tournament_name: roster.tournament_name,
      division_key: roster.division_key,
      event_type: roster.event_type,
      skill_level: roster.skill_level,
      age_bracket: roster.age_bracket,
      roster_points: tournamentDataByKey[roster.tournament_key]
        ? Math.round(
            fantasyRosterTotalPoints(
              tournamentDataByKey[roster.tournament_key]?.matches ?? [],
              roster.division_key,
              roster.picks.map((p) => ({
                playerName: p.player_name,
                isCaptain: p.is_captain,
              })),
            ) * 100,
          ) / 100
        : 0,
    })),
    ...winter_fantasy_rosters_from_tourney.map((roster) => ({
      tournament_key: roster.tournament_key,
      tournament_name: roster.tournament_name,
      division_key: roster.division_key,
      event_type: roster.event_type,
      skill_level: roster.skill_level,
      age_bracket: roster.age_bracket,
      roster_points: tournamentDataByKey[roster.tournament_key]
        ? Math.round(
            fantasyRosterTotalPoints(
              tournamentDataByKey[roster.tournament_key]?.matches ?? [],
              roster.division_key,
              roster.picks.map((p) => ({
                playerName: p.player_name,
                isCaptain: p.is_captain,
              })),
            ) *
              roster.wakipoints_multiplier *
              100,
          ) / 100
        : 0,
    })),
  ];
  const total_fantasy_points = Math.round(by_division.reduce((s, d) => s + d.roster_points, 0) * 100) / 100;
  const waki_cash_spent_total =
    winter_fantasy_rosters_from_winter.reduce((s, r) => s + r.waki_cash_spent, 0) +
    myFantasyTourneys.reduce((s, l) => s + l.wakicashSpent, 0);
  const waki_cash_budget_total =
    winter_fantasy_rosters_from_winter.filter((r) => r.waki_lineup_complete).length * WAKICASH_BUDGET_PER_LINEUP +
    myFantasyTourneys.length * WAKICASH_BUDGET_PER_LINEUP;
  const tournamentsWithSchedule = TOURNAMENT_KEYS.filter((k) => Boolean(tournamentDataByKey[k])).length;
  const tournamentOptions = listTournamentOptions();
  const tournament_schedules = TOURNAMENT_KEYS.map((k) => {
    const data = tournamentDataByKey[k];
    return {
      tournament_key: k,
      tournament_name:
        data?.summary.tournament_name ?? tournamentOptions.find((t) => t.tournament_key === k)?.label ?? k,
      generated_matches: data?.summary.matches_generated ?? 0,
      my_upcoming_matches:
        data?.per_player_matches[user.displayName]?.slice(0, 8).map((m) => ({
          match_id: m.match_id,
          event_type: m.event_type,
          skill_level: m.skill_level,
          age_bracket: m.age_bracket,
          event_date: m.event_date,
          opponent: m.opponent,
        })) ?? [],
      featured_matches:
        data?.matches.slice(0, 8).map((m) => ({
          match_id: m.match_id,
          event_type: m.event_type,
          event_date: m.event_date,
          player_a: m.player_a,
          player_b: m.player_b,
        })) ?? [],
    };
  });
  const fantasy_season = {
    tournaments_planned: SEASON_TOURNAMENTS_PLANNED,
    tournaments_with_schedule: tournamentsWithSchedule,
    total_fantasy_points,
    waki_cash_spent_total,
    waki_cash_budget_total,
    by_division,
    note:
      `WakiPoints v3 rolls up across loaded tournament schedules. Multi-event tournament lineups (when saved) replace legacy winter rosters for that tournament on this dashboard; tier A/B/C adjusts WakiCash and WakiPoints per event. Captain 1.5× per event. ${FANTASY_SEASON_V1.tieBreakerNote}`,
  };

  const winterRowsForLeaderboard = allFantasyRows.filter((r) => {
    const p = parseStoredDivisionKey(r.divisionKey);
    if (!p) return false;
    return !allFantasyTourneys.some((l) => l.userId === r.userId && l.tournamentKey === p.tournament_key);
  });
  const tourneyRowsForLeaderboard: FantasyRosterDbRow[] = allFantasyTourneys.flatMap((L) =>
    L.eventPicks
      .filter((ep) => ep.slots.length === WINTER_FANTASY_ROSTER_SIZE)
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
        };
      }),
  );

  const leaderboardRanked = computeFantasyLeaderboard(
    [...winterRowsForLeaderboard, ...tourneyRowsForLeaderboard] as FantasyRosterDbRow[],
    tournamentDataByKey,
  );
  const rank_players_count = leaderboardRanked.length;
  const myLb = leaderboardRanked.find((r) => r.user_id === userId);
  const my_rank = myLb?.rank ?? null;

  const leaderboard = leaderboardRanked.slice(0, 12).map((r) => ({
    rank: r.rank,
    display_name: r.display_name,
    points: r.points,
    is_me: r.user_id === userId,
  }));

  const pick_rows = buildPickRows(winter_fantasy_rosters, tournamentDataByKey);

  const recent_hits = buildFantasyRecentHits(
    winter_fantasy_rosters.map((r) => ({
      tournament_key: r.tournament_key,
      division_key: r.division_key,
      picks: r.picks.map((p) => ({ player_name: p.player_name })),
    })),
    tournamentDataByKey,
    8,
  );

  const progress = buildFantasyProgressStops(by_division, TOURNAMENT_KEYS);

  const fantasy_pulse = {
    my_rank,
    rank_players_count,
    rank_change: null as number | null,
    pick_rows,
    recent_hits,
    progress,
    leaderboard,
  };

  const fantasy_what_if = buildWhatIfScenarios(
    userId,
    user.displayName,
    total_fantasy_points,
    [
      ...winter_fantasy_rosters_from_winter,
      ...winter_fantasy_rosters_from_tourney.map(({ picks, wakipoints_multiplier, ...r }) => ({
        ...r,
        picks,
        wakipoints_multiplier,
      })),
    ],
    tournamentDataByKey,
    leaderboardRanked,
    5,
  );

  return {
    profile: {
      display_name: user.displayName,
      email: user.email,
      state: user.region,
      country: user.country,
      joined_at: user.createdAt.toISOString(),
    },
    open_contests: listTournamentOptions()
      .filter((t) => Boolean(tournamentDataByKey[t.tournament_key]))
      .map((t) => ({
        id: `${t.tournament_key}-2026`,
        name: tournamentDataByKey[t.tournament_key]?.summary.tournament_name ?? t.label,
        entry_fee_dills: 500,
        status: "UPCOMING",
      })),
    tournament_schedules,
    winter_fantasy_rosters,
    fantasy_season,
    fantasy_pulse,
    fantasy_what_if,
  };
}

/** Single compute + short TTL so parallel dashboard fetches share one DB round-trip. */
export async function getCachedDashboardFull(user: AuthUser): Promise<DashboardFullPayload> {
  const now = Date.now();
  const hit = cache.get(user.id);
  if (hit && now - hit.at < CACHE_MS) return hit.data;

  let p = inFlight.get(user.id);
  if (p) return p;

  p = computeDashboardFull(user)
    .then((data) => {
      cache.set(user.id, { at: Date.now(), data });
      inFlight.delete(user.id);
      return data;
    })
    .catch((err) => {
      inFlight.delete(user.id);
      throw err;
    });
  inFlight.set(user.id, p);
  return p;
}
