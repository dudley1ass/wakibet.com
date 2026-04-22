import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { prisma } from "../lib/prisma.js";
import { verifyAccessToken } from "../lib/jwt.js";
import {
  buildFantasyProgressStops,
  buildFantasyRecentHits,
  buildPickRows,
  computeFantasyLeaderboard,
  type FantasyRosterDbRow,
} from "../lib/fantasyPulse.js";
import { buildWhatIfScenarios } from "../lib/fantasyScenarios.js";
import { fantasyRosterTotalPoints } from "../lib/winterFantasyRosterScore.js";
import {
  getTournamentData,
  isDivisionFeaturedFromMatches,
  listTournamentOptions,
  parseStoredDivisionKey,
  parseDivisionKey,
  TOURNAMENT_KEYS,
} from "../lib/winterSpringsData.js";

const SEASON_TOURNAMENTS_PLANNED = TOURNAMENT_KEYS.length;

const FantasyRosterPick = z.object({
  slot_index: z.number().int(),
  player_name: z.string(),
  is_captain: z.boolean(),
});

const DashboardResponse = z.object({
  profile: z.object({
    display_name: z.string(),
    email: z.string(),
    state: z.string().nullable(),
    country: z.string(),
    joined_at: z.string(),
  }),
  open_contests: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      entry_fee_dills: z.number(),
      status: z.string(),
    }),
  ),
  tournament_schedules: z.array(
    z.object({
      tournament_key: z.enum(TOURNAMENT_KEYS),
      tournament_name: z.string(),
      generated_matches: z.number().int(),
      my_upcoming_matches: z.array(
        z.object({
          match_id: z.string(),
          event_type: z.string(),
          skill_level: z.string(),
          age_bracket: z.string(),
          event_date: z.string(),
          opponent: z.string(),
        }),
      ),
      featured_matches: z.array(
        z.object({
          match_id: z.string(),
          event_type: z.string(),
          event_date: z.string(),
          player_a: z.string(),
          player_b: z.string(),
        }),
      ),
    }),
  ),
  winter_fantasy_rosters: z.array(
    z.object({
      tournament_key: z.enum(TOURNAMENT_KEYS),
      tournament_name: z.string(),
      division_key: z.string(),
      event_type: z.string(),
      skill_level: z.string(),
      age_bracket: z.string(),
      picks: z.array(FantasyRosterPick),
    }),
  ),
  fantasy_season: z.object({
    tournaments_planned: z.number().int(),
    tournaments_with_schedule: z.number().int(),
    total_fantasy_points: z.number(),
    by_division: z.array(
      z.object({
        tournament_key: z.enum(TOURNAMENT_KEYS),
        tournament_name: z.string(),
        division_key: z.string(),
        event_type: z.string(),
        skill_level: z.string(),
        age_bracket: z.string(),
        roster_points: z.number(),
      }),
    ),
    note: z.string(),
  }),
  fantasy_pulse: z.object({
    my_rank: z.number().nullable(),
    rank_players_count: z.number().int(),
    rank_change: z.number().nullable(),
    pick_rows: z.array(
      z.object({
        label: z.string(),
        player_name: z.string(),
        points_on_roster: z.number(),
        is_captain: z.boolean(),
        status: z.enum(["alive", "waiting"]),
      }),
    ),
    recent_hits: z.array(
      z.object({
        headline: z.string(),
        points: z.number(),
        occurred_at: z.string(),
      }),
    ),
    progress: z.array(
      z.object({
        label: z.string(),
        cumulative_points: z.number(),
      }),
    ),
    leaderboard: z.array(
      z.object({
        rank: z.number(),
        display_name: z.string(),
        points: z.number(),
        is_me: z.boolean(),
      }),
    ),
  }),
  fantasy_what_if: z.array(
    z.object({
      scenario_key: z.string(),
      kind: z.enum(["win_next", "lose_next"]),
      player_name: z.string(),
      tournament_key: z.enum(TOURNAMENT_KEYS),
      tournament_name: z.string(),
      division_label: z.string(),
      match_summary: z.string(),
      opponent: z.string(),
      event_date: z.string(),
      roster_waki_delta: z.number(),
      season_waki_delta: z.number(),
      rank_before: z.number().nullable(),
      rank_after: z.number().nullable(),
      impact: z.enum(["high", "standard", "risk"]),
    }),
  ),
});

const ErrorMessage = z.object({ message: z.string() });

