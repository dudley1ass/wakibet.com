import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { prisma } from "../lib/prisma.js";
import { verifyAccessToken } from "../lib/jwt.js";
import { getWinterData, parseDivisionKey } from "../lib/winterSpringsData.js";

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
  winter_springs: z.object({
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
  winter_fantasy_rosters: z.array(
    z.object({
      division_key: z.string(),
      event_type: z.string(),
      skill_level: z.string(),
      age_bracket: z.string(),
      picks: z.array(FantasyRosterPick),
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
      const winterData = await getWinterData();

      const fantasyRows = await prisma.winterFantasyRoster.findMany({
        where: { userId: payload.sub },
        include: { picks: { orderBy: { slotIndex: "asc" } } },
        orderBy: { updatedAt: "desc" },
      });
      const winter_fantasy_rosters = fantasyRows.map((r) => {
        const parsed = parseDivisionKey(r.divisionKey);
        return {
          division_key: r.divisionKey,
          event_type: parsed?.event_type ?? "",
          skill_level: parsed?.skill_level ?? "",
          age_bracket: parsed?.age_bracket ?? "",
          picks: r.picks.map((p) => ({
            slot_index: p.slotIndex,
            player_name: p.playerName,
            is_captain: p.isCaptain,
          })),
        };
      });

      return {
        profile: {
          display_name: user.displayName,
          email: user.email,
          state: user.region,
          country: user.country,
          joined_at: user.createdAt.toISOString(),
        },
        open_contests: winterData
          ? [
              {
                id: "winter-springs-2026",
                name: "Winter Springs Spring Classic",
                entry_fee_dills: 500,
                status: "UPCOMING",
              },
            ]
          : [],
        winter_springs: {
          tournament_name: winterData?.summary.tournament_name ?? "Winter Springs Spring Classic (test run)",
          generated_matches: winterData?.summary.matches_generated ?? 0,
          my_upcoming_matches:
            winterData?.per_player_matches[user.displayName]?.slice(0, 8).map((m) => ({
              match_id: m.match_id,
              event_type: m.event_type,
              skill_level: m.skill_level,
              age_bracket: m.age_bracket,
              event_date: m.event_date,
              opponent: m.opponent,
            })) ?? [],
          featured_matches:
            winterData?.matches.slice(0, 8).map((m) => ({
              match_id: m.match_id,
              event_type: m.event_type,
              event_date: m.event_date,
              player_a: m.player_a,
              player_b: m.player_b,
            })) ?? [],
        },
        winter_fantasy_rosters,
      };
    },
  );
};
