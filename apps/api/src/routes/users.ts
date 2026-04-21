import type { FastifyPluginAsync } from "fastify";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
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
  recent_bets: z.array(RecentBet),
});

const ErrorMessage = z.object({ message: z.string() });

type WinterMatch = {
  match_id: string;
  event_type: string;
  skill_level: string;
  age_bracket: string;
  event_date: string;
  player_a: string;
  player_b: string;
  status: string;
};

type WinterPerPlayer = {
  match_id: string;
  event_type: string;
  skill_level: string;
  age_bracket: string;
  event_date: string;
  opponent: string;
};

type WinterData = {
  summary: { tournament_name: string; matches_generated: number };
  matches: WinterMatch[];
  per_player_matches: Record<string, WinterPerPlayer[]>;
};

function loadWinterData(): WinterData | null {
  const jsonPath = path.join(process.cwd(), "data", "winter_springs_test_run_matches.json");
  if (!existsSync(jsonPath)) return null;
  try {
    return JSON.parse(readFileSync(jsonPath, "utf-8")) as WinterData;
  } catch {
    return null;
  }
}

const winterData = loadWinterData();

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
        recent_bets: [] as { selection_id: string; market_label: string; pick: string; status: string }[],
      };
    },
  );
};
