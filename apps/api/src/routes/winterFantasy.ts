import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import {
  playerWakiCashCost,
  scoreWinterPlayerFromMatches,
  validateWakiCashLineup,
  WINTER_FANTASY_ROSTER_SIZE,
  WINTER_FANTASY_RULES,
  type WinterJsonMatch,
} from "@wakibet/shared";
import { prisma } from "../lib/prisma.js";
import { verifyAccessToken } from "../lib/jwt.js";
import { fantasyRosterTotalPoints } from "../lib/winterFantasyRosterScore.js";
import {
  filterMatchesForDivision,
  getTournamentData,
  isDivisionFeaturedFromMatches,
  listFeaturedDivisionsFromMatches,
  listTournamentOptions,
  parseDivisionKey,
  TOURNAMENT_KEYS,
  toStoredDivisionKey,
  uniquePlayersInMatches,
} from "../lib/winterSpringsData.js";
import { ROSTER_EDIT_LOCK_MS } from "../lib/fantasyConstants.js";

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

function parseMatchStartMs(match: Record<string, unknown>): number | null {
  const candidates = [
    match.match_start_at,
    match.match_start_time,
    match.start_time,
    match.start_at,
  ];
  for (const c of candidates) {
    if (typeof c !== "string" || !c.trim()) continue;
    const ms = Date.parse(c);
    if (Number.isFinite(ms)) return ms;
  }
  if (typeof match.event_date === "string" && /\d:\d/.test(match.event_date)) {
    const ms = Date.parse(match.event_date);
    if (Number.isFinite(ms)) return ms;
  }
  return null;
}

function isRosterEditLocked(matches: unknown[]): boolean {
  const starts = matches
    .map((m) => parseMatchStartMs((m ?? {}) as Record<string, unknown>))
    .filter((ms): ms is number => ms != null);
  if (starts.length === 0) return false;
  const firstStart = Math.min(...starts);
  return Date.now() >= firstStart - ROSTER_EDIT_LOCK_MS;
}

const DivisionKeyQuery = z.object({
  tournament_key: z.enum(TOURNAMENT_KEYS).default("winter_springs"),
  division_key: z.string().min(1),
});
const TournamentQuery = z.object({
  tournament_key: z.enum(TOURNAMENT_KEYS).default("winter_springs"),
});

const PickRow = z.object({
  player_name: z.string().min(1),
  is_captain: z.boolean().optional(),
});

