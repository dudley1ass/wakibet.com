import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { requireAuthUser } from "../../../lib/requireAuthUser.js";
import { prisma } from "../../../lib/prisma.js";
import {
  NASCAR_LINEUP_MAX_ELITE,
  NASCAR_LINEUP_SIZE,
  NASCAR_LINEUP_WAKICASH_BUDGET,
} from "../lib/nascarLineupRules.js";

const authPre = { preHandler: [requireAuthUser] };

const PickRowSchema = z.object({
  slot_index: z.number().int(),
  driver_key: z.string(),
  driver_name: z.string(),
  is_captain: z.boolean(),
  waki_cash_price: z.number().int(),
  is_elite: z.boolean(),
});

export const nascarRoutes: FastifyPluginAsync = async (app) => {
  const typed = app.withTypeProvider<ZodTypeProvider>();
  const ErrorMessage = z.object({ message: z.string() });
  const WeekQuery = z.object({ season_year: z.number().int().optional() });
  const LineupQuery = z.object({ week_key: z.string().min(1) });
  const PutLineupBody = z.object({
    week_key: z.string().min(1),
    picks: z
      .array(z.object({ driver_key: z.string().min(1), is_captain: z.boolean().optional() }))
      .length(NASCAR_LINEUP_SIZE),
  });

  typed.get(
    "/drivers",
    {
      schema: {
        tags: ["nascar"],
        response: {
          200: z.object({
            budget_wakicash: z.number().int(),
            max_elite_drivers: z.number().int(),
            drivers: z.array(
              z.object({
                driver_key: z.string(),
                display_name: z.string(),
                team_name: z.string().nullable(),
                car_number: z.string().nullable(),
                waki_cash_price: z.number().int(),
                is_elite: z.boolean(),
              }),
            ),
          }),
        },
      },
    },
    async () => {
      const drivers = await prisma.nascarDriver.findMany({
        where: { isActive: true },
        orderBy: { displayName: "asc" },
        select: {
          driverKey: true,
          displayName: true,
          teamName: true,
          carNumber: true,
          wakiCashPrice: true,
          isElite: true,
        },
      });
      return {
        budget_wakicash: NASCAR_LINEUP_WAKICASH_BUDGET,
        max_elite_drivers: NASCAR_LINEUP_MAX_ELITE,
        drivers: drivers.map((d) => ({
          driver_key: d.driverKey,
          display_name: d.displayName,
          team_name: d.teamName,
          car_number: d.carNumber,
          waki_cash_price: d.wakiCashPrice,
          is_elite: d.isElite,
        })),
      };
    },
  );

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
            total_weeks: z.number().int(),
            total_drivers: z.number().int(),
            message: z.string(),
          }),
        },
      },
    },
    async () => {
      const [weeks, drivers] = await Promise.all([
        prisma.nascarWeek.count(),
        prisma.nascarDriver.count({ where: { isActive: true } }),
      ]);
      const enabled = weeks > 0 && drivers >= NASCAR_LINEUP_SIZE;
      return {
        sport: "nascar" as const,
        enabled,
        total_weeks: weeks,
        total_drivers: drivers,
        message: enabled
          ? "NASCAR weekly picks enabled."
          : "NASCAR scaffolded. Add weeks + active drivers to enable picks.",
      };
    },
  );

  typed.get(
    "/weeks",
    {
      ...authPre,
      schema: {
        tags: ["nascar"],
        querystring: WeekQuery,
        response: {
          200: z.object({
            season: z.string(),
            weeks: z.array(
              z.object({
                week_key: z.string(),
                race_name: z.string(),
                track: z.string(),
                race_start_at: z.string(),
                lock_at: z.string(),
                status: z.enum(["upcoming", "locked", "closed"]),
              }),
            ),
          }),
        },
      },
    },
    async (req) => {
      const seasonYear = req.query.season_year ?? new Date().getUTCFullYear();
      const now = new Date();
      const weeks = await prisma.nascarWeek.findMany({
        where: { seasonYear },
        orderBy: { raceStartAt: "asc" },
      });
      return {
        season: String(seasonYear),
        weeks: weeks.map((w) => {
          const status: "upcoming" | "locked" | "closed" =
            w.isClosed ? "closed" : now >= w.lockAt ? "locked" : "upcoming";
          return {
            week_key: w.weekKey,
            race_name: w.raceName,
            track: w.trackName,
            race_start_at: w.raceStartAt.toISOString(),
            lock_at: w.lockAt.toISOString(),
            status,
          };
        }),
      };
    },
  );

  typed.get(
    "/season-summary",
    {
      ...authPre,
      schema: {
        tags: ["nascar"],
        querystring: WeekQuery,
        response: {
          200: z.object({
            season_year: z.number().int(),
            total_points: z.number(),
            rank: z.number().nullable(),
            weeks_played: z.number().int(),
          }),
        },
      },
    },
    async (req) => {
      const userId = req.authUser!.id;
      const seasonYear = req.query.season_year ?? new Date().getUTCFullYear();

      const lineups = await prisma.nascarWeeklyLineup.findMany({
        where: { userId, week: { seasonYear } },
        select: { totalPts: true },
      });
      const total_points = lineups.reduce((sum, row) => sum + row.totalPts, 0);
      const weeks_played = lineups.length;

      const grouped = await prisma.nascarWeeklyLineup.groupBy({
        by: ["userId"],
        where: { week: { seasonYear } },
        _sum: { totalPts: true },
      });
      if (grouped.length === 0) {
        return { season_year: seasonYear, total_points, rank: null, weeks_played };
      }
      const totals = grouped
        .map((g) => ({ userId: g.userId, pts: g._sum.totalPts ?? 0 }))
        .sort((a, b) => b.pts - a.pts || a.userId.localeCompare(b.userId));
      const strictlyAhead = totals.filter((t) => t.pts > total_points + 1e-9).length;
      const rank = strictlyAhead + 1;
      return { season_year: seasonYear, total_points, rank, weeks_played };
    },
  );

  typed.get(
    "/lineup",
    {
      ...authPre,
      schema: {
        tags: ["nascar"],
        querystring: LineupQuery,
        response: {
          200: z.object({
            week_key: z.string(),
            lineup_size: z.number().int(),
            picks: z.array(PickRowSchema),
          }),
          404: ErrorMessage,
        },
      },
    },
    async (req, reply) => {
      const week = await prisma.nascarWeek.findUnique({ where: { weekKey: req.query.week_key } });
      if (!week) return reply.code(404).send({ message: "Unknown week_key." } as const);

      const lineup = await prisma.nascarWeeklyLineup.upsert({
        where: { userId_weekId: { userId: req.authUser!.id, weekId: week.id } },
        create: { userId: req.authUser!.id, weekId: week.id },
        update: {},
        include: { picks: { orderBy: { slotIndex: "asc" }, include: { driver: true } } },
      });

      return {
        week_key: week.weekKey,
        lineup_size: NASCAR_LINEUP_SIZE,
        picks: lineup.picks.map((p) => ({
          slot_index: p.slotIndex,
          driver_key: p.driver.driverKey,
          driver_name: p.driver.displayName,
          is_captain: p.isCaptain,
          waki_cash_price: p.driver.wakiCashPrice,
          is_elite: p.driver.isElite,
        })),
      };
    },
  );

  typed.put(
    "/lineup",
    {
      ...authPre,
      schema: {
        tags: ["nascar"],
        body: PutLineupBody,
        response: {
          200: z.object({
            week_key: z.string(),
            picks: z.array(PickRowSchema),
          }),
          400: ErrorMessage,
          404: ErrorMessage,
          409: ErrorMessage,
        },
      },
    },
    async (req, reply) => {
      const { week_key, picks } = req.body;
      const week = await prisma.nascarWeek.findUnique({ where: { weekKey: week_key } });
      if (!week) return reply.code(404).send({ message: "Unknown week_key." } as const);
      if (week.isClosed || new Date() >= week.lockAt) {
        return reply.code(409).send({ message: "This NASCAR week is locked." } as const);
      }

      const captainCount = picks.filter((p) => p.is_captain).length;
      if (captainCount !== 1) {
        return reply.code(400).send({ message: "Choose exactly one captain." } as const);
      }
      const keys = picks.map((p) => p.driver_key);
      if (new Set(keys).size !== keys.length) {
        return reply.code(400).send({ message: "Duplicate drivers are not allowed." } as const);
      }

      const drivers = await prisma.nascarDriver.findMany({
        where: { driverKey: { in: keys }, isActive: true },
      });
      if (drivers.length !== keys.length) {
        return reply.code(400).send({ message: "One or more driver_key values are invalid/inactive." } as const);
      }
      const byKey = new Map(drivers.map((d) => [d.driverKey, d]));

      let salaryTotal = 0;
      let eliteCount = 0;
      for (const pick of picks) {
        const d = byKey.get(pick.driver_key)!;
        salaryTotal += d.wakiCashPrice;
        if (d.isElite) eliteCount += 1;
      }
      if (salaryTotal > NASCAR_LINEUP_WAKICASH_BUDGET) {
        return reply.code(400).send({
          message: `Lineup uses ${salaryTotal} WakiCash; weekly budget is ${NASCAR_LINEUP_WAKICASH_BUDGET}.`,
        } as const);
      }
      if (eliteCount > NASCAR_LINEUP_MAX_ELITE) {
        return reply.code(400).send({
          message: `At most ${NASCAR_LINEUP_MAX_ELITE} elite drivers per lineup (this lineup has ${eliteCount}).`,
        } as const);
      }

      const lineup = await prisma.nascarWeeklyLineup.upsert({
        where: { userId_weekId: { userId: req.authUser!.id, weekId: week.id } },
        create: { userId: req.authUser!.id, weekId: week.id },
        update: {},
      });

      const saved = await prisma.$transaction(async (tx) => {
        await tx.nascarWeeklyPick.deleteMany({ where: { lineupId: lineup.id } });
        for (let i = 0; i < picks.length; i++) {
          const pick = picks[i]!;
          const d = byKey.get(pick.driver_key)!;
          await tx.nascarWeeklyPick.create({
            data: {
              lineupId: lineup.id,
              slotIndex: i,
              driverId: d.id,
              isCaptain: Boolean(pick.is_captain),
            },
          });
        }
        return tx.nascarWeeklyLineup.findUniqueOrThrow({
          where: { id: lineup.id },
          include: { picks: { orderBy: { slotIndex: "asc" }, include: { driver: true } } },
        });
      });

      return {
        week_key,
        picks: saved.picks.map((p) => ({
          slot_index: p.slotIndex,
          driver_key: p.driver.driverKey,
          driver_name: p.driver.displayName,
          is_captain: p.isCaptain,
          waki_cash_price: p.driver.wakiCashPrice,
          is_elite: p.driver.isElite,
        })),
      };
    },
  );
};
