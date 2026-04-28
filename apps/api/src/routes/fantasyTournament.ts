import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { playerWakiCashCost, WINTER_FANTASY_ROSTER_SIZE } from "@wakibet/shared";
import { prisma } from "../lib/prisma.js";
import { requireAuthUser } from "../lib/requireAuthUser.js";
import {
  displayLabelForCatalogRow,
  filterMatchesForDivision,
  getTournamentData,
  parseDivisionKey,
  ROSTER_EDIT_LOCK_MS,
  syncTournamentEventCatalog,
  TOURNAMENT_KEYS,
  uniquePlayersInMatches,
  type TournamentKey,
} from "../sports/pickleball/lib/index.js";
import { getMlpDallasPlayers, isMlpTournament } from "../lib/mlpTournamentData.js";

const ErrorMessage = z.object({ message: z.string() });

const authPre = { preHandler: [requireAuthUser] };

type RosterRules = {
  rosterSize: number;
  budget: number;
  requiredMen: number | null;
  requiredWomen: number | null;
};

type PoolPlayer = {
  player_name: string;
  waki_cash: number;
  gender?: "M" | "F";
  tier?: "S+" | "S" | "A" | "B" | "C" | "D";
};

function rosterRulesForTournament(tournamentKey: TournamentKey): RosterRules {
  if (isMlpTournament(tournamentKey)) {
    return { rosterSize: 4, budget: 100, requiredMen: 2, requiredWomen: 2 };
  }
  return { rosterSize: WINTER_FANTASY_ROSTER_SIZE, budget: 100, requiredMen: null, requiredWomen: null };
}