const PutRosterBody = z.object({
  tournament_key: z.enum(TOURNAMENT_KEYS),
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
        querystring: TournamentQuery,
        response: {
          200: z.object({
            selected_tournament_key: z.enum(TOURNAMENT_KEYS),
            available_tournaments: z.array(
              z.object({
                tournament_key: z.enum(TOURNAMENT_KEYS),
                label: z.string(),
              }),
            ),
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
      const { tournament_key: tournamentKey } = req.query;
      const data = await getTournamentData(tournamentKey);
      if (!data) {
        return reply.code(503).send({ message: "Tournament schedule data is not available." } as const);
      }
      return {
        selected_tournament_key: tournamentKey,
        available_tournaments: listTournamentOptions(),
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
            tournament_key: z.enum(TOURNAMENT_KEYS),
            division_key: z.string(),
            skill_level: z.string(),
            waki_cash_budget: z.number().int(),
            players: z.array(z.object({ player_name: z.string(), waki_cash: z.number().int() })),
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
      const { tournament_key, division_key } = req.query;
      if (!parseDivisionKey(division_key)) {
        return reply.code(400).send({ message: "Invalid division_key." } as const);
      }
      const data = await getTournamentData(tournament_key);
      if (!data) {
        return reply.code(503).send({ message: "Tournament schedule data is not available." } as const);
      }
      const ms = filterMatchesForDivision(data.matches, division_key);
      if (ms.length === 0) {
        return reply.code(400).send({ message: "Unknown division." } as const);
      }
      if (!isDivisionFeaturedFromMatches(data.matches, division_key)) {
        return reply.code(400).send({
          message:
            "This division is not open for fantasy. Events must have at least 6 teams/players to be eligible.",
        } as const);
      }
      const parsed = parseDivisionKey(division_key);
      const skill = parsed?.skill_level ?? "";
      const names = uniquePlayersInMatches(ms);
      return {
        tournament_key,
        division_key,
        skill_level: skill,
        waki_cash_budget: 100,
        players: names.map((player_name) => ({
          player_name,
          waki_cash: playerWakiCashCost(skill, player_name),
        })),
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
            tournament_key: z.enum(TOURNAMENT_KEYS),
            division_key: z.string(),
            picks: z.array(
              z.object({
                slot_index: z.number().int(),
                player_name: z.string(),
                is_captain: z.boolean(),
                waki_cash: z.number().int(),
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
      const { tournament_key, division_key } = req.query;
      if (!parseDivisionKey(division_key)) {
        return reply.code(400).send({ message: "Invalid division_key." } as const);
      }
      const divParsed = parseDivisionKey(division_key);
      const skill = divParsed?.skill_level ?? "";
      const storedDivisionKey = toStoredDivisionKey(tournament_key, division_key);
      const roster = await prisma.winterFantasyRoster.findFirst({
        where:
          tournament_key === "winter_springs"
            ? { userId: uid, OR: [{ divisionKey: storedDivisionKey }, { divisionKey: division_key }] }
            : { userId: uid, divisionKey: storedDivisionKey },
        include: { picks: { orderBy: { slotIndex: "asc" } } },
      });
      return {
        tournament_key,
        division_key,
        picks: roster
          ? roster.picks.map((p) => ({
              slot_index: p.slotIndex,
              player_name: p.playerName,
              is_captain: p.isCaptain,
              waki_cash: playerWakiCashCost(skill, p.playerName),
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
            tournament_key: z.enum(TOURNAMENT_KEYS),
            division_key: z.string(),
            picks: z.array(
              z.object({
                slot_index: z.number().int(),
                player_name: z.string(),
                is_captain: z.boolean(),
                waki_cash: z.number().int(),
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
      const { tournament_key, division_key, picks } = req.body;
      const divParsed = parseDivisionKey(division_key);
      if (!divParsed) {
        return reply.code(400).send({ message: "Invalid division_key." } as const);
      }
      const storedDivisionKey = toStoredDivisionKey(tournament_key, division_key);
      if (picks.length !== WINTER_FANTASY_ROSTER_SIZE) {
        return reply
          .code(400)
          .send({ message: `Exactly ${WINTER_FANTASY_ROSTER_SIZE} picks are required.` } as const);
      }
      const captains = picks.filter((p) => p.is_captain);
      if (captains.length !== 1) {
        return reply.code(400).send({ message: "Choose exactly one captain (1.5× WakiPoints)." } as const);
      }
      const names = picks.map((p) => p.player_name);
      if (new Set(names).size !== names.length) {
        return reply.code(400).send({ message: "Duplicate players are not allowed." } as const);
      }
      const data = await getTournamentData(tournament_key);
      if (!data) {
        return reply.code(503).send({ message: "Tournament schedule data is not available." } as const);
      }
      if (!isDivisionFeaturedFromMatches(data.matches, division_key)) {
        return reply.code(400).send({
          message:
            "This division is not open for fantasy. Events must have at least 6 teams/players to be eligible.",
        } as const);
      }
      const divisionMatches = filterMatchesForDivision(data.matches, division_key);
      if (isRosterEditLocked(divisionMatches)) {
        return reply
          .code(400)
          .send({ message: "Roster changes are locked 1 hour before scheduled match start." } as const);
      }
      const pool = new Set(uniquePlayersInMatches(divisionMatches));
      for (const n of names) {
        if (!pool.has(n)) {
          return reply.code(400).send({ message: `Player is not in this division: ${n}` } as const);
        }
      }

      const skill = divParsed.skill_level;
      const wakiPicks = picks.map((p) => ({
        player_name: p.player_name,
        is_captain: Boolean(p.is_captain),
        waki_cash: playerWakiCashCost(skill, p.player_name),
      }));
      const wakiCheck = validateWakiCashLineup(wakiPicks);
      if (!wakiCheck.ok) {
        return reply.code(400).send({ message: wakiCheck.message } as const);
      }

      const saved = await prisma.$transaction(async (tx) => {
        let roster = await tx.winterFantasyRoster.findFirst({
          where:
            tournament_key === "winter_springs"
              ? { userId: uid, OR: [{ divisionKey: storedDivisionKey }, { divisionKey: division_key }] }
              : { userId: uid, divisionKey: storedDivisionKey },
        });
        if (!roster) {
          roster = await tx.winterFantasyRoster.create({
            data: { userId: uid, divisionKey: storedDivisionKey },
          });
        } else if (roster.divisionKey !== storedDivisionKey) {
          roster = await tx.winterFantasyRoster.update({
            where: { id: roster.id },
            data: { divisionKey: storedDivisionKey },
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
        tournament_key,
        division_key,
        picks: saved.picks.map((p) => ({
          slot_index: p.slotIndex,
          player_name: p.playerName,
          is_captain: p.isCaptain,
          waki_cash: playerWakiCashCost(skill, p.playerName),
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
            tournament_key: z.enum(TOURNAMENT_KEYS),
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
      const { tournament_key, division_key } = req.query;
      if (!parseDivisionKey(division_key)) {
        return reply.code(400).send({ message: "Invalid division_key." } as const);
      }
      const data = await getTournamentData(tournament_key);
      if (!data) {
        return reply.code(503).send({ message: "Tournament schedule data is not available." } as const);
      }
      if (!isDivisionFeaturedFromMatches(data.matches, division_key)) {
        return reply.code(400).send({
          message:
            "This division is not open for fantasy. Events must have at least 6 teams/players to be eligible.",
        } as const);
      }
      const divMatches = filterMatchesForDivision(data.matches, division_key) as WinterJsonMatch[];
      const roster = await prisma.winterFantasyRoster.findFirst({
        where:
          tournament_key === "winter_springs"
            ? {
                userId: uid,
                OR: [
                  { divisionKey: toStoredDivisionKey(tournament_key, division_key) },
                  { divisionKey: division_key },
                ],
              }
            : { userId: uid, divisionKey: toStoredDivisionKey(tournament_key, division_key) },
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
        tournament_key,
        division_key,
        roster_total,
        rules_version: WINTER_FANTASY_RULES.version,
        players: rows,
        note:
          "WakiPoints v3: full scoring table (see site scoring page). Categories apply when schedule rows include winners, optional scores/seeds/stage flags, and pipeline markers. " +
          "Captain applies ×1.5 to that player’s base WakiPoints on the roster total. " +
          "Lineups use 100 WakiCash with skill-based prices (see Pick / Edit Teams).",
      };
    },
  );
};
