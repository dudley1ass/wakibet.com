import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { getCachedDashboardFull } from "../lib/dashboardMaterialize.js";
import { requireAuthUser } from "../lib/requireAuthUser.js";
import {
  TOURNAMENT_KEYS,
} from "../lib/winterSpringsData.js";

const FantasyRosterPick = z.object({
  slot_index: z.number().int(),
  player_name: z.string(),
  is_captain: z.boolean(),
  waki_cash: z.number().int(),
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
      waki_cash_spent: z.number().int(),
      waki_cash_budget: z.number().int(),
      waki_lineup_complete: z.boolean(),
      picks: z.array(FantasyRosterPick),
    }),
  ),
  fantasy_season: z.object({
    tournaments_planned: z.number().int(),
    tournaments_with_schedule: z.number().int(),
    total_fantasy_points: z.number(),
    waki_cash_spent_total: z.number().int(),
    waki_cash_budget_total: z.number().int(),
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
      scenario_player_delta: z.number(),
      season_waki_delta: z.number(),
      rank_before: z.number().nullable(),
      rank_after: z.number().nullable(),
      impact: z.enum(["high", "standard", "risk"]),
    }),
  ),
});

const DashboardSummaryResponse = DashboardResponse.pick({
  profile: true,
  open_contests: true,
  tournament_schedules: true,
});

const DashboardRostersResponse = DashboardResponse.pick({
  winter_fantasy_rosters: true,
  fantasy_season: true,
});

const DashboardInsightsResponse = DashboardResponse.pick({
  fantasy_pulse: true,
  fantasy_what_if: true,
});

const ErrorMessage = z.object({ message: z.string() });

const authPre = { preHandler: [requireAuthUser] };

export const usersRoutes: FastifyPluginAsync = async (app) => {
  const typed = app.withTypeProvider<ZodTypeProvider>();

  typed.get(
    "/api/v1/users/me/dashboard/summary",
    {
      ...authPre,
      schema: {
        tags: ["users"],
        response: { 200: DashboardSummaryResponse, 401: ErrorMessage },
      },
    },
    async (req) => {
      const full = await getCachedDashboardFull(req.authUser!);
      return {
        profile: full.profile,
        open_contests: full.open_contests,
        tournament_schedules: full.tournament_schedules,
      };
    },
  );

  typed.get(
    "/api/v1/users/me/dashboard/rosters",
    {
      ...authPre,
      schema: {
        tags: ["users"],
        response: { 200: DashboardRostersResponse, 401: ErrorMessage },
      },
    },
    async (req) => {
      const full = await getCachedDashboardFull(req.authUser!);
      return {
        winter_fantasy_rosters: full.winter_fantasy_rosters,
        fantasy_season: full.fantasy_season,
      };
    },
  );

  typed.get(
    "/api/v1/users/me/dashboard/insights",
    {
      ...authPre,
      schema: {
        tags: ["users"],
        response: { 200: DashboardInsightsResponse, 401: ErrorMessage },
      },
    },
    async (req) => {
      const full = await getCachedDashboardFull(req.authUser!);
      return {
        fantasy_pulse: full.fantasy_pulse,
        fantasy_what_if: full.fantasy_what_if,
      };
    },
  );

  typed.get(
    "/api/v1/users/me/dashboard",
    {
      ...authPre,
      schema: {
        tags: ["users"],
        description:
          "Full dashboard payload (legacy). Prefer /summary, /rosters, and /insights for parallel fetches.",
        response: { 200: DashboardResponse, 401: ErrorMessage },
      },
    },
    async (req) => {
      return getCachedDashboardFull(req.authUser!);
    },
  );
};
