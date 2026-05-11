import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import {
  AVP_2026_EVENTS,
  AVP_2026_SEASON_YEAR,
  AVP_HUNTINGTON_BEACH_OPEN_EVENT_KEY,
  AVP_SOUTH_BEACH_MAY_OPEN_EVENT_KEY,
  avpRegisteredTeamPoolForEvent,
} from "@wakibet/shared";
import { prisma } from "../lib/prisma.js";
import { requireAuthUser } from "../lib/requireAuthUser.js";
import {
  type AvpAthleteProfile,
  athleteProfileForRosterName,
  loadAvpSouthBeachAthleteMap,
} from "../sports/volleyball/lib/loadAvpSouthBeachAthletesCsv.js";
import { loadHuntingtonBeachOpenTeamPool } from "../sports/volleyball/lib/loadAvpHuntingtonBeachOpenData.js";

const AvpEventSchema = z.object({
  event_key: z.string(),
  category: z.enum(["league", "heritage", "contender"]),
  name: z.string(),
  location: z.string(),
  start_date: z.string(),
  end_date: z.string(),
});

const AvpAthleteProfileSchema = z.object({
  player: z.string(),
  position: z.string(),
  height: z.string(),
  location: z.string(),
  usual_side: z.string(),
  usual_defense: z.string(),
});

const AvpTeamSchema = z.object({
  team_key: z.string(),
  division_code: z.enum([
    "mens_aa",
    "mens_aaa",
    "mens_open",
    "womens_aa",
    "womens_aaa",
    "womens_open",
    "heritage_mens",
    "heritage_womens",
  ]),
  division_label: z.string(),
  player_one: z.string(),
  player_two: z.string(),
  team_label: z.string(),
  player_one_profile: AvpAthleteProfileSchema.nullable(),
  player_two_profile: AvpAthleteProfileSchema.nullable(),
});

const EventKeyQuery = z.object({
  event_key: z.string().min(1),
});

const VolleyballPickSchema = z.object({
  player_name: z.string().min(1),
  is_captain: z.boolean().optional(),
});

const VolleyballSaveLineupBody = z.object({
  event_key: z.string().min(1),
  picks: z.array(VolleyballPickSchema).length(5),
});

const VOLLEYBALL_TOURNAMENT_KEY = "volleyball_avp_2026";
const VOLLEYBALL_SEASON_KEY = "volleyball_2026";
const VOLLEYBALL_CAP = 100;
const authPre = { preHandler: [requireAuthUser] };
const TEAM_POOL_CACHE_TTL_MS = 5 * 60 * 1000;
const teamPoolCache = new Map<
  string,
  {
    expiresAt: number;
    pool: Awaited<ReturnType<typeof resolveTeamPoolAndAthletes>>["pool"];
    athleteMap: Map<string, AvpAthleteProfile>;
  }
>();

function stableHash(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i += 1) h = (h * 31 + input.charCodeAt(i)) >>> 0;
  return h;
}

function wakiCashForVolleyballPlayer(name: string, eventKey: string): number {
  const roll = stableHash(`${eventKey}:${name}`) % 100;
  if (roll >= 92) return 47 + (roll % 4);
  if (roll >= 70) return 30 + (roll % 8);
  if (roll >= 35) return 18 + (roll % 10);
  return 8 + (roll % 9);
}

function volleyballEventSlotIndex(eventKey: string): number {
  const i = AVP_2026_EVENTS.findIndex((e) => e.event_key === eventKey);
  return i >= 0 ? i : 0;
}

