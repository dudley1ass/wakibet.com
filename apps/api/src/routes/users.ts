import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from "fastify";
import bcrypt from "bcryptjs";
import { z } from "zod";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { getCachedDashboardFull } from "../lib/dashboardMaterialize.js";
import { requireAuthUser } from "../lib/requireAuthUser.js";
import { prisma } from "../lib/prisma.js";
import { TOURNAMENT_KEYS } from "../lib/winterSpringsData.js";

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
      tournament_key: z.string(),
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
      tournament_key: z.string(),
      tournament_name: z.string(),
      division_key: z.string(),
      event_type: z.string(),
      skill_level: z.string(),
      age_bracket: z.string(),
      waki_cash_spent: z.number().int(),
      waki_cash_budget: z.number().int(),
      waki_lineup_complete: z.boolean(),
      picks: z.array(FantasyRosterPick),
      mlp_team_name: z.string().nullable().optional(),
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
        tournament_key: z.string(),
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
      tournament_key: z.string(),
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
const adminEmails = new Set(
  (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean),
);

async function requireAdminUser(req: FastifyRequest, reply: FastifyReply) {
  if (adminEmails.size === 0) {
    await reply.code(503).send({
      message:
        "Admin routes are disabled until ADMIN_EMAILS is set (comma-separated admin email addresses).",
    } as const);
    return;
  }
  const email = req.authUser?.email?.toLowerCase() ?? "";
  if (adminEmails.has(email)) return;
  await reply.code(403).send({ message: "Admin access required." } as const);
}

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
    "/api/v1/admin/users/lineups",
    {
      preHandler: [requireAuthUser, requireAdminUser],
      schema: {
        tags: ["users", "admin"],
        querystring: z.object({
          q: z.string().trim().optional().default(""),
        }),
        response: {
          200: z.object({
            users: z.array(
              z.object({
                user_id: z.string(),
                email: z.string(),
                display_name: z.string(),
                created_at: z.string(),
                is_banned: z.boolean(),
                /** True when a bcrypt password is stored — false means password login will fail until reset. */
                password_set: z.boolean(),
                count_winter_fantasy_rosters: z.number().int(),
                pickleball_lineups: z.array(
                  z.object({
                    tournament_key: z.string(),
                    season_key: z.string(),
                    event_count: z.number().int(),
                    wakicash_spent: z.number().int(),
                    updated_at: z.string(),
                  }),
                ),
                nascar_lineups: z.array(
                  z.object({
                    week_key: z.string(),
                    race_name: z.string(),
                    pick_count: z.number().int(),
                    updated_at: z.string(),
                  }),
                ),
              }),
            ),
          }),
          401: ErrorMessage,
          403: ErrorMessage,
          503: ErrorMessage,
        },
      },
    },
    async (req) => {
      const q = req.query.q.trim();
      const where =
        q.length === 0
          ? {}
          : {
              OR: [
                { email: { contains: q, mode: "insensitive" as const } },
                { displayName: { contains: q, mode: "insensitive" as const } },
              ],
            };
      const users = await prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: 100,
        select: {
          id: true,
          email: true,
          displayName: true,
          createdAt: true,
          isBanned: true,
          passwordHash: true,
          _count: {
            select: {
              winterFantasyRosters: true,
              fantasyTournamentLineups: true,
              nascarWeeklyLineups: true,
            },
          },
          fantasyTournamentLineups: {
            where: {
              tournamentKey: { in: [...TOURNAMENT_KEYS] },
            },
            orderBy: { updatedAt: "desc" },
            take: 30,
            select: {
              tournamentKey: true,
              seasonKey: true,
              wakicashSpent: true,
              updatedAt: true,
              eventPicks: { select: { id: true } },
            },
          },
          nascarWeeklyLineups: {
            orderBy: { updatedAt: "desc" },
            take: 30,
            select: {
              week: { select: { weekKey: true, raceName: true } },
              updatedAt: true,
              picks: { select: { id: true } },
            },
          },
        },
      });
      return {
        users: users.map((u) => ({
          user_id: u.id,
          email: u.email,
          display_name: u.displayName,
          created_at: u.createdAt.toISOString(),
          is_banned: u.isBanned,
          password_set: Boolean(u.passwordHash),
          count_winter_fantasy_rosters: u._count.winterFantasyRosters,
          pickleball_lineups: u.fantasyTournamentLineups.map((l) => ({
            tournament_key: l.tournamentKey,
            season_key: l.seasonKey,
            event_count: l.eventPicks.length,
            wakicash_spent: l.wakicashSpent,
            updated_at: l.updatedAt.toISOString(),
          })),
          nascar_lineups: u.nascarWeeklyLineups.map((l) => ({
            week_key: l.week.weekKey,
            race_name: l.week.raceName,
            pick_count: l.picks.length,
            updated_at: l.updatedAt.toISOString(),
          })),
        })),
      };
    },
  );

  typed.post(
    "/api/v1/admin/users/reset-password",
    {
      preHandler: [requireAuthUser, requireAdminUser],
      schema: {
        tags: ["users", "admin"],
        body: z.object({
          user_id: z.string().min(1),
          new_password: z.string().min(8).max(200),
        }),
        response: {
          200: z.object({ ok: z.literal(true) }),
          400: ErrorMessage,
          403: ErrorMessage,
          404: ErrorMessage,
          503: ErrorMessage,
        },
      },
    },
    async (req, reply) => {
      const { user_id, new_password } = req.body;
      const passwordHash = await bcrypt.hash(new_password, 10);
      const updated = await prisma.user.updateMany({
        where: { id: user_id },
        data: { passwordHash },
      });
      if (updated.count === 0) {
        return reply.code(404).send({ message: "User not found." } as const);
      }
      return { ok: true as const };
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
