import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { buildPickleballPicksSpotlightPayload } from "@wakibet/shared";
import { prisma } from "../lib/prisma.js";
import { getPublicSeasonLeaderboard } from "../lib/publicLeaderboard.js";

const PublicSport = z.enum(["pickleball", "lacrosse", "volleyball", "poker"]);

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

const SampleContestsResponse = z.object({
  generated_at: z.string(),
  contests: z.array(
    z.object({
      sport: PublicSport,
      label: z.string(),
      venue: z.string(),
      status: z.enum(["live", "upcoming", "ended"]),
      play_href: z.string(),
      leaderboard_href: z.string(),
    }),
  ),
});

const PublicLeaderboardResponse = z.object({
  sport: PublicSport,
  total_players: z.number().int(),
  rows: z.array(
    z.object({
      rank: z.number().int(),
      display_name: z.string(),
      points: z.number(),
    }),
  ),
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

  r.get(
    "/api/v1/public/sample-contests",
    {
      schema: {
        tags: ["public"],
        response: { 200: SampleContestsResponse },
      },
    },
    async () => {
      const pb = buildPickleballPicksSpotlightPayload();
      const contests: z.infer<typeof SampleContestsResponse>["contests"] = [
        {
          sport: "pickleball",
          label: pb?.label_full ?? "Pickleball fantasy",
          venue: pb?.venue ?? "PPA / MLP",
          status: pb?.status ?? "upcoming",
          play_href: "/pick-teams",
          leaderboard_href: "/leaderboard/pickleball",
        },
        {
          sport: "lacrosse",
          label: "PLL lacrosse fantasy",
          venue: "Premier Lacrosse League",
          status: "upcoming",
          play_href: "/lacrosse",
          leaderboard_href: "/leaderboard/lacrosse",
        },
        {
          sport: "volleyball",
          label: "AVP beach volleyball fantasy",
          venue: "AVP Tour 2026",
          status: "upcoming",
          play_href: "/volleyball",
          leaderboard_href: "/leaderboard/volleyball",
        },
        {
          sport: "poker",
          label: "WSOP fantasy",
          venue: "World Series of Poker 2026",
          status: "upcoming",
          play_href: "/auth?mode=register&from=contest_poker",
          leaderboard_href: "/leaderboard/poker",
        },
      ];
      return { generated_at: new Date().toISOString(), contests };
    },
  );

  r.get(
    "/api/v1/public/season-leaderboard",
    {
      schema: {
        tags: ["public"],
        querystring: z.object({
          sport: PublicSport.default("pickleball"),
        }),
        response: { 200: PublicLeaderboardResponse },
      },
    },
    async (req) => getPublicSeasonLeaderboard(req.query.sport),
  );
};
