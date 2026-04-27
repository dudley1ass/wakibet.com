import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { requireAuthUser } from "../../../lib/requireAuthUser.js";

const authPre = { preHandler: [requireAuthUser] };

export const nascarRoutes: FastifyPluginAsync = async (app) => {
  const typed = app.withTypeProvider<ZodTypeProvider>();

  typed.get(
    "/status",
    {
      ...authPre,
      schema: {
        tags: ["nascar"],
        response: {
          200: z.object({
            sport: z.literal("nascar"),
            enabled: z.boolean(),
            message: z.string(),
          }),
        },
      },
    },
    async () => ({
      sport: "nascar" as const,
      enabled: false,
      message: "NASCAR module scaffolded. Weekly picks and leaderboard engine coming next.",
    }),
  );

  typed.get(
    "/weeks",
    {
      ...authPre,
      schema: {
        tags: ["nascar"],
        response: {
          200: z.object({
            season: z.string(),
            weeks: z.array(
              z.object({
                week_key: z.string(),
                race_name: z.string(),
                track: z.string(),
                race_start_at: z.string(),
                status: z.enum(["upcoming", "locked", "closed"]),
              }),
            ),
          }),
        },
      },
    },
    async () => ({
      season: "2026",
      weeks: [],
    }),
  );
};
