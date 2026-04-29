import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { requireAuthUser } from "../../../lib/requireAuthUser.js";
import { prisma } from "../../../lib/prisma.js";
import {
  NASCAR_LINEUP_MAX_PREMIUM_OVER_THRESHOLD,
  NASCAR_LINEUP_SIZE,
  NASCAR_LINEUP_WAKICASH_BUDGET,
  NASCAR_PREMIUM_WAKICASH_THRESHOLD,
} from "../lib/nascarLineupRules.js";
import { entryDriverKeysForWeek, isDriverKeyOnWeekEntryList } from "../lib/nascarWeekEntryDriverKeys.js";

function isPremiumSalary(wakiCashPrice: number): boolean {
  return wakiCashPrice > NASCAR_PREMIUM_WAKICASH_THRESHOLD;
}

const authPre = { preHandler: [requireAuthUser] };

const PickRowSchema = z.object({
  slot_index: z.number().int(),
  driver_key: z.string(),
  driver_name: z.string(),
  car_number: z.string().nullable(),
  sponsor: z.string().nullable(),
  manufacturer: z.string().nullable(),
  team_name: z.string().nullable(),
  is_captain: z.boolean(),
  waki_cash_price: z.number().int(),
  is_elite: z.boolean(),
});

export const nascarRoutes: FastifyPluginAsync = async (app) => {
  const typed = app.withTypeProvider<ZodTypeProvider>();
  const ErrorMessage = z.object({ message: z.string() });
  /** Query params are strings; coerce so `?season_year=2026` validates. */
  const WeekQuery = z.object({
    season_year: z.preprocess(
      (v) => (v === "" || v === null ? undefined : v),
      z.coerce.number().int().optional(),
    ),
  });
  const LineupQuery = z.object({ week_key: z.string().min(1) });
  const DriversQuery = z.object({
    week_key: z.preprocess((v) => (v === "" || v === null ? undefined : v), z.string().min(1).optional()),
  });
  const PutLineupBody = z.object({
    week_key: z.string().min(1),
    picks: z
      .array(z.object({ driver_key: z.string().min(1), is_captain: z.boolean().optional() }))
      .length(NASCAR_LINEUP_SIZE),
    /** Whole seconds between 1st and 2nd at the finish (tiebreaker #1). */
    tiebreaker_win_margin_seconds: z.number().int().min(0).max(999_999),
    /** Total laps run under caution in the race (tiebreaker #2). */
    tiebreaker_caution_laps: z.number().int().min(0).max(500),
  });

  const LineupResponseSchema = z.object({
    week_key: z.string(),
    lineup_size: z.number().int(),
    picks: z.array(PickRowSchema),
    tiebreaker_win_margin_seconds: z.number().int().nullable(),
    tiebreaker_caution_laps: z.number().int().nullable(),
  });

  const SeasonLineupsWeekSchema = z.object({
    week_key: z.string(),
    race_name: z.string(),
    track: z.string(),
    race_start_at: z.string(),
    lock_at: z.string(),
    status: z.enum(["upcoming", "locked", "closed"]),
    total_points: z.number(),
    lineup_complete: z.boolean(),
    tiebreaker_win_margin_seconds: z.number().int().nullable(),
    tiebreaker_caution_laps: z.number().int().nullable(),
    picks: z.array(PickRowSchema),
  });

  typed.get(
    "/drivers",
    {
      schema: {
        tags: ["nascar"],
        querystring: DriversQuery,
        response: {
          200: z.object({
            budget_wakicash: z.number().int(),
            premium_wakicash_threshold: z.number().int(),
            max_premium_drivers: z.number().int(),
            max_elite_drivers: z.number().int(),
            drivers: z.array(
              z.object({
                driver_key: z.string(),
                display_name: z.string(),
                team_name: z.string().nullable(),
                car_number: z.string().nullable(),
                sponsor: z.string().nullable(),
                manufacturer: z.string().nullable(),
                waki_cash_price: z.number().int(),
                is_elite: z.boolean(),
              }),
            ),
          }),
        },
      },
    },
    async (req) => {
      const entryKeys = req.query.week_key ? entryDriverKeysForWeek(req.query.week_key) : null;
      const drivers = await prisma.nascarDriver.findMany({
        where: {
          isActive: true,
          ...(entryKeys ? { driverKey: { in: [...entryKeys] } } : {}),
        },
        orderBy: { displayName: "asc" },
        select: {
          driverKey: true,
          displayName: true,
          teamName: true,
          carNumber: true,
          sponsor: true,
          manufacturer: true,
          wakiCashPrice: true,
          isElite: true,
        },
      });
      return {
        budget_wakicash: NASCAR_LINEUP_WAKICASH_BUDGET,
        premium_wakicash_threshold: NASCAR_PREMIUM_WAKICASH_THRESHOLD,
        max_premium_drivers: NASCAR_LINEUP_MAX_PREMIUM_OVER_THRESHOLD,
        max_elite_drivers: NASCAR_LINEUP_MAX_PREMIUM_OVER_THRESHOLD,
        drivers: drivers.map((d) => ({
          driver_key: d.driverKey,
          display_name: d.displayName,
          team_name: d.teamName,
          car_number: d.carNumber,
          sponsor: d.sponsor,
          manufacturer: d.manufacturer,
          waki_cash_price: d.wakiCashPrice,
          is_elite: isPremiumSalary(d.wakiCashPrice),
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
    "/season-leaderboard",
    {
      ...authPre,
      schema: {
        tags: ["nascar"],
        querystring: WeekQuery,
        response: {
          200: z.object({
            sport: z.literal("nascar"),
            season_year: z.number().int(),
            total_players: z.number().int(),
            rows: z.array(
              z.object({
                rank: z.number().int(),
                display_name: z.string(),
                points: z.number(),
                is_me: z.boolean(),
              }),
            ),
          }),
          401: ErrorMessage,
        },
      },
    },
    async (req) => {
      const me = req.authUser!.id;
      const seasonYear = req.query.season_year ?? new Date().getUTCFullYear();

      const grouped = await prisma.nascarWeeklyLineup.groupBy({
        by: ["userId"],
        where: { week: { seasonYear } },
        _sum: { totalPts: true },
      });
      if (grouped.length === 0) {
        return { sport: "nascar" as const, season_year: seasonYear, total_players: 0, rows: [] };
      }

      const userIds = grouped.map((g) => g.userId);
      const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, displayName: true },
      });
      const nameById = new Map(users.map((u) => [u.id, u.displayName]));

      const totals = grouped
        .map((g) => ({
          user_id: g.userId,
          display_name: nameById.get(g.userId) ?? "Player",
          points: g._sum.totalPts ?? 0,
        }))
        .sort((a, b) => {
          if (b.points !== a.points) return b.points - a.points;
          const dn = a.display_name.localeCompare(b.display_name, undefined, { sensitivity: "base" });
          if (dn !== 0) return dn;
          return a.user_id.localeCompare(b.user_id);
        });

      let rank = 0;
      const withRanks = totals.map((t, i) => {
        if (i === 0 || t.points < totals[i - 1]!.points) rank = i + 1;
        return { rank, display_name: t.display_name, points: t.points, user_id: t.user_id };
      });

      const rows = withRanks.slice(0, 100).map((r) => ({
        rank: r.rank,
        display_name: r.display_name,
        points: r.points,
        is_me: r.user_id === me,
      }));

      return {
        sport: "nascar" as const,
        season_year: seasonYear,
        total_players: totals.length,
        rows,
      };
    },
  );

  typed.get(
    "/lineups",
    {
      ...authPre,
      schema: {
        tags: ["nascar"],
        querystring: WeekQuery,
        response: {
          200: z.object({
            season: z.string(),
            lineup_size: z.number().int(),
            weeks: z.array(SeasonLineupsWeekSchema),
          }),
        },
      },
    },
    async (req) => {
      const userId = req.authUser!.id;
      const seasonYear = req.query.season_year ?? new Date().getUTCFullYear();
      const now = new Date();

      const weeks = await prisma.nascarWeek.findMany({
        where: { seasonYear },
        orderBy: { raceStartAt: "asc" },
      });
      if (weeks.length === 0) {
        return { season: String(seasonYear), lineup_size: NASCAR_LINEUP_SIZE, weeks: [] };
      }

      const lineups = await prisma.nascarWeeklyLineup.findMany({
        where: { userId, weekId: { in: weeks.map((w) => w.id) } },
        include: { picks: { orderBy: { slotIndex: "asc" }, include: { driver: true } } },
      });
      const lineupByWeekId = new Map(lineups.map((l) => [l.weekId, l]));

      const weeksOut = weeks.map((w) => {
        const status: "upcoming" | "locked" | "closed" = w.isClosed
          ? "closed"
          : now >= w.lockAt
            ? "locked"
            : "upcoming";
        const L = lineupByWeekId.get(w.id);
        const picks =
          L?.picks.map((p) => ({
            slot_index: p.slotIndex,
            driver_key: p.driver.driverKey,
            driver_name: p.driver.displayName,
            car_number: p.driver.carNumber,
            sponsor: p.driver.sponsor,
            manufacturer: p.driver.manufacturer,
            team_name: p.driver.teamName,
            is_captain: p.isCaptain,
            waki_cash_price: p.driver.wakiCashPrice,
            is_elite: isPremiumSalary(p.driver.wakiCashPrice),
          })) ?? [];
        const tbWin = L?.tiebreakerWinMarginSeconds ?? null;
        const tbCaut = L?.tiebreakerCautionLaps ?? null;
        const lineup_complete =
          picks.length === NASCAR_LINEUP_SIZE &&
          picks.filter((p) => p.is_captain).length === 1 &&
          tbWin != null &&
          tbCaut != null;
        return {
          week_key: w.weekKey,
          race_name: w.raceName,
          track: w.trackName,
          race_start_at: w.raceStartAt.toISOString(),
          lock_at: w.lockAt.toISOString(),
          status,
          total_points: L?.totalPts ?? 0,
          lineup_complete,
          tiebreaker_win_margin_seconds: tbWin,
          tiebreaker_caution_laps: tbCaut,
          picks,
        };
      });

      return { season: String(seasonYear), lineup_size: NASCAR_LINEUP_SIZE, weeks: weeksOut };
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
          200: LineupResponseSchema,
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
        tiebreaker_win_margin_seconds: lineup.tiebreakerWinMarginSeconds,
        tiebreaker_caution_laps: lineup.tiebreakerCautionLaps,
        picks: lineup.picks.map((p) => ({
          slot_index: p.slotIndex,
          driver_key: p.driver.driverKey,
          driver_name: p.driver.displayName,
          car_number: p.driver.carNumber,
          sponsor: p.driver.sponsor,
          manufacturer: p.driver.manufacturer,
          team_name: p.driver.teamName,
          is_captain: p.isCaptain,
          waki_cash_price: p.driver.wakiCashPrice,
          is_elite: isPremiumSalary(p.driver.wakiCashPrice),
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
          200: LineupResponseSchema,
          400: ErrorMessage,
          404: ErrorMessage,
          409: ErrorMessage,
        },
      },
    },
    async (req, reply) => {
      const { week_key, picks, tiebreaker_win_margin_seconds, tiebreaker_caution_laps } = req.body;
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

      const notOnEntry = keys.filter((k) => !isDriverKeyOnWeekEntryList(week_key, k));
      if (notOnEntry.length > 0) {
        return reply.code(400).send({
          message: `Not on the official entry list for this race: ${notOnEntry.join(", ")}.`,
        } as const);
      }

      const drivers = await prisma.nascarDriver.findMany({
        where: { driverKey: { in: keys }, isActive: true },
      });
      if (drivers.length !== keys.length) {
        return reply.code(400).send({ message: "One or more driver_key values are invalid/inactive." } as const);
      }
      const byKey = new Map(drivers.map((d) => [d.driverKey, d]));

      let salaryTotal = 0;
      let premiumOverThreshold = 0;
      for (const pick of picks) {
        const d = byKey.get(pick.driver_key)!;
        salaryTotal += d.wakiCashPrice;
        if (isPremiumSalary(d.wakiCashPrice)) premiumOverThreshold += 1;
      }
      if (salaryTotal > NASCAR_LINEUP_WAKICASH_BUDGET) {
        return reply.code(400).send({
          message: `Lineup uses ${salaryTotal} WakiCash; weekly budget is ${NASCAR_LINEUP_WAKICASH_BUDGET}.`,
        } as const);
      }
      if (premiumOverThreshold > NASCAR_LINEUP_MAX_PREMIUM_OVER_THRESHOLD) {
        return reply.code(400).send({
          message: `At most ${NASCAR_LINEUP_MAX_PREMIUM_OVER_THRESHOLD} drivers may cost more than ${NASCAR_PREMIUM_WAKICASH_THRESHOLD} WakiCash (this lineup has ${premiumOverThreshold}).`,
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
        await tx.nascarWeeklyLineup.update({
          where: { id: lineup.id },
          data: {
            tiebreakerWinMarginSeconds: tiebreaker_win_margin_seconds,
            tiebreakerCautionLaps: tiebreaker_caution_laps,
          },
        });
        return tx.nascarWeeklyLineup.findUniqueOrThrow({
          where: { id: lineup.id },
          include: { picks: { orderBy: { slotIndex: "asc" }, include: { driver: true } } },
        });
      });

      return {
        week_key,
        lineup_size: NASCAR_LINEUP_SIZE,
        tiebreaker_win_margin_seconds: saved.tiebreakerWinMarginSeconds,
        tiebreaker_caution_laps: saved.tiebreakerCautionLaps,
        picks: saved.picks.map((p) => ({
          slot_index: p.slotIndex,
          driver_key: p.driver.driverKey,
          driver_name: p.driver.displayName,
          car_number: p.driver.carNumber,
          sponsor: p.driver.sponsor,
          manufacturer: p.driver.manufacturer,
          team_name: p.driver.teamName,
          is_captain: p.isCaptain,
          waki_cash_price: p.driver.wakiCashPrice,
          is_elite: isPremiumSalary(p.driver.wakiCashPrice),
        })),
      };
    },
  );
};
