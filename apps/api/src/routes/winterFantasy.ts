import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import {
  scoreWinterPlayerFromMatches,
  WINTER_FANTASY_ROSTER_SIZE,
  WINTER_FANTASY_RULES,
  type WinterJsonMatch,
} from "@wakibet/shared";
import { prisma } from "../lib/prisma.js";
import { verifyAccessToken } from "../lib/jwt.js";
import { fantasyRosterTotalPoints } from "../lib/winterFantasyRosterScore.js";
import {
  filterMatchesForDivision,
  getWinterData,
  isDivisionFeaturedFromMatches,
  listFeaturedDivisionsFromMatches,
  parseDivisionKey,
  uniquePlayersInMatches,
} from "../lib/winterSpringsData.js";

const ErrorMessage = z.object({ message: z.string() });

async function userIdFromBearer(authHeader: string | undefined): Promise<string | null> {
  if (!authHeader?.startsWith("Bearer ")) return null;
  try {
    const { sub } = verifyAccessToken(authHeader.slice(7));
    return sub;
  } catch {
    return null;
  }
}

const DivisionKeyQuery = z.object({
  division_key: z.string().min(1),
});

const PickRow = z.object({
  player_name: z.string().min(1),
  is_captain: z.boolean().optional(),
});

const PutRosterBody = z.object({
  division_key: z.string().min(1),
  picks: z.array(PickRow).min(WINTER_FANTASY_ROSTER_SIZE).max(WINTER_FANTASY_ROSTER_SIZE),
});

