import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { prisma } from "../lib/prisma.js";

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function toRatingFromScore(score: number): number {
  return Math.round(1500 + clamp(score * 8, -250, 250));
}

export const wakiOddsRoutes: FastifyPluginAsync = async (app) => {
  const typed = app.withTypeProvider<ZodTypeProvider>();

  typed.get(
    "/api/v1/wakiodds/featured",
    {
      schema: {
        tags: ["wakiodds"],
        response: {
          200: z.object({
            updated_at: z.string(),
            markets: z.object({
              nascar: z.object({
                source: z.string(),
                team_a: z.object({
                  label: z.string(),
                  players: z.array(z.string()),
                  rating: z.number(),
                }),
                team_b: z.object({
                  label: z.string(),
                  players: z.array(z.string()),
                  rating: z.number(),
                }),
              }),
              pickleball: z.object({
                source: z.string(),
                team_a: z.object({
                  label: z.string(),
                  players: z.array(z.string()),
                  rating: z.number(),
                }),
                team_b: z.object({
                  label: z.string(),
                  players: z.array(z.string()),
                  rating: z.number(),
                }),
              }),
            }),
          }),
        },
      },
    },
    async () => {
      const nascarDrivers = await prisma.nascarDriver.findMany({
        where: { isActive: true },
        orderBy: [{ wakiCashPrice: "desc" }, { displayName: "asc" }],
        take: 4,
        select: { displayName: true, wakiCashPrice: true },
      });
      const n = nascarDrivers.length >= 4 ? nascarDrivers : [];
      const nascarA = n.slice(0, 2);
      const nascarB = n.slice(2, 4);
      const nascarFallback = ["William Byron", "Kyle Larson", "Denny Hamlin", "Ross Chastain"];
      const nascarTeamAPlayers = nascarA.length === 2 ? nascarA.map((d) => d.displayName) : nascarFallback.slice(0, 2);
      const nascarTeamBPlayers = nascarB.length === 2 ? nascarB.map((d) => d.displayName) : nascarFallback.slice(2, 4);
      const nascarTeamARating =
        nascarA.length === 2 ? Math.round(1400 + ((nascarA[0]!.wakiCashPrice + nascarA[1]!.wakiCashPrice) / 2) * 8) : 1640;
      const nascarTeamBRating =
        nascarB.length === 2 ? Math.round(1400 + ((nascarB[0]!.wakiCashPrice + nascarB[1]!.wakiCashPrice) / 2) * 8) : 1510;

      let pickleballMarket: {
        source: string;
        team_a: { label: string; players: string[]; rating: number };
        team_b: { label: string; players: string[]; rating: number };
      } = {
        source: "fallback",
        team_a: { label: "Top pair", players: ["Anna Leigh Waters", "Ben Johns"], rating: 1665 },
        team_b: { label: "Challenger pair", players: ["Anna Bright", "Federico Staksrud"], rating: 1535 },
      };

      try {
        const grouped = await prisma.ppaResultPlayerEvent.groupBy({
          by: ["playerId"],
          _avg: { rank: true, pd: true },
          _sum: { wins: true },
          _count: { _all: true },
          orderBy: [{ _avg: { rank: "asc" } }],
          take: 8,
        });

        if (grouped.length >= 4) {
          const playerIds = grouped.map((g) => g.playerId);
          const players = await prisma.ppaResultPlayer.findMany({
            where: { id: { in: playerIds } },
            select: { id: true, playerName: true },
          });
          const byId = new Map(players.map((p) => [p.id, p.playerName]));
          const rows = grouped
            .map((g) => {
              const name = byId.get(g.playerId);
              if (!name) return null;
              const cnt = g._count._all || 1;
              const avgRank = g._avg.rank ?? 20;
              const avgPd = g._avg.pd ?? 0;
              const avgWins = (g._sum.wins ?? 0) / cnt;
              const score = avgWins * 10 + avgPd * 0.25 - avgRank * 2;
              return { name, rating: toRatingFromScore(score) };
            })
            .filter((r): r is { name: string; rating: number } => Boolean(r))
            .slice(0, 4);

          if (rows.length >= 4) {
            pickleballMarket = {
              source: "ppa_result_history",
              team_a: {
                label: "Top pair",
                players: [rows[0]!.name, rows[1]!.name],
                rating: Math.round((rows[0]!.rating + rows[1]!.rating) / 2 + 10),
              },
              team_b: {
                label: "Challenger pair",
                players: [rows[2]!.name, rows[3]!.name],
                rating: Math.round((rows[2]!.rating + rows[3]!.rating) / 2),
              },
            };
          }
        }
      } catch {
        // Fallback remains active when PPA result tables are not deployed yet.
      }

      return {
        updated_at: new Date().toISOString(),
        markets: {
          nascar: {
            source: nascarA.length === 2 && nascarB.length === 2 ? "nascar_driver_wakicash" : "fallback",
            team_a: {
              label: "Top pair",
              players: nascarTeamAPlayers,
              rating: nascarTeamARating,
            },
            team_b: {
              label: "Challenger pair",
              players: nascarTeamBPlayers,
              rating: nascarTeamBRating,
            },
          },
          pickleball: pickleballMarket,
        },
      };
    },
  );
};