async function resolveTeamPoolAndAthletes(event_key: string): Promise<{
  pool: { title: string; teams: ReturnType<typeof avpRegisteredTeamPoolForEvent> extends infer R ? (R extends { teams: infer T } ? T : never) : never };
  athleteMap: Map<string, AvpAthleteProfile>;
}> {
  const cached = teamPoolCache.get(event_key);
  if (cached && Date.now() < cached.expiresAt) {
    return { pool: cached.pool, athleteMap: cached.athleteMap };
  }

  let pool = avpRegisteredTeamPoolForEvent(event_key);
  let athleteMap = new Map<string, AvpAthleteProfile>();

  if (!pool && event_key === AVP_HUNTINGTON_BEACH_OPEN_EVENT_KEY) {
    const hb = await loadHuntingtonBeachOpenTeamPool();
    pool = { title: hb.title, teams: hb.teams };
    athleteMap = hb.athleteMap;
  } else if (event_key === AVP_SOUTH_BEACH_MAY_OPEN_EVENT_KEY) {
    athleteMap = await loadAvpSouthBeachAthleteMap();
  }
  if (!pool) throw new Error(`No registered team list for event_key: ${event_key}`);
  const resolved = { pool: pool as NonNullable<typeof pool>, athleteMap };
  teamPoolCache.set(event_key, {
    ...resolved,
    expiresAt: Date.now() + TEAM_POOL_CACHE_TTL_MS,
  });
  return resolved;
}

function estimatedAmericanOddsFromWakiCash(wc: number): number {
  const p = Math.max(0.05, Math.min(0.95, wc / 60));
  if (p >= 0.5) return -Math.round((100 * p) / (1 - p));
  return Math.round((100 * (1 - p)) / p);
}

