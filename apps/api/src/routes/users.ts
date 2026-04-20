import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { prisma } from "../lib/prisma.js";
import { verifyAccessToken } from "../lib/jwt.js";

const RecentBet = z.object({
  selection_id: z.string(),
  market_label: z.string(),
  pick: z.string(),
  status: z.string(),
});

const DashboardResponse = z.object({
  balance_cents: z.number().int(),
  summary: z.object({
    wins: z.number().int(),
    losses: z.number().int(),
    pending: z.number().int(),
  }),
  recent_bets: z.array(RecentBet),
});

export const usersRoutes: FastifyPluginAsync = async (app) => {
  const typed = app.withTypeProvider<ZodTypeProvider>();

  typed.get(
    "/api/v1/users/me/dashboard",
    {
      schema: {
        tags: ["users"],
        response: { 200: DashboardResponse },
      },
    },
    async (req, reply) => {
      const hdr = req.headers.authorization;
      if (!hdr?.startsWith("Bearer ")) {
        return reply.code(401).send({ message: "Missing bearer token." });
      }
      let payload: { sub: string };
      try {
        payload = verifyAccessToken(hdr.slice(7));
      } catch {
        return reply.code(401).send({ message: "Invalid or expired token." });
      }
      const wallet = await prisma.wallet.findUnique({ where: { userId: payload.sub } });
      const dills = wallet ? Number(wallet.cachedBalance) : 0;
      const balance_cents = Math.round(dills * 100);

      return {
        balance_cents,
        summary: { wins: 0, losses: 0, pending: 0 },
        recent_bets: [] as { selection_id: string; market_label: string; pick: string; status: string }[],
      };
    },
  );
};
