import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { POKER_LIVE_TOUR_2026_EVENTS, POKER_WORLD_RANKINGS_TOP_200 } from "@wakibet/shared";

const eventSchema = z.object({
  event_key: z.string(),
  start_date: z.string(),
  end_date: z.string(),
  country: z.string(),
  city: z.string(),
  series_code: z.string(),
  title: z.string(),
  tier: z.enum(["major", "international", "regional"]),
});

const worldRankingSchema = z.object({
  rank: z.number(),
  country: z.string(),
  player_name: z.string(),
  rating: z.number(),
});

export const pokerRoutes: FastifyPluginAsync = async (app) => {
  const typed = app.withTypeProvider<ZodTypeProvider>();

  typed.get(
    "/schedule",
    {
      schema: {
        tags: ["poker"],
        summary: "2026 live tour calendar for poker fantasy",
        response: {
          200: z.object({
            season_year: z.number(),
            events: z.array(eventSchema),
            generated_at: z.string(),
          }),
        },
      },
    },
    async () => ({
      season_year: 2026,
      events: POKER_LIVE_TOUR_2026_EVENTS,
      generated_at: new Date().toISOString(),
    }),
  );

  typed.get(
    "/world-rankings",
    {
      schema: {
        tags: ["poker"],
        summary: "Global player rankings (top 200) with composite rating",
        response: {
          200: z.object({
            players: z.array(worldRankingSchema),
            generated_at: z.string(),
          }),
        },
      },
    },
    async () => ({
      players: POKER_WORLD_RANKINGS_TOP_200,
      generated_at: new Date().toISOString(),
    }),
  );
};