async function playerPoolForEvent(
  tournamentKey: TournamentKey,
  scheduleDivisionKey: string,
  data: { matches: { player_a: string; player_b: string }[] } | null,
): Promise<PoolPlayer[]> {
  if (isMlpTournament(tournamentKey)) {
    const rows = await getMlpDallasPlayers();
    return rows.map((r) => ({
      player_name: r.player_name,
      waki_cash: r.waki_cash,
      gender: r.gender,
      tier: r.tier,
    }));
  }
  if (!data) return [];
  const ms = filterMatchesForDivision(data.matches as never[], scheduleDivisionKey);
  const skill = parseDivisionKey(scheduleDivisionKey)?.skill_level ?? "";
  return uniquePlayersInMatches(ms).map((player_name) => ({
    player_name,
    waki_cash: playerWakiCashCost(skill, player_name),
  }));
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
  rosterSize: number,
): { ok: true } | { ok: false; message: string } {
  if (picks.length !== rosterSize) {
    return { ok: false, message: `Exactly ${rosterSize} picks per event.` };
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
  picks: z.array(PickIn).min(1).max(8),
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
      ...authPre,
      schema: {
        tags: ["fantasy-tournament"],
        params: TourneyParams,
        response: {
          200: z.object({
            tournament_key: z.enum(TOURNAMENT_KEYS),
            tournament_name: z.string(),
            roster_size: z.number().int(),
            required_men: z.number().int().nullable(),
            required_women: z.number().int().nullable(),
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
      const { tournament_key: tournamentKey } = req.params;
      const rules = rosterRulesForTournament(tournamentKey);
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
        roster_size: rules.rosterSize,
        required_men: rules.requiredMen,
        required_women: rules.requiredWomen,
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
      ...authPre,
      schema: {
        tags: ["fantasy-tournament"],
        params: TourneyParams,
        querystring: z.object({ season_key: z.string().optional().default("") }),
        response: {
          200: z.object({
            tournament_key: z.enum(TOURNAMENT_KEYS),
            season_key: z.string(),
            roster_size: z.number().int(),
            required_men: z.number().int().nullable(),
            required_women: z.number().int().nullable(),
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
      const uid = req.authUser!.id;
      const { tournament_key: tournamentKey } = req.params;
      const rules = rosterRulesForTournament(tournamentKey);
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
          wakicashBudget: rules.budget,
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
      const pools = await Promise.all(
        catalogRows.map(async (c) => [c.eventKey, await playerPoolForEvent(tournamentKey, c.scheduleDivisionKey, data)] as const),
      );
      const poolByEvent = new Map(pools);

      return {
        tournament_key: tournamentKey as TournamentKey,
        season_key: lineup.seasonKey,
        roster_size: rules.rosterSize,
        required_men: rules.requiredMen,
        required_women: rules.requiredWomen,
        wakicash_budget: lineup.wakicashBudget,
        wakicash_spent: lineup.wakicashSpent,
        events: lineup.eventPicks.map((ep) => {
          const cat = catalogByKey.get(ep.eventKey);
          const locked = isEventLocked(ep.firstMatchStartsAt ?? cat?.firstMatchStartsAt ?? null, ep.lockedAt);
          const costMap = new Map((poolByEvent.get(ep.eventKey) ?? []).map((p) => [normName(p.player_name), p.waki_cash]));
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
              waki_cash: costMap.get(normName(s.playerName)) ?? 0,
            })),
          };
        }),
      };
    },
  );

  typed.put(
    "/:tournament_key/lineup",
    {
      ...authPre,
      schema: {
        tags: ["fantasy-tournament"],
        params: TourneyParams,
        body: PutLineupBody,
        response: {
          200: z.object({
            tournament_key: z.enum(TOURNAMENT_KEYS),
            season_key: z.string(),
            roster_size: z.number().int(),
            required_men: z.number().int().nullable(),
            required_women: z.number().int().nullable(),
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
      const uid = req.authUser!.id;
      const { tournament_key: tournamentKey } = req.params;
      const rules = rosterRulesForTournament(tournamentKey);
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
        const pool = await playerPoolForEvent(tournamentKey, cat.scheduleDivisionKey, data);
        const allowed = new Map(pool.map((p) => [normName(p.player_name), p]));
        const priced = inc.picks.map((p) => {
          const row = allowed.get(normName(p.player_name));
          return {
            player_name: p.player_name,
            is_captain: Boolean(p.is_captain),
            waki_cash: row?.waki_cash ?? 0,
            gender: row?.gender,
          };
        });
        const shape = validateEventPicksShape(priced, existing?.wakicashBudget ?? rules.budget, rules.rosterSize);
        if (!shape.ok) {
          return reply.code(400).send({ message: `${inc.event_key}: ${shape.message}` } as const);
        }
        if (rules.requiredMen != null || rules.requiredWomen != null) {
          const men = priced.filter((p) => p.gender === "M").length;
          const women = priced.filter((p) => p.gender === "F").length;
          if (rules.requiredMen != null && men !== rules.requiredMen) {
            return reply.code(400).send({
              message: `${inc.event_key}: lineup must include exactly ${rules.requiredMen} men.`,
            } as const);
          }
          if (rules.requiredWomen != null && women !== rules.requiredWomen) {
            return reply.code(400).send({
              message: `${inc.event_key}: lineup must include exactly ${rules.requiredWomen} women.`,
            } as const);
          }
        }
        for (const p of inc.picks) {
          if (!allowed.has(normName(p.player_name))) {
            return reply.code(400).send({
              message: `Player "${p.player_name}" is not in the pool for this event.`,
            } as const);
          }
        }
      }

      let totalSpend = 0;
      for (const inc of incoming) {
        const cat = catalogByKey.get(inc.event_key)!;
        const pool = await playerPoolForEvent(tournamentKey, cat.scheduleDivisionKey, data);
        const costMap = new Map(pool.map((p) => [normName(p.player_name), p.waki_cash]));
        for (const p of inc.picks) {
          totalSpend += costMap.get(normName(p.player_name)) ?? 0;
        }
      }
      for (const ex of existingPicks) {
        if (isEventLocked(ex.firstMatchStartsAt, ex.lockedAt)) {
          const pool = await playerPoolForEvent(tournamentKey, ex.scheduleDivisionKey, data);
          const costMap = new Map(pool.map((p) => [normName(p.player_name), p.waki_cash]));
          for (const s of ex.slots) {
            totalSpend += costMap.get(normName(s.playerName)) ?? 0;
          }
        }
      }

      const header = await prisma.fantasyTournamentLineup.upsert({
        where: { userId_tournamentKey_seasonKey: { userId: uid, tournamentKey, seasonKey } },
        create: {
          userId: uid,
          tournamentKey,
          seasonKey,
          wakicashBudget: rules.budget,
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
      const pools = await Promise.all(
        refreshedCatalog.map(async (c) => [
          c.eventKey,
          new Map(
            (await playerPoolForEvent(tournamentKey, c.scheduleDivisionKey, data)).map((p) => [
              normName(p.player_name),
              p.waki_cash,
            ]),
          ),
        ] as const),
      );
      const poolByEvent = new Map(pools);

      return {
        tournament_key: tournamentKey as TournamentKey,
        season_key: lineup.seasonKey,
        roster_size: rules.rosterSize,
        required_men: rules.requiredMen,
        required_women: rules.requiredWomen,
        wakicash_budget: lineup.wakicashBudget,
        wakicash_spent: lineup.wakicashSpent,
        events: lineup.eventPicks.map((ep) => {
          const cat = catMap.get(ep.eventKey);
          const locked = isEventLocked(ep.firstMatchStartsAt ?? cat?.firstMatchStartsAt ?? null, ep.lockedAt);
          const costMap = poolByEvent.get(ep.eventKey);
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
              waki_cash: costMap?.get(normName(s.playerName)) ?? 0,
            })),
          };
        }),
      };
    },
  );
};
