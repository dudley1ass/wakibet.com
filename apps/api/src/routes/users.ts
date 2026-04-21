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
  profile: z.object({
    display_name: z.string(),
    email: z.string(),
    state: z.string().nullable(),
    country: z.string(),
    joined_at: z.string(),
  }),
  wallet_activity: z.array(
    z.object({
      id: z.string(),
      type: z.string(),
      amount_dills: z.number(),
      created_at: z.string(),
    }),
  ),
  open_contests: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      entry_fee_dills: z.number(),
      status: z.string(),
    }),
  ),
  recent_bets: z.array(RecentBet),
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
      const wallet = await prisma.wallet.findUnique({ where: { userId: payload.sub } });
      const dills = wallet ? Number(wallet.cachedBalance) : 0;
      const balance_cents = Math.round(dills * 100);
      const walletActivityRaw = wallet
        ? await prisma.walletLedger.findMany({
            where: { walletId: wallet.id },
            orderBy: { createdAt: "desc" },
            take: 8,
          })
        : [];
      const wallet_activity = walletActivityRaw.map((row) => ({
        id: row.id,
        type: row.type,
        amount_dills: Number(row.amount),
        created_at: row.createdAt.toISOString(),
      }));

      return {
        balance_cents,
        summary: { wins: 0, losses: 0, pending: 0 },
        profile: {
          display_name: user.displayName,
          email: user.email,
          state: user.region,
          country: user.country,
          joined_at: user.createdAt.toISOString(),
        },
        wallet_activity,
        open_contests: [],
        recent_bets: [] as { selection_id: string; market_label: string; pick: string; status: string }[],
      };
    },
  );
};