export const volleyballRoutes: FastifyPluginAsync = async (app) => {
  const typed = app.withTypeProvider<ZodTypeProvider>();

  typed.get(
    "/status",
    {
      schema: {
        tags: ["volleyball"],
        response: {
          200: z.object({
            sport: z.literal("volleyball"),
            season_year: z.number().int(),
            event_count: z.number().int(),
            fantasy_enabled: z.boolean(),
            message: z.string(),
          }),
        },
      },
    },
    async () => ({
      sport: "volleyball" as const,
      season_year: AVP_2026_SEASON_YEAR,
      event_count: AVP_2026_EVENTS.length,
      fantasy_enabled: false,
      message:
        "AVP 2026 schedule is live. Player pool and WakiPoints scoring will ship next — same fantasy flow as pickleball (WakiCash lineups, captains, season leaderboard).",
    }),
  );

  typed.get(
    "/schedule",
    {
      schema: {
        tags: ["volleyball"],
        response: {
          200: z.object({
            sport: z.literal("volleyball"),
            season_year: z.number().int(),
            events: z.array(AvpEventSchema),
            schedule_notes: z.array(z.string()),
          }),
        },
      },
    },
    async () => {
      return {
        sport: "volleyball" as const,
        season_year: AVP_2026_SEASON_YEAR,
        events: AVP_2026_EVENTS,
        schedule_notes: [
          "League, Heritage, and Contender stops can share the same calendar weekend — fantasy slates still target one official stop at a time.",
          "Examples: AVP League Week 2 (Aspen, Jun 6–7) overlaps Virginia Beach Open (Jun 6–7); League Championship (Chicago, Sep 5–6) overlaps Motherlode (Aspen, Sep 5–7).",
        ],
      };
    },
  );

  typed.get(
    "/teams",
    {
      schema: {
        tags: ["volleyball"],
        querystring: EventKeyQuery,
        response: {
          200: z.object({
            sport: z.literal("volleyball"),
            season_year: z.number().int(),
            event_key: z.string(),
            pool_title: z.string(),
            team_count: z.number().int(),
            athletes_csv_row_count: z.number().int(),
            roster_players_missing_profile: z.array(z.string()),
            teams: z.array(AvpTeamSchema),
          }),
          404: z.object({ message: z.string() }),
        },
      },
    },
    async (req, reply) => {
      const { event_key } = req.query;
      let resolved: Awaited<ReturnType<typeof resolveTeamPoolAndAthletes>>;
      try {
        resolved = await resolveTeamPoolAndAthletes(event_key);
      } catch {
        return reply.code(404).send({ message: `No registered team list for event_key: ${event_key}` } as const);
      }
      const { pool, athleteMap } = resolved;
      const missing = new Set<string>();

      const teams = pool.teams.map((t) => {
        const p1 = t.player_one.trim();
        const p2 = t.player_two.trim();
        const pr1 = p1 ? athleteProfileForRosterName(athleteMap, p1) : null;
        const pr2 = p2 ? athleteProfileForRosterName(athleteMap, p2) : null;
        if (p1 && !pr1) missing.add(p1);
        if (p2 && !pr2) missing.add(p2);
        return {
          ...t,
          player_one_profile: pr1,
          player_two_profile: pr2,
        };
      });

      return {
        sport: "volleyball" as const,
        season_year: AVP_2026_SEASON_YEAR,
        event_key,
        pool_title: pool.title,
        team_count: pool.teams.length,
        athletes_csv_row_count: athleteMap.size,
        roster_players_missing_profile: [...missing].sort((a, b) => a.localeCompare(b)),
        teams,
      };
    },
  );

  typed.get(
    "/player-pool",
    {
      schema: {
        tags: ["volleyball"],
        querystring: EventKeyQuery,
        response: {
          200: z.object({
            event_key: z.string(),
            player_count: z.number().int(),
            salary_cap: z.number().int(),
            players: z.array(
              z.object({
                player_name: z.string(),
                waki_cash: z.number().int(),
                estimated_odds: z.number().int(),
              }),
            ),
          }),
          404: z.object({ message: z.string() }),
        },
      },
    },
    async (req, reply) => {
      const { event_key } = req.query;
      let pool: Awaited<ReturnType<typeof resolveTeamPoolAndAthletes>>["pool"];
      try {
        ({ pool } = await resolveTeamPoolAndAthletes(event_key));
      } catch {
        return reply.code(404).send({ message: `No registered team list for event_key: ${event_key}` } as const);
      }
      const names = new Set<string>();
      for (const t of pool.teams) {
        const p1 = t.player_one.trim();
        const p2 = t.player_two.trim();
        if (p1) names.add(p1);
        if (p2) names.add(p2);
      }
      const players = [...names]
        .sort((a, b) => a.localeCompare(b))
        .map((player_name) => {
          const waki_cash = wakiCashForVolleyballPlayer(player_name, event_key);
          return {
            player_name,
            waki_cash,
            estimated_odds: estimatedAmericanOddsFromWakiCash(waki_cash),
          };
        });
      return {
        event_key,
        player_count: players.length,
        salary_cap: VOLLEYBALL_CAP,
        players,
      };
    },
  );

  typed.get(
    "/lineup",
    {
      ...authPre,
      schema: {
        tags: ["volleyball"],
        querystring: EventKeyQuery,
        response: {
          200: z.object({
            event_key: z.string(),
            picks: z.array(
              z.object({
                slot_index: z.number().int(),
                player_name: z.string(),
                is_captain: z.boolean(),
                waki_cash: z.number().int(),
              }),
            ),
            total_salary: z.number().int(),
            salary_cap: z.number().int(),
          }),
        },
      },
    },
    async (req) => {
      const uid = req.authUser!.id;
      const { event_key } = req.query;
      const lineup = await prisma.fantasyTournamentLineup.findUnique({
        where: {
          userId_tournamentKey_seasonKey: {
            userId: uid,
            tournamentKey: VOLLEYBALL_TOURNAMENT_KEY,
            seasonKey: VOLLEYBALL_SEASON_KEY,
          },
        },
        include: {
          eventPicks: {
            where: { eventKey: event_key },
            include: { slots: { orderBy: { slotIndex: "asc" } } },
            take: 1,
          },
        },
      });
      const eventPick = lineup?.eventPicks[0];
      const picks =
        eventPick?.slots.map((s) => ({
          slot_index: s.slotIndex,
          player_name: s.playerName,
          is_captain: s.isCaptain,
          waki_cash: wakiCashForVolleyballPlayer(s.playerName, event_key),
        })) ?? [];
      const total_salary = picks.reduce((sum, p) => sum + p.waki_cash, 0);
      return { event_key, picks, total_salary, salary_cap: VOLLEYBALL_CAP };
    },
  );

  typed.put(
    "/lineup",
    {
      ...authPre,
      schema: {
        tags: ["volleyball"],
        body: VolleyballSaveLineupBody,
        response: {
          200: z.object({
            event_key: z.string(),
            picks: z.array(
              z.object({
                slot_index: z.number().int(),
                player_name: z.string(),
                is_captain: z.boolean(),
                waki_cash: z.number().int(),
              }),
            ),
            total_salary: z.number().int(),
            salary_cap: z.number().int(),
          }),
          400: z.object({ message: z.string() }),
        },
      },
    },
    async (req, reply) => {
      const uid = req.authUser!.id;
      const { event_key, picks } = req.body;
      const eventMeta = AVP_2026_EVENTS.find((e) => e.event_key === event_key);
      if (!eventMeta) return reply.code(400).send({ message: "Unknown volleyball event key." } as const);
      const eventStartMs = Date.parse(`${eventMeta.start_date}T00:00:00Z`);
      if (Number.isFinite(eventStartMs) && Date.now() >= eventStartMs) {
        return reply.code(400).send({ message: "Event is locked. Lineups cannot be edited after start." } as const);
      }

      let pool: Awaited<ReturnType<typeof resolveTeamPoolAndAthletes>>["pool"];
      try {
        ({ pool } = await resolveTeamPoolAndAthletes(event_key));
      } catch {
        return reply.code(400).send({ message: "Could not load players for this event." } as const);
      }

      const names = picks.map((p) => p.player_name.trim()).filter(Boolean);
      if (names.length !== 5) return reply.code(400).send({ message: "Exactly 5 picks are required." } as const);
      if (new Set(names.map((n) => n.toLowerCase())).size !== names.length) {
        return reply.code(400).send({ message: "Duplicate players are not allowed." } as const);
      }
      const captains = picks.filter((p) => Boolean(p.is_captain));
      if (captains.length !== 1) return reply.code(400).send({ message: "Choose exactly one captain." } as const);

      const playerPool = new Set<string>();
      for (const t of pool.teams) {
        if (t.player_one.trim()) playerPool.add(t.player_one.trim());
        if (t.player_two.trim()) playerPool.add(t.player_two.trim());
      }
      for (const n of names) {
        if (!playerPool.has(n)) {
          return reply.code(400).send({ message: `Player is not in this event pool: ${n}` } as const);
        }
      }

      const picksOut = picks.map((p, i) => ({
        slot_index: i,
        player_name: p.player_name.trim(),
        is_captain: Boolean(p.is_captain),
        waki_cash: wakiCashForVolleyballPlayer(p.player_name.trim(), event_key),
      }));
      const total_salary = picksOut.reduce((sum, p) => sum + p.waki_cash, 0);
      if (total_salary > VOLLEYBALL_CAP) {
        return reply.code(400).send({ message: `Lineup exceeds ${VOLLEYBALL_CAP} Waki Cash.` } as const);
      }

      await prisma.$transaction(async (tx) => {
        const lineup = await tx.fantasyTournamentLineup.upsert({
          where: {
            userId_tournamentKey_seasonKey: {
              userId: uid,
              tournamentKey: VOLLEYBALL_TOURNAMENT_KEY,
              seasonKey: VOLLEYBALL_SEASON_KEY,
            },
          },
          create: {
            userId: uid,
            tournamentKey: VOLLEYBALL_TOURNAMENT_KEY,
            seasonKey: VOLLEYBALL_SEASON_KEY,
            wakicashBudget: VOLLEYBALL_CAP,
            wakicashSpent: total_salary,
            status: "active",
          },
          update: {
            wakicashBudget: VOLLEYBALL_CAP,
            wakicashSpent: total_salary,
            status: "active",
          },
        });
        const eventPick = await tx.fantasyTournamentEventPick.upsert({
          where: { lineupId_eventKey: { lineupId: lineup.id, eventKey: event_key } },
          create: {
            lineupId: lineup.id,
            slotIndex: volleyballEventSlotIndex(event_key),
            eventKey: event_key,
            eventLabelRaw: eventMeta.name,
            eventLabelDisplay: eventMeta.name,
            format: "volleyball",
            scheduleDivisionKey: event_key,
          },
          update: {
            eventLabelRaw: eventMeta.name,
            eventLabelDisplay: eventMeta.name,
            format: "volleyball",
            scheduleDivisionKey: event_key,
          },
        });
        await tx.fantasyTournamentEventPickSlot.deleteMany({ where: { eventPickId: eventPick.id } });
        await tx.fantasyTournamentEventPickSlot.createMany({
          data: picksOut.map((p) => ({
            eventPickId: eventPick.id,
            slotIndex: p.slot_index,
            playerName: p.player_name,
            isCaptain: p.is_captain,
          })),
        });
      });

      return { event_key, picks: picksOut, total_salary, salary_cap: VOLLEYBALL_CAP };
    },
  );

  typed.get(
    "/season-leaderboard",
    {
      ...authPre,
      schema: {
        tags: ["volleyball"],
        response: {
          200: z.object({
            sport: z.literal("volleyball"),
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
          401: z.object({ message: z.string() }),
        },
      },
    },
    async (req) => {
      const userId = req.authUser!.id;
      const lineups = await prisma.fantasyTournamentLineup.findMany({
        where: {
          tournamentKey: VOLLEYBALL_TOURNAMENT_KEY,
          seasonKey: VOLLEYBALL_SEASON_KEY,
        },
        include: {
          user: { select: { id: true, displayName: true, username: true } },
          eventPicks: { include: { slots: { select: { id: true } } } },
        },
      });
      const ranked = lineups
        .map((l) => {
          const slotCount = l.eventPicks.reduce((s, ev) => s + ev.slots.length, 0);
          return {
            user_id: l.userId,
            display_name: l.user.displayName || l.user.username || "Player",
            points: slotCount,
          };
        })
        .filter((r) => r.points > 0)
        .sort((a, b) => b.points - a.points)
        .map((r, i) => ({ ...r, rank: i + 1 }));
      const total_players = ranked.length;
      const rows = ranked.slice(0, 100).map((r) => ({
        rank: r.rank,
        display_name: r.display_name,
        points: r.points,
        is_me: r.user_id === userId,
      }));
      return { sport: "volleyball" as const, total_players, rows };
    },
  );

  typed.get(
    "/lineups",
    {
      ...authPre,
      schema: {
        tags: ["volleyball"],
        response: {
          200: z.object({
            rows: z.array(
              z.object({
                event_key: z.string(),
                event_name: z.string(),
                picks: z.array(
                  z.object({
                    slot_index: z.number().int(),
                    player_name: z.string(),
                    is_captain: z.boolean(),
                    waki_cash: z.number().int(),
                  }),
                ),
                total_salary: z.number().int(),
                salary_cap: z.number().int(),
                updated_at: z.string(),
              }),
            ),
          }),
        },
      },
    },
    async (req) => {
      const uid = req.authUser!.id;
      const lineup = await prisma.fantasyTournamentLineup.findUnique({
        where: {
          userId_tournamentKey_seasonKey: {
            userId: uid,
            tournamentKey: VOLLEYBALL_TOURNAMENT_KEY,
            seasonKey: VOLLEYBALL_SEASON_KEY,
          },
        },
        include: {
          eventPicks: {
            orderBy: { slotIndex: "asc" },
            include: { slots: { orderBy: { slotIndex: "asc" } } },
          },
        },
      });
      const rows = (lineup?.eventPicks ?? []).map((ev) => {
        const picks = ev.slots.map((s) => ({
          slot_index: s.slotIndex,
          player_name: s.playerName,
          is_captain: s.isCaptain,
          waki_cash: wakiCashForVolleyballPlayer(s.playerName, ev.eventKey),
        }));
        const total_salary = picks.reduce((sum, p) => sum + p.waki_cash, 0);
        return {
          event_key: ev.eventKey,
          event_name: ev.eventLabelDisplay || ev.eventLabelRaw || ev.eventKey,
          picks,
          total_salary,
          salary_cap: VOLLEYBALL_CAP,
          updated_at: ev.updatedAt.toISOString(),
        };
      });
      return { rows };
    },
  );
};
