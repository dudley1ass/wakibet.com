import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { playerWakiCashCost, WINTER_FANTASY_ROSTER_SIZE } from "@wakibet/shared";
import { prisma } from "../lib/prisma.js";
import { verifyAccessToken } from "../lib/jwt.js";
import {
  displayLabelForCatalogRow,
  syncTournamentEventCatalog,
} from "../lib/fantasyTournamentCatalog.js";
import {
  filterMatchesForDivision,
  getTournamentData,
  parseDivisionKey,
  TOURNAMENT_KEYS,
  uniquePlayersInMatches,
  type TournamentKey,
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

function isEventLocked(firstMatchStartsAt: Date | null, lockedAt: Date | null): boolean {
  if (lockedAt) return true;
  if (!firstMatchStartsAt) return false;
  return Date.now() >= firstMatchStartsAt.getTime() - ROSTER_EDIT_LOCK_MS;
}

function normName(n: string): string {
  return n.trim().toLowerCase().replace(/\s+/g, " ");
}

function sameSlots(
  a: { slots: { slotIndex: number; playerName: string; isCaptain: boolean }[] },
  b: { picks: { player_name: string; is_captain?: boolean }[] },
): boolean {
  const sortedA = [...a.slots].sort((x, y) => x.slotIndex - y.slotIndex);
  const sortedB = b.picks.map((p, i) => ({
    slotIndex: i,
    playerName: p.player_name,
    isCaptain: Boolean(p.is_captain),
  }));
  if (sortedA.length !== sortedB.length) return false;
  for (let i = 0; i < sortedA.length; i++) {
    const x = sortedA[i]!;
    const y = sortedB[i]!;
    if (normName(x.playerName) !== normName(y.playerName)) return false;
    if (x.isCaptain !== y.isCaptain) return false;
  }
  return true;
}

function validateEventPicksShape(
  picks: { player_name: string; is_captain?: boolean; waki_cash: number }[],
  eventBudget: number,
): { ok: true } | { ok: false; message: string } {
  if (picks.length !== WINTER_FANTASY_ROSTER_SIZE) {
    return { ok: false, message: `Exactly ${WINTER_FANTASY_ROSTER_SIZE} picks per event.` };
  }
  const captains = picks.filter((p) => p.is_captain);
  if (captains.length !== 1) {
    return { ok: false, message: "Choose exactly one captain per event (1.5× WakiPoints)." };
  }
  const names = picks.map((p) => p.player_name);
  if (new Set(names.map(normName)).size !== names.length) {
    return { ok: false, message: "Duplicate players are not allowed within an event." };
  }
  const total = picks.reduce((s, p) => s + p.waki_cash, 0);
  if (total > eventBudget) {
    return { ok: false, message: `Event costs ${total} WakiCash; max is ${eventBudget}.` };
  }
  return { ok: true };
}

const TourneyParams = z.object({
  tournament_key: z.enum(TOURNAMENT_KEYS),
});

const PickIn = z.object({
  player_name: z.string().min(1),
  is_captain: z.boolean().optional(),
});

const EventPickIn = z.object({
  slot_index: z.number().int().min(0).max(4),
  event_key: z.string().min(1),
  picks: z.array(PickIn).length(WINTER_FANTASY_ROSTER_SIZE),
});

const PutLineupBody = z.object({
  season_key: z.string().default(""),
  events: z.array(EventPickIn).max(5),
});

export const fantasyTournamentRoutes: FastifyPluginAsync = async (app) => {
  const typed = app.withTypeProvider<ZodTypeProvider>();

  typed.get(
    "/:tournament_key/events",
    {
      schema: {
        tags: ["fantasy-tournament"],
        params: TourneyParams,
        response: {
          200: z.object({
            tournament_key: z.enum(TOURNAMENT_KEYS),
            tournament_name: z.string(),
            events: z.array(
              z.object({
                event_key: z.string(),
                schedule_division_key: z.string(),
                label: z.string(),
                format: z.string(),
                tier_code: z.string(),
                wakicash_multiplier: z.number(),
                wakipoints_multiplier: z.number(),
                is_selectable: z.boolean(),
                match_count: z.number().int(),
                player_count: z.number().int(),
                first_match_starts_at: z.string().nullable(),
                is_locked: z.boolean(),
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
      const { tournament_key: tournamentKey } = req.params;
      const data = await getTournamentData(tournamentKey);
      if (!data) {
        return reply.code(503).send({ message: "Tournament schedule data is not available." } as const);
      }
      await syncTournamentEventCatalog(prisma, tournamentKey, data);
      const rows = await prisma.tournamentEventCatalog.findMany({
        where: { tournamentKey },
        orderBy: [{ eventType: "asc" }, { skillLevel: "asc" }, { ageBracket: "asc" }],
      });
      return {
        tournament_key: tournamentKey,
        tournament_name: data.summary.tournament_name,
        events: rows.map((r) => ({
          event_key: r.eventKey,
          schedule_division_key: r.scheduleDivisionKey,
          label: displayLabelForCatalogRow(r),
          format: r.format,
          tier_code: r.tierCode,
          wakicash_multiplier: Number(r.wakicashMultiplier),
          wakipoints_multiplier: Number(r.wakipointsMultiplier),
          is_selectable: r.isSelectable,
          match_count: r.matchCount,
          player_count: r.entityCount,
          first_match_starts_at: r.firstMatchStartsAt?.toISOString() ?? null,
          is_locked: isEventLocked(r.firstMatchStartsAt, null),
        })),
      };
    },
  );

  typed.get(
    "/:tournament_key/lineup",
    {
      schema: {
        tags: ["fantasy-tournament"],
        params: TourneyParams,
        querystring: z.object({ season_key: z.string().optional().default("") }),
        response: {
          200: z.object({
            tournament_key: z.enum(TOURNAMENT_KEYS),
            season_key: z.string(),
            wakicash_budget: z.number().int(),
            wakicash_spent: z.number().int(),
            events: z.array(
              z.object({
                slot_index: z.number().int(),
                event_key: z.string(),
                schedule_division_key: z.string(),
                label: z.string(),
                tier_code_at_save: z.string().nullable(),
                is_locked: z.boolean(),
                picks: z.array(
                  z.object({
                    slot_index: z.number().int(),
                    player_name: z.string(),
                    is_captain: z.boolean(),
                    waki_cash: z.number().int(),
                  }),
                ),
              }),
            ),
          }),
          401: ErrorMessage,
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
      const { tournament_key: tournamentKey } = req.params;
      const seasonKey = req.query.season_key ?? "";
      const data = await getTournamentData(tournamentKey);
      if (data) await syncTournamentEventCatalog(prisma, tournamentKey, data);

      const lineup = await prisma.fantasyTournamentLineup.upsert({
        where: {
          userId_tournamentKey_seasonKey: { userId: uid, tournamentKey, seasonKey },
        },
        create: {
          userId: uid,
          tournamentKey,
          seasonKey,
          wakicashBudget: 100,
          wakicashSpent: 0,
        },
        update: {},
        include: {
          eventPicks: {
            orderBy: { slotIndex: "asc" },
            include: { slots: { orderBy: { slotIndex: "asc" } } },
          },
        },
      });

      const catalogRows = await prisma.tournamentEventCatalog.findMany({
        where: { tournamentKey },
      });
      const catalogByKey = new Map(catalogRows.map((c) => [c.eventKey, c]));

      return {
        tournament_key: tournamentKey as TournamentKey,
        season_key: lineup.seasonKey,
        wakicash_budget: lineup.wakicashBudget,
        wakicash_spent: lineup.wakicashSpent,
        events: lineup.eventPicks.map((ep) => {
          const cat = catalogByKey.get(ep.eventKey);
          const locked = isEventLocked(ep.firstMatchStartsAt ?? cat?.firstMatchStartsAt ?? null, ep.lockedAt);
          const skill = parseDivisionKey(ep.scheduleDivisionKey)?.skill_level ?? cat?.skillLevel ?? "";
          return {
            slot_index: ep.slotIndex,
            event_key: ep.eventKey,
            schedule_division_key: ep.scheduleDivisionKey,
            label:
              ep.eventLabelDisplay?.trim() ||
              displayLabelForCatalogRow({
                labelDisplay: cat?.labelDisplay ?? null,
                labelRaw: ep.eventLabelRaw,
              }),
            tier_code_at_save: ep.tierCodeAtSave,
            is_locked: locked,
            picks: ep.slots.map((s) => ({
              slot_index: s.slotIndex,
              player_name: s.playerName,
              is_captain: s.isCaptain,
              waki_cash: Math.ceil(
                playerWakiCashCost(skill, s.playerName) * Number(cat?.wakicashMultiplier ?? 1),
              ),
            })),
          };
        }),
      };
    },
  );

  typed.put(
    "/:tournament_key/lineup",
    {
      schema: {
        tags: ["fantasy-tournament"],
        params: TourneyParams,
        body: PutLineupBody,
        response: {
          200: z.object({
            tournament_key: z.enum(TOURNAMENT_KEYS),
            season_key: z.string(),
            wakicash_budget: z.number().int(),
            wakicash_spent: z.number().int(),
            events: z.array(
              z.object({
                slot_index: z.number().int(),
                event_key: z.string(),
                schedule_division_key: z.string(),
                label: z.string(),
                tier_code_at_save: z.string().nullable(),
                is_locked: z.boolean(),
                picks: z.array(
                  z.object({
                    slot_index: z.number().int(),
                    player_name: z.string(),
                    is_captain: z.boolean(),
                    waki_cash: z.number().int(),
                  }),
                ),
              }),
            ),
          }),
          400: ErrorMessage,
          401: ErrorMessage,
          409: z.object({ message: z.string(), code: z.literal("EVENT_LOCKED"), event_key: z.string() }),
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
      const { tournament_key: tournamentKey } = req.params;
      const { season_key: seasonKey, events: incoming } = req.body;

      const data = await getTournamentData(tournamentKey);
      if (!data) {
        return reply.code(503).send({ message: "Tournament schedule data is not available." } as const);
      }
      await syncTournamentEventCatalog(prisma, tournamentKey, data);

      const slotIndices = incoming.map((e) => e.slot_index);
      if (new Set(slotIndices).size !== slotIndices.length) {
        return reply.code(400).send({ message: "Duplicate slot_index in payload." } as const);
      }
      const eventKeys = incoming.map((e) => e.event_key);
      if (new Set(eventKeys).size !== eventKeys.length) {
        return reply.code(400).send({ message: "Duplicate event_key in payload." } as const);
      }

      const catalogRows = await prisma.tournamentEventCatalog.findMany({
        where: { tournamentKey },
      });
      const catalogByKey = new Map(catalogRows.map((c) => [c.eventKey, c]));

      const existing = await prisma.fantasyTournamentLineup.findUnique({
        where: { userId_tournamentKey_seasonKey: { userId: uid, tournamentKey, seasonKey } },
        include: {
          eventPicks: { include: { slots: { orderBy: { slotIndex: "asc" } } } },
        },
      });

      const existingPicks = existing?.eventPicks ?? [];
      const resultEventKeys = new Set<string>();
      for (const ex of existingPicks) {
        if (isEventLocked(ex.firstMatchStartsAt, ex.lockedAt)) {
          resultEventKeys.add(ex.eventKey);
        }
      }
      for (const inc of incoming) {
        const ex = existingPicks.find((x) => x.eventKey === inc.event_key);
        if (ex && isEventLocked(ex.firstMatchStartsAt, ex.lockedAt)) {
          if (!sameSlots(ex, inc)) {
            return reply.code(409).send({
              message: "This event is locked; picks cannot be changed.",
              code: "EVENT_LOCKED" as const,
              event_key: inc.event_key,
            });
          }
          continue;
        }
        resultEventKeys.add(inc.event_key);
      }
      if (resultEventKeys.size > 5) {
        return reply.code(400).send({
          message: "At most 5 events per tournament (including locked events you keep).",
        } as const);
      }

      for (const inc of incoming) {
        const cat = catalogByKey.get(inc.event_key);
        if (!cat) {
          return reply.code(400).send({ message: `Unknown event_key: ${inc.event_key}` } as const);
        }
        if (!cat.isSelectable) {
          return reply.code(400).send({
            message: "This event is not selectable for fantasy. Events must have at least 6 teams/players to be eligible.",
          } as const);
        }
        const divMatches = filterMatchesForDivision(data.matches, cat.scheduleDivisionKey);
        const allowed = new Set(uniquePlayersInMatches(divMatches).map(normName));
        const skill = cat.skillLevel;
        const wakiMult = Number(cat.wakicashMultiplier);
        const priced = inc.picks.map((p) => ({
          player_name: p.player_name,
          is_captain: Boolean(p.is_captain),
          waki_cash: Math.ceil(playerWakiCashCost(skill, p.player_name) * wakiMult),
        }));
        const shape = validateEventPicksShape(priced, existing?.wakicashBudget ?? 100);
        if (!shape.ok) {
          return reply.code(400).send({ message: `${inc.event_key}: ${shape.message}` } as const);
        }
        for (const p of inc.picks) {
          if (!allowed.has(normName(p.player_name))) {
            return reply.code(400).send({
              message: `Player "${p.player_name}" is not in the pool for this event.`,
            } as const);
          }
        }
      }

      const allNames = new Set<string>();
      for (const ex of existingPicks) {
        if (!isEventLocked(ex.firstMatchStartsAt, ex.lockedAt)) continue;
        for (const s of ex.slots) {
          const k = normName(s.playerName);
          if (allNames.has(k)) {
            return reply.code(400).send({
              message: "Duplicate player across tournament lineup is not allowed.",
            } as const);
          }
          allNames.add(k);
        }
      }
      for (const inc of incoming) {
        const ex = existingPicks.find((x) => x.eventKey === inc.event_key);
        if (ex && isEventLocked(ex.firstMatchStartsAt, ex.lockedAt)) {
          continue;
        }
        for (const p of inc.picks) {
          const k = normName(p.player_name);
          if (allNames.has(k)) {
            return reply.code(400).send({
              message: "Duplicate player across tournament lineup is not allowed.",
            } as const);
          }
          allNames.add(k);
        }
      }

      let totalSpend = 0;
      for (const inc of incoming) {
        const cat = catalogByKey.get(inc.event_key)!;
        const wakiMult = Number(cat.wakicashMultiplier);
        const skill = cat.skillLevel;
        for (const p of inc.picks) {
          totalSpend += Math.ceil(playerWakiCashCost(skill, p.player_name) * wakiMult);
        }
      }
      for (const ex of existingPicks) {
        if (isEventLocked(ex.firstMatchStartsAt, ex.lockedAt)) {
          const cat = catalogByKey.get(ex.eventKey);
          const skill = parseDivisionKey(ex.scheduleDivisionKey)?.skill_level ?? cat?.skillLevel ?? "";
          const mult = Number(cat?.wakicashMultiplier ?? 1);
          for (const s of ex.slots) {
            totalSpend += Math.ceil(playerWakiCashCost(skill, s.playerName) * mult);
          }
        }
      }

      const header = await prisma.fantasyTournamentLineup.upsert({
        where: { userId_tournamentKey_seasonKey: { userId: uid, tournamentKey, seasonKey } },
        create: {
          userId: uid,
          tournamentKey,
          seasonKey,
          wakicashBudget: 100,
          wakicashSpent: 0,
        },
        update: {},
      });

      const lineup = await prisma.$transaction(async (tx) => {
        const toDelete = existingPicks
          .filter((ex) => !isEventLocked(ex.firstMatchStartsAt, ex.lockedAt))
          .map((ex) => ex.id);
        if (toDelete.length) {
          await tx.fantasyTournamentEventPick.deleteMany({ where: { id: { in: toDelete } } });
        }

        const now = new Date();
        for (const inc of incoming) {
          const ex = existingPicks.find((x) => x.eventKey === inc.event_key);
          if (ex && isEventLocked(ex.firstMatchStartsAt, ex.lockedAt)) {
            continue;
          }
          const cat = catalogByKey.get(inc.event_key)!;
          const firstAt = cat.firstMatchStartsAt;
          const lockedNow = isEventLocked(firstAt, null);
          const ep = await tx.fantasyTournamentEventPick.create({
            data: {
              lineupId: header.id,
              slotIndex: inc.slot_index,
              eventKey: inc.event_key,
              eventLabelRaw: cat.labelRaw,
              eventLabelDisplay: cat.labelDisplay,
              format: cat.format,
              scheduleDivisionKey: cat.scheduleDivisionKey,
              tierCodeAtSave: cat.tierCode,
              firstMatchStartsAt: firstAt,
              lockedAt: lockedNow ? now : null,
              slots: {
                create: inc.picks.map((p, idx) => ({
                  slotIndex: idx,
                  playerName: p.player_name,
                  isCaptain: Boolean(p.is_captain),
                })),
              },
            },
          });
          if (lockedNow) {
            await tx.fantasyTournamentEventPick.update({
              where: { id: ep.id },
              data: { lockedAt: now },
            });
          }
        }

        await tx.fantasyTournamentLineup.update({
          where: { id: header.id },
          data: { wakicashSpent: totalSpend },
        });

        return tx.fantasyTournamentLineup.findUniqueOrThrow({
          where: { id: header.id },
          include: {
            eventPicks: {
              orderBy: { slotIndex: "asc" },
              include: { slots: { orderBy: { slotIndex: "asc" } } },
            },
          },
        });
      });

      const refreshedCatalog = await prisma.tournamentEventCatalog.findMany({
        where: { tournamentKey },
      });
      const catMap = new Map(refreshedCatalog.map((c) => [c.eventKey, c]));

      return {
        tournament_key: tournamentKey as TournamentKey,
        season_key: lineup.seasonKey,
        wakicash_budget: lineup.wakicashBudget,
        wakicash_spent: lineup.wakicashSpent,
        events: lineup.eventPicks.map((ep) => {
          const cat = catMap.get(ep.eventKey);
          const locked = isEventLocked(ep.firstMatchStartsAt ?? cat?.firstMatchStartsAt ?? null, ep.lockedAt);
          const skill = parseDivisionKey(ep.scheduleDivisionKey)?.skill_level ?? cat?.skillLevel ?? "";
          return {
            slot_index: ep.slotIndex,
            event_key: ep.eventKey,
            schedule_division_key: ep.scheduleDivisionKey,
            label:
              ep.eventLabelDisplay?.trim() ||
              displayLabelForCatalogRow({
                labelDisplay: cat?.labelDisplay ?? null,
                labelRaw: ep.eventLabelRaw,
              }),
            tier_code_at_save: ep.tierCodeAtSave,
            is_locked: locked,
            picks: ep.slots.map((s) => ({
              slot_index: s.slotIndex,
              player_name: s.playerName,
              is_captain: s.isCaptain,
              waki_cash: Math.ceil(
                playerWakiCashCost(skill, s.playerName) * Number(cat?.wakicashMultiplier ?? 1),
              ),
            })),
          };
        }),
      };
    },
  );
};
