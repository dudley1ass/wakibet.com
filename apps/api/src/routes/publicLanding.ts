import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { buildPickleballPicksSpotlightPayload } from "@wakibet/shared";
import { prisma } from "../lib/prisma.js";

const LandingStatsResponse = z.object({
  generated_at: z.string(),
  registered_users: z.number().int().nonnegative(),
  saved_lineups: z.number().int().nonnegative(),
  pickleball_slate: z
    .object({
      label: z.string(),
      venue: z.string(),
      status: z.enum(["live", "upcoming", "ended"]),
      starts_at: z.string(),
      href: z.string(),
    })
    .nullable(),
});

export const publicLandingRoutes: FastifyPluginAsync = async (app) => {
  const r = app.withTypeProvider<ZodTypeProvider>();

  r.get(
    "/api/v1/public/landing-stats",
    {
      schema: {
        tags: ["public"],
        response: { 200: LandingStatsResponse },
      },
    },
    async () => {
      const [registered_users, pbLineups, lacrosseLineups, winterRosters] = await Promise.all([
        prisma.user.count(),
        prisma.fantasyTournamentLineup.count(),
        prisma.lacrosseLineup.count(),
        prisma.winterFantasyRoster.count({ where: { picks: { some: {} } } }),
      ]);

      const pb = buildPickleballPicksSpotlightPayload();
      const pickleball_slate = pb
        ? {
            label: pb.label_full,
            venue: pb.venue,
            status: pb.status,
            starts_at: pb.starts_at,
            href: "/pick-teams",
          }
        : null;

      return {
        generated_at: new Date().toISOString(),
        registered_users,
        saved_lineups: pbLineups + lacrosseLineups + winterRosters,
        pickleball_slate,
      };
    },
  );
};