export const winterFantasyRoutes: FastifyPluginAsync = async (app) => {
  const typed = app.withTypeProvider<ZodTypeProvider>();

  typed.get(
    "/api/v1/winter-fantasy/divisions",
    {
      schema: {
        tags: ["winter-fantasy"],
        response: {
          200: z.object({
            tournament_name: z.string(),
            scoring_version: z.number().int(),
            roster_size: z.number().int(),
            divisions: z.array(
              z.object({
                division_key: z.string(),
                event_type: z.string(),
                skill_level: z.string(),
                age_bracket: z.string(),
                match_count: z.number().int(),
                player_count: z.number().int(),
              }),
            ),
          }),
          401: ErrorMessage,
          503: ErrorMessage,
        },
      },
    },
    async (req, reply) => {
      const uid = await userIdFromBearer(req.headers.authorization);
      if (!uid) return reply.code(401).send({ message: "Missing or invalid bearer token." } as const);
      const user = await prisma.user.findUnique({ where: { id: uid } });
      if (!user || user.isBanned) {
        return reply.code(401).send({ message: "Invalid or expired token." } as const);
      }
      const data = await getWinterData();
      if (!data) {
        return reply.code(503).send({ message: "Winter Springs schedule data is not available." } as const);
      }
      return {
        tournament_name: data.summary.tournament_name,
        scoring_version: WINTER_FANTASY_RULES.version,
        roster_size: WINTER_FANTASY_ROSTER_SIZE,
        divisions: listFeaturedDivisionsFromMatches(data.matches),
      };
    },
  );

  typed.get(
    "/api/v1/winter-fantasy/division-players",
    {
      schema: {
        tags: ["winter-fantasy"],
        querystring: DivisionKeyQuery,
        response: {
          200: z.object({
            division_key: z.string(),
            players: z.array(z.string()),
          }),
          401: ErrorMessage,
          400: ErrorMessage,
          503: ErrorMessage,
        },
      },
    },
    async (req, reply) => {
      const uid = await userIdFromBearer(req.headers.authorization);
      if (!uid) return reply.code(401).send({ message: "Missing or invalid bearer token." } as const);
      const user = await prisma.user.findUnique({ where: { id: uid } });
      if (!user || user.isBanned) {
        return reply.code(401).send({ message: "Invalid or expired token." } as const);
      }
      const { division_key } = req.query;
      if (!parseDivisionKey(division_key)) {
        return reply.code(400).send({ message: "Invalid division_key." } as const);
      }
      const data = await getWinterData();
      if (!data) {
        return reply.code(503).send({ message: "Winter Springs schedule data is not available." } as const);
      }
      const ms = filterMatchesForDivision(data.matches, division_key);
      if (ms.length === 0) {
        return reply.code(400).send({ message: "Unknown division." } as const);
      }
      if (!isDivisionFeaturedFromMatches(data.matches, division_key)) {
        return reply.code(400).send({
          message:
            "This division is not open for fantasy. We only use featured divisions: 5+ players, or 4 players with at least 6 schedule matches.",
        } as const);
      }
      return {
        division_key,
        players: uniquePlayersInMatches(ms),
      };
    },
  );

  typed.get(
    "/api/v1/winter-fantasy/roster",
    {
      schema: {
        tags: ["winter-fantasy"],
        querystring: DivisionKeyQuery,
        response: {
          200: z.object({
            division_key: z.string(),
            picks: z.array(
              z.object({
                slot_index: z.number().int(),
                player_name: z.string(),
                is_captain: z.boolean(),
              }),
            ),
          }),
          401: ErrorMessage,
          400: ErrorMessage,
        },
      },
    },
    async (req, reply) => {
      const uid = await userIdFromBearer(req.headers.authorization);
      if (!uid) return reply.code(401).send({ message: "Missing or invalid bearer token." } as const);
      const { division_key } = req.query;
      if (!parseDivisionKey(division_key)) {
        return reply.code(400).send({ message: "Invalid division_key." } as const);
      }
      const roster = await prisma.winterFantasyRoster.findFirst({
        where: { userId: uid, divisionKey: division_key },
        include: { picks: { orderBy: { slotIndex: "asc" } } },
      });
      return {
        division_key,
        picks: roster
          ? roster.picks.map((p) => ({
              slot_index: p.slotIndex,
              player_name: p.playerName,
              is_captain: p.isCaptain,
            }))
          : [],
      };
    },
  );

  typed.put(
    "/api/v1/winter-fantasy/roster",
    {
      schema: {
        tags: ["winter-fantasy"],
        body: PutRosterBody,
        response: {
          200: z.object({
            division_key: z.string(),
            picks: z.array(
              z.object({
                slot_index: z.number().int(),
                player_name: z.string(),
                is_captain: z.boolean(),
              }),
            ),
          }),
          401: ErrorMessage,
          400: ErrorMessage,
          503: ErrorMessage,
        },
      },
    },
    async (req, reply) => {
      const uid = await userIdFromBearer(req.headers.authorization);
      if (!uid) return reply.code(401).send({ message: "Missing or invalid bearer token." } as const);
      const user = await prisma.user.findUnique({ where: { id: uid } });
      if (!user || user.isBanned) {
        return reply.code(401).send({ message: "Invalid or expired token." } as const);
      }
      const { division_key, picks } = req.body;
      if (!parseDivisionKey(division_key)) {
        return reply.code(400).send({ message: "Invalid division_key." } as const);
      }
      if (picks.length !== WINTER_FANTASY_ROSTER_SIZE) {
        return reply
          .code(400)
          .send({ message: `Exactly ${WINTER_FANTASY_ROSTER_SIZE} picks are required.` } as const);
      }
      const captains = picks.filter((p) => p.is_captain);
      if (captains.length > 1) {
        return reply.code(400).send({ message: "At most one player may be captain." } as const);
      }
      const names = picks.map((p) => p.player_name);
      if (new Set(names).size !== names.length) {
        return reply.code(400).send({ message: "Duplicate players are not allowed." } as const);
      }
      const data = await getWinterData();
      if (!data) {
        return reply.code(503).send({ message: "Winter Springs schedule data is not available." } as const);
      }
      if (!isDivisionFeaturedFromMatches(data.matches, division_key)) {
        return reply.code(400).send({
          message:
            "This division is not open for fantasy. Featured divisions only: 5+ players, or 4 players with at least 6 schedule matches.",
        } as const);
      }
      const pool = new Set(uniquePlayersInMatches(filterMatchesForDivision(data.matches, division_key)));
      for (const n of names) {
        if (!pool.has(n)) {
          return reply.code(400).send({ message: `Player is not in this division: ${n}` } as const);
        }
      }

      const saved = await prisma.$transaction(async (tx) => {
        let roster = await tx.winterFantasyRoster.findFirst({
          where: { userId: uid, divisionKey: division_key },
        });
        if (!roster) {
          roster = await tx.winterFantasyRoster.create({
            data: { userId: uid, divisionKey: division_key },
          });
        }
        await tx.winterFantasyPick.deleteMany({ where: { rosterId: roster.id } });
        await tx.winterFantasyPick.createMany({
          data: picks.map((p, i) => ({
            rosterId: roster.id,
            slotIndex: i,
            playerName: p.player_name,
            isCaptain: Boolean(p.is_captain),
          })),
        });
        return tx.winterFantasyRoster.findUniqueOrThrow({
          where: { id: roster.id },
          include: { picks: { orderBy: { slotIndex: "asc" } } },
        });
      });

      return {
        division_key,
        picks: saved.picks.map((p) => ({
          slot_index: p.slotIndex,
          player_name: p.playerName,
          is_captain: p.isCaptain,
        })),
      };
    },
  );

  typed.get(
    "/api/v1/winter-fantasy/score",
    {
      schema: {
        tags: ["winter-fantasy"],
        querystring: DivisionKeyQuery,
        response: {
          200: z.object({
            division_key: z.string(),
            roster_total: z.number(),
            rules_version: z.number().int(),
            players: z.array(
              z.object({
                player_name: z.string(),
                is_captain: z.boolean(),
                fantasy_points: z.number(),
                breakdown: z.array(z.object({ label: z.string(), points: z.number() })),
              }),
            ),
            note: z.string(),
          }),
          401: ErrorMessage,
          400: ErrorMessage,
          503: ErrorMessage,
        },
      },
    },
    async (req, reply) => {
      const uid = await userIdFromBearer(req.headers.authorization);
      if (!uid) return reply.code(401).send({ message: "Missing or invalid bearer token." } as const);
      const { division_key } = req.query;
      if (!parseDivisionKey(division_key)) {
        return reply.code(400).send({ message: "Invalid division_key." } as const);
      }
      const data = await getWinterData();
      if (!data) {
        return reply.code(503).send({ message: "Winter Springs schedule data is not available." } as const);
      }
      if (!isDivisionFeaturedFromMatches(data.matches, division_key)) {
        return reply.code(400).send({
          message:
            "This division is not open for fantasy. Featured divisions only: 5+ players, or 4 players with at least 6 schedule matches.",
        } as const);
      }
      const divMatches = filterMatchesForDivision(data.matches, division_key) as WinterJsonMatch[];
      const roster = await prisma.winterFantasyRoster.findFirst({
        where: { userId: uid, divisionKey: division_key },
        include: { picks: { orderBy: { slotIndex: "asc" } } },
      });
      if (!roster || roster.picks.length === 0) {
        return reply.code(400).send({ message: "Save a roster for this division first." } as const);
      }
      const rows = roster.picks.map((p) => {
        const { total, breakdown } = scoreWinterPlayerFromMatches(p.playerName, divMatches);
        return {
          player_name: p.playerName,
          is_captain: p.isCaptain,
          fantasy_points: total,
          breakdown,
        };
      });
      const roster_total = fantasyRosterTotalPoints(data.matches, division_key, roster.picks);
      return {
        division_key,
        roster_total,
        rules_version: WINTER_FANTASY_RULES.version,
        players: rows,
        note:
          "Scores use wins, point differential, medals, and advancement when those fields exist on matches. " +
          "Scheduled-only rows score 0 until results are added to the schedule JSON.",
      };
    },
  );
};