export const usersRoutes: FastifyPluginAsync = async (app) => {
  const typed = app.withTypeProvider<ZodTypeProvider>();

  typed.get(
    "/api/v1/users/me/dashboard",
    {
      schema: {
        tags: ["users"],
        response: { 200: DashboardResponse, 401: ErrorMessage },
      },
    },
    async (req, reply) => {
      const hdr = req.headers.authorization;
      if (!hdr?.startsWith("Bearer ")) {
        return reply.code(401).send({ message: "Missing bearer token." } as const);
      }
      let payload: { sub: string };
      try {
        payload = verifyAccessToken(hdr.slice(7));
      } catch {
        return reply.code(401).send({ message: "Invalid or expired token." } as const);
      }
      const user = await prisma.user.findUnique({ where: { id: payload.sub } });
      if (!user || user.isBanned) {
        return reply.code(401).send({ message: "Invalid or expired token." } as const);
      }
      const tournamentDataEntries = await Promise.all(
        TOURNAMENT_KEYS.map(async (k) => [k, await getTournamentData(k)] as const),
      );
      const tournamentDataByKey = Object.fromEntries(tournamentDataEntries) as Record<
        (typeof TOURNAMENT_KEYS)[number],
        Awaited<ReturnType<typeof getTournamentData>>
      >;
      const [fantasyRows, allFantasyRows] = await Promise.all([
        prisma.winterFantasyRoster.findMany({
          where: { userId: payload.sub },
          include: { picks: { orderBy: { slotIndex: "asc" } } },
          orderBy: { updatedAt: "desc" },
        }),
        prisma.winterFantasyRoster.findMany({
          include: {
            picks: { orderBy: { slotIndex: "asc" } },
            user: { select: { displayName: true } },
          },
        }),
      ]);
      const featuredRows = fantasyRows.filter((r) => {
        const parsedStored = parseStoredDivisionKey(r.divisionKey);
        if (!parsedStored) return false;
        const data = tournamentDataByKey[parsedStored.tournament_key];
        if (!data) return false;
        return isDivisionFeaturedFromMatches(data.matches, parsedStored.division_key);
      });
      const winter_fantasy_rosters = featuredRows.map((r) => {
        const parsedStored = parseStoredDivisionKey(r.divisionKey);
        if (!parsedStored) return null;
        const parsed = parseDivisionKey(parsedStored.division_key);
        const tournamentData = tournamentDataByKey[parsedStored.tournament_key];
        return {
          tournament_key: parsedStored.tournament_key,
          tournament_name: tournamentData?.summary.tournament_name ?? parsedStored.tournament_key,
          division_key: parsedStored.division_key,
          event_type: parsed?.event_type ?? "",
          skill_level: parsed?.skill_level ?? "",
          age_bracket: parsed?.age_bracket ?? "",
          picks: r.picks.map((p) => ({
            slot_index: p.slotIndex,
            player_name: p.playerName,
            is_captain: p.isCaptain,
          })),
        };
      }).filter((row): row is NonNullable<typeof row> => Boolean(row));

      const by_division = winter_fantasy_rosters.map((roster) => ({
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
      }));
      const total_fantasy_points =
        Math.round(by_division.reduce((s, d) => s + d.roster_points, 0) * 100) / 100;
      const tournamentsWithSchedule = TOURNAMENT_KEYS.filter((k) => Boolean(tournamentDataByKey[k])).length;
      const tournamentOptions = listTournamentOptions();
      const tournament_schedules = TOURNAMENT_KEYS.map((k) => {
        const data = tournamentDataByKey[k];
        return {
          tournament_key: k,
          tournament_name: data?.summary.tournament_name ?? tournamentOptions.find((t) => t.tournament_key === k)?.label ?? k,
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
        by_division,
        note:
          "WakiPoints v3 rolls up across loaded tournament schedules. Engine uses winners, optional scores/seeds/stage text, medals, upset flags, and streak / division meta when data supports them.",
      };

      const leaderboardRanked = computeFantasyLeaderboard(
        allFantasyRows as FantasyRosterDbRow[],
        tournamentDataByKey,
      );
      const rank_players_count = leaderboardRanked.length;
      const myLb = leaderboardRanked.find((r) => r.user_id === payload.sub);
      const my_rank = myLb?.rank ?? null;

      const leaderboard = leaderboardRanked.slice(0, 12).map((r) => ({
        rank: r.rank,
        display_name: r.display_name,
        points: r.points,
        is_me: r.user_id === payload.sub,
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
        payload.sub,
        user.displayName,
        total_fantasy_points,
        winter_fantasy_rosters,
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
    },
  );
};
