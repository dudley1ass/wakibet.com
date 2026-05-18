import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import {
  AVP_2026_EVENTS,
  AVP_SOUTH_BEACH_MAY_OPEN_EVENT_KEY,
  avpRegisteredTeamPoolForEvent,
  MLP_FANTASY_REQUIRED_MEN,
  MLP_FANTASY_REQUIRED_WOMEN,
  MLP_FANTASY_ROSTER_SIZE,
  playerWakiCashCost,
  scoreWinterPlayerFromMatches,
  type WinterJsonMatch,
  WAKICASH_BUDGET_PER_LINEUP,
  WINTER_FANTASY_ROSTER_SIZE,
  WSOP_SITE_TOP_50_PLAYERS,
} from "@wakibet/shared";
import { Prisma, prisma } from "../lib/prisma.js";
import { createKeyedMutex } from "../lib/asyncMutex.js";
import { HttpReplyError } from "../lib/httpReplyError.js";
import { buildDemoExpertLineup } from "../lib/demoExpertLineup.js";
import { pickleballDemoWakiCashFromRating } from "../lib/pickleballSkillRatings.js";
import { optionalAuthUser } from "../lib/optionalAuthUser.js";
import { requireAuthUser } from "../lib/requireAuthUser.js";

const fantasyLineupSaveMutex = createKeyedMutex();
import {
  displayLabelForCatalogRow,
  divisionKeyFromMatch,
  filterMatchesForDivision,
  getTournamentData,
  parseDivisionKey,
  ROSTER_EDIT_LOCK_MS,
  syncTournamentEventCatalog,
  TOURNAMENT_KEYS_ENUM,
  uniquePlayersInMatches,
  type TournamentKey,
} from "../sports/pickleball/lib/index.js";
import { getMlpPlayersForTournament, isMlpTournament } from "../lib/mlpTournamentData.js";

const ErrorMessage = z.object({ message: z.string() });

const authPre = { preHandler: [requireAuthUser] };
const optionalAuthPre = { preHandler: [optionalAuthUser] };

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
    return {
      rosterSize: MLP_FANTASY_ROSTER_SIZE,
      budget: 100,
      requiredMen: MLP_FANTASY_REQUIRED_MEN,
      requiredWomen: MLP_FANTASY_REQUIRED_WOMEN,
    };
  }
  return { rosterSize: WINTER_FANTASY_ROSTER_SIZE, budget: 100, requiredMen: null, requiredWomen: null };
}

async function playerPoolForEvent(
  tournamentKey: TournamentKey,
  scheduleDivisionKey: string,
  data: { matches: { player_a: string; player_b: string }[] } | null,
): Promise<PoolPlayer[]> {
  if (isMlpTournament(tournamentKey)) {
    const rows = await getMlpPlayersForTournament(tournamentKey);
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

function isAtlantaProMainDrawRow(params: { tournamentKey: TournamentKey; eventType: string }): boolean {
  if (params.tournamentKey !== "atlanta_weekend") return true;
  return params.eventType.toLowerCase().includes("pro main draw");
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

function normTeamStr(s: string | null | undefined): string {
  return (s ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

function isCompositePlayerName(name: string): boolean {
  return name.includes(" / ");
}

function demoDisplayName(name: string): string {
  const parts = name.split(",").map((p) => p.trim());
  if (parts.length === 2 && parts[0] && parts[1]) return `${parts[1]} ${parts[0]}`;
  return name;
}

type DemoSport = "pickleball" | "lacrosse" | "volleyball" | "poker";

type DemoContest = {
  tournament_key: string;
  tournament_name: string;
  roster_size: number;
  salary_cap: number;
  players: Array<{
    player_name: string;
    display_name: string;
    projected_points: number;
    waki_cash: number;
    last_event_label: string;
  }>;
};

/** Bucketed WakiCash price by rank within the top-18 demo pool. Designed so
 *  five picks must trade off elite vs. value to fit under the 100 cap. */
function demoCostByRank(rank: number): number {
  if (rank < 4) return 32;
  if (rank < 8) return 24;
  if (rank < 12) return 18;
  if (rank < 16) return 12;
  return 8;
}


async function buildPickleballDemoContest(): Promise<DemoContest | null> {
  const tournamentKey: TournamentKey = "atlanta_weekend";
  const data = await getTournamentData(tournamentKey);
  if (!data) return null;

  const completedMatches = (data.matches as WinterJsonMatch[]).filter((m) => {
    return (
      m.event_type.toLowerCase().includes("pro main draw") &&
      Boolean(m.winner)
    );
  });

  const divisions = new Map<string, typeof completedMatches>();
  for (const match of completedMatches) {
    const key = divisionKeyFromMatch(match);
    const rows = divisions.get(key);
    if (rows) rows.push(match);
    else divisions.set(key, [match]);
  }

  const pointsByPlayer = new Map<string, { points: number; eventLabel: string }>();
  for (const matches of divisions.values()) {
    const names = uniquePlayersInMatches(matches).filter((name) => !isCompositePlayerName(name));
    for (const playerName of names) {
      const scored = scoreWinterPlayerFromMatches(playerName, matches).total;
      if (scored <= 0) continue;
      const current = pointsByPlayer.get(playerName) ?? {
        points: 0,
        eventLabel: matches[0]?.event_type ?? "Pro Main Draw",
      };
      pointsByPlayer.set(playerName, {
        points: Math.round((current.points + scored) * 100) / 100,
        eventLabel: current.eventLabel,
      });
    }
  }

  const players = [...pointsByPlayer.entries()]
    .map(([player_name, row]) => ({
      player_name,
      display_name: demoDisplayName(player_name),
      projected_points: row.points,
      last_event_label: row.eventLabel,
      waki_cash: pickleballDemoWakiCashFromRating(player_name),
    }))
    .sort((a, b) => b.projected_points - a.projected_points || a.display_name.localeCompare(b.display_name))
    .slice(0, 18);

  return {
    tournament_key: tournamentKey,
    tournament_name: data.summary.tournament_name,
    roster_size: 5,
    salary_cap: WAKICASH_BUDGET_PER_LINEUP,
    players,
  };
}

async function readPllStatsCsvForDemo(): Promise<string | null> {
  const envRaw = process.env.PLL_PLAYER_STATS_CSV?.trim();
  const moduleDir = path.dirname(fileURLToPath(import.meta.url));
  const candidates = [
    envRaw ? (path.isAbsolute(envRaw) ? envRaw : path.resolve(process.cwd(), envRaw)) : null,
    path.resolve(moduleDir, "../../data/pll-player-stats.csv"),
    path.resolve(process.cwd(), "data/pll-player-stats.csv"),
    path.resolve(process.cwd(), "apps/api/data/pll-player-stats.csv"),
  ].filter((p): p is string => Boolean(p));
  for (const csvPath of candidates) {
    try {
      return await fs.readFile(csvPath, "utf8");
    } catch {
      continue;
    }
  }
  return null;
}

async function buildLacrosseDemoContest(): Promise<DemoContest | null> {
  const raw = await readPllStatsCsvForDemo();
  if (!raw) return null;
  const lines = raw.trim().split(/\r?\n/);
  if (lines.length < 2) return null;
  const head = lines[0]!.split(",");
  const idx = new Map(head.map((h, i) => [h.trim(), i]));
  const gi = (row: string[], k: string): string => row[idx.get(k) ?? -1] ?? "";
  const num = (row: string[], k: string): number => {
    const n = Number(gi(row, k));
    return Number.isFinite(n) ? n : 0;
  };
  type Row = { firstName: string; lastName: string; team: string; points: number };
  const rows: Row[] = [];
  for (const line of lines.slice(1)) {
    const cols = line.split(",");
    const first = gi(cols, "First Name").trim();
    const last = gi(cols, "Last Name").trim();
    if (!first && !last) continue;
    rows.push({
      firstName: first,
      lastName: last,
      team: gi(cols, "Team"),
      points: num(cols, "Points"),
    });
  }
  const players = rows
    .filter((r) => r.points > 0)
    .sort((a, b) => b.points - a.points)
    .slice(0, 18)
    .map((r, index) => {
      const name = `${r.firstName} ${r.lastName}`.trim();
      return {
        player_name: name,
        display_name: name,
        projected_points: r.points,
        waki_cash: demoCostByRank(index),
        last_event_label: r.team ? `PLL · ${r.team}` : "PLL · 2026 season",
      };
    });
  if (players.length === 0) return null;
  return {
    tournament_key: "pll_2026_season",
    tournament_name: "PLL 2026 — Season points",
    roster_size: 5,
    salary_cap: WAKICASH_BUDGET_PER_LINEUP,
    players,
  };
}

function stableHashForDemo(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i += 1) h = (h * 31 + input.charCodeAt(i)) >>> 0;
  return h;
}

function demoWakiCashForVolleyballPlayer(name: string, eventKey: string): number {
  const roll = stableHashForDemo(`${eventKey}:${name}`) % 100;
  if (roll >= 92) return 47 + (roll % 4);
  if (roll >= 70) return 30 + (roll % 8);
  if (roll >= 35) return 18 + (roll % 10);
  return 8 + (roll % 9);
}

function buildVolleyballDemoContest(): DemoContest | null {
  const eventKey = AVP_SOUTH_BEACH_MAY_OPEN_EVENT_KEY;
  const pool = avpRegisteredTeamPoolForEvent(eventKey);
  if (!pool) return null;
  const eventMeta = AVP_2026_EVENTS.find((e) => e.event_key === eventKey);
  const names = new Set<string>();
  for (const t of pool.teams) {
    if (t.player_one.trim()) names.add(t.player_one.trim());
    if (t.player_two.trim()) names.add(t.player_two.trim());
  }
  const players = [...names]
    .map((n) => ({ name: n, wc: demoWakiCashForVolleyballPlayer(n, eventKey) }))
    .sort((a, b) => b.wc - a.wc || a.name.localeCompare(b.name))
    .slice(0, 18)
    .map((p, index) => ({
      player_name: p.name,
      display_name: p.name,
      projected_points: p.wc,
      waki_cash: demoCostByRank(index),
      last_event_label: eventMeta?.name ?? "AVP 2026",
    }));
  if (players.length === 0) return null;
  return {
    tournament_key: eventKey,
    tournament_name: eventMeta?.name ?? "AVP 2026 — Pompano Beach Open",
    roster_size: 5,
    salary_cap: WAKICASH_BUDGET_PER_LINEUP,
    players,
  };
}

function buildPokerDemoContest(): DemoContest | null {
  const players = [...WSOP_SITE_TOP_50_PLAYERS]
    .map((p) => ({
      name: p.player_name,
      country: p.country,
      points: Math.round(p.earnings_usd / 1000),
    }))
    .sort((a, b) => b.points - a.points || a.name.localeCompare(b.name))
    .slice(0, 18)
    .map((p, index) => ({
      player_name: p.name,
      display_name: p.name,
      projected_points: p.points,
      waki_cash: demoCostByRank(index),
      last_event_label: p.country ? `WSOP · ${p.country}` : "WSOP earnings board",
    }));
  if (players.length === 0) return null;
  return {
    tournament_key: "wsop_2026_top_earners",
    tournament_name: "WSOP 2026 — Top earners",
    roster_size: 5,
    salary_cap: WAKICASH_BUDGET_PER_LINEUP,
    players,
  };
}

async function buildPublicDemoContest(sport: DemoSport): Promise<DemoContest | null> {
  switch (sport) {
    case "pickleball":
      return buildPickleballDemoContest();
    case "lacrosse":
      return buildLacrosseDemoContest();
    case "volleyball":
      return buildVolleyballDemoContest();
    case "poker":
      return buildPokerDemoContest();
  }
}

function sameEventPayload(
  ex: {
    slots: { slotIndex: number; playerName: string; isCaptain: boolean }[];
    mlpTeamName: string | null;
    predictedTotalMatches: number | null;
  },
  inc: { picks: { player_name: string; is_captain?: boolean }[]; mlp_team_name?: string; predicted_total_matches?: number },
): boolean {
  if (!sameSlots(ex, inc)) return false;
  if (normTeamStr(ex.mlpTeamName) !== normTeamStr(inc.mlp_team_name)) return false;
  const incPred = inc.predicted_total_matches;
  const exPred = ex.predictedTotalMatches ?? null;
  if (incPred === undefined) return true;
  return incPred === exPred;
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
  tournament_key: z.enum(TOURNAMENT_KEYS_ENUM),
});

const PickIn = z.object({
  player_name: z.string().min(1),
  is_captain: z.boolean().optional(),
});

const EventPickIn = z.object({
  slot_index: z.number().int().min(0).max(4),
  event_key: z.string().min(1),
  picks: z.array(PickIn).min(1).max(8),
  /** Required for `mlp_*` tournaments: one franchise bonus pick per event. */
  mlp_team_name: z.string().min(1).optional(),
  /** Pickleball tiebreaker: guess total matches in this event (closest wins). */
  predicted_total_matches: z.number().int().min(0).max(999).optional(),
});

const PutLineupBody = z.object({
  season_key: z.string().default(""),
  events: z.array(EventPickIn).max(5),
});

export const fantasyTournamentRoutes: FastifyPluginAsync = async (app) => {
  const typed = app.withTypeProvider<ZodTypeProvider>();

  typed.get(
    "/demo",
    {
      schema: {
        tags: ["fantasy-tournament"],
        querystring: z.object({
          sport: z.enum(["pickleball", "lacrosse", "volleyball", "poker"]).optional(),
        }),
        response: {
          200: z.object({
            sport: z.enum(["pickleball", "lacrosse", "volleyball", "poker"]),
            tournament_key: z.string(),
            tournament_name: z.string(),
            roster_size: z.number().int(),
            salary_cap: z.number().int(),
            players: z.array(
              z.object({
                player_name: z.string(),
                display_name: z.string(),
                projected_points: z.number(),
                waki_cash: z.number().int(),
                last_event_label: z.string(),
              }),
            ),
            expert_lineup: z
              .object({
                label: z.string(),
                player_names: z.array(z.string()),
                projected_score: z.number(),
                waki_cash_spent: z.number().int(),
                players: z.array(
                  z.object({
                    player_name: z.string(),
                    display_name: z.string(),
                    projected_points: z.number(),
                    waki_cash: z.number().int(),
                  }),
                ),
              })
              .nullable(),
          }),
          503: ErrorMessage,
        },
      },
    },
    async (req, reply) => {
      const sport = (req.query.sport ?? "pickleball") as DemoSport;
      const demo = await buildPublicDemoContest(sport);
      if (!demo) {
        return reply.code(503).send({ message: "Demo contest data is not available." } as const);
      }
      const expert_lineup = buildDemoExpertLineup(demo.players, demo.roster_size, demo.salary_cap);
      return { sport, ...demo, expert_lineup };
    },
  );

  typed.get(
    "/:tournament_key/events",
    {
      schema: {
        tags: ["fantasy-tournament"],
        params: TourneyParams,
        response: {
          200: z.object({
            tournament_key: z.enum(TOURNAMENT_KEYS_ENUM),
            tournament_name: z.string(),
            roster_size: z.number().int(),
            required_men: z.number().int().nullable(),
            required_women: z.number().int().nullable(),
            mlp_teams: z.array(z.string()),
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
      const filteredRows = rows.filter((r) =>
        isAtlantaProMainDrawRow({ tournamentKey, eventType: r.eventType }),
      );
      const mlp_teams = isMlpTournament(tournamentKey)
        ? [...new Set((await getMlpPlayersForTournament(tournamentKey)).map((p) => p.team))].sort((a, b) =>
            a.localeCompare(b, undefined, { sensitivity: "base" }),
          )
        : [];
      return {
        tournament_key: tournamentKey,
        tournament_name: data.summary.tournament_name,
        roster_size: rules.rosterSize,
        required_men: rules.requiredMen,
        required_women: rules.requiredWomen,
        mlp_teams,
        events: filteredRows.map((r) => ({
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
      ...optionalAuthPre,
      schema: {
        tags: ["fantasy-tournament"],
        params: TourneyParams,
        querystring: z.object({ season_key: z.string().optional().default("") }),
        response: {
          200: z.object({
            tournament_key: z.enum(TOURNAMENT_KEYS_ENUM),
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
                mlp_team_name: z.string().nullable(),
                predicted_total_matches: z.number().int().nullable(),
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
      const { tournament_key: tournamentKey } = req.params;
      const rules = rosterRulesForTournament(tournamentKey);
      const seasonKey = req.query.season_key ?? "";

      if (!req.authUser) {
        return {
          tournament_key: tournamentKey as TournamentKey,
          season_key: seasonKey,
          roster_size: rules.rosterSize,
          required_men: rules.requiredMen,
          required_women: rules.requiredWomen,
          wakicash_budget: rules.budget,
          wakicash_spent: 0,
          events: [],
        };
      }

      const uid = req.authUser.id;
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
      const filteredCatalogRows = catalogRows.filter((c) =>
        isAtlantaProMainDrawRow({ tournamentKey, eventType: c.eventType }),
      );
      const catalogByKey = new Map(filteredCatalogRows.map((c) => [c.eventKey, c]));
      const pools = await Promise.all(
        filteredCatalogRows.map(
          async (c) => [c.eventKey, await playerPoolForEvent(tournamentKey, c.scheduleDivisionKey, data)] as const,
        ),
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
        events: lineup.eventPicks
          .filter((ep) => catalogByKey.has(ep.eventKey))
          .map((ep) => {
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
            mlp_team_name: ep.mlpTeamName ?? null,
            predicted_total_matches: ep.predictedTotalMatches ?? null,
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
            tournament_key: z.enum(TOURNAMENT_KEYS_ENUM),
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
                mlp_team_name: z.string().nullable(),
                predicted_total_matches: z.number().int().nullable(),
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
      if (isMlpTournament(tournamentKey) && incoming.length > 1) {
        return reply.code(400).send({ message: "MLP: at most one event per save." } as const);
      }

      const catalogRows = await prisma.tournamentEventCatalog.findMany({
        where: { tournamentKey },
      });
      const filteredCatalogRows = catalogRows.filter((c) =>
        isAtlantaProMainDrawRow({ tournamentKey, eventType: c.eventType }),
      );
      const catalogByKey = new Map(filteredCatalogRows.map((c) => [c.eventKey, c]));

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
          if (
            !sameEventPayload(
              { slots: ex.slots, mlpTeamName: ex.mlpTeamName, predictedTotalMatches: ex.predictedTotalMatches ?? null },
              inc,
            )
          ) {
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
      const maxEvents = isMlpTournament(tournamentKey) ? 1 : 5;
      if (resultEventKeys.size > maxEvents) {
        return reply.code(400).send({
          message:
            maxEvents === 1
              ? "MLP lineups use one event only (plus your franchise team pick for that event)."
              : "At most 5 events per tournament (including locked events you keep).",
        } as const);
      }

      const mlpFranchiseNormSet = isMlpTournament(tournamentKey)
        ? new Set(
            [...new Set((await getMlpPlayersForTournament(tournamentKey)).map((p) => p.team))].map((t) =>
              normName(t),
            ),
          )
        : null;

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
        if (isMlpTournament(tournamentKey)) {
          const tname = inc.mlp_team_name?.trim();
          if (!tname) {
            return reply.code(400).send({
              message: `${inc.event_key}: pick one MLP franchise for the team bonus layer (your player roster stays primary).`,
            } as const);
          }
          if (mlpFranchiseNormSet && !mlpFranchiseNormSet.has(normName(tname))) {
            return reply.code(400).send({
              message: `${inc.event_key}: "${tname}" is not in this tournament’s official franchise list.`,
            } as const);
          }
        }
      }

      let lineup;
      try {
        lineup = await fantasyLineupSaveMutex(`${uid}:${tournamentKey}:${seasonKey}`, () =>
          prisma.$transaction(async (tx) => {
          const header = await tx.fantasyTournamentLineup.upsert({
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

        await tx.$executeRaw(
          Prisma.sql`SELECT 1 FROM "FantasyTournamentLineup" WHERE id = ${header.id} FOR UPDATE`,
        );

        const existingSnap = await tx.fantasyTournamentLineup.findUnique({
          where: { id: header.id },
          include: {
            eventPicks: { include: { slots: { orderBy: { slotIndex: "asc" } } } },
          },
        });
        const existingPicksTx = existingSnap?.eventPicks ?? [];

        // Authoritative lock check vs snapshot taken after row lock (handles races with other tabs / double-submit).
        for (const inc of incoming) {
          const ex = existingPicksTx.find((x) => x.eventKey === inc.event_key);
          if (ex && isEventLocked(ex.firstMatchStartsAt, ex.lockedAt)) {
            if (
              !sameEventPayload(
                {
                  slots: ex.slots,
                  mlpTeamName: ex.mlpTeamName,
                  predictedTotalMatches: ex.predictedTotalMatches ?? null,
                },
                inc,
              )
            ) {
              throw new HttpReplyError(409, {
                message: "This event is locked; picks cannot be changed.",
                code: "EVENT_LOCKED",
                event_key: inc.event_key,
              });
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
        for (const ex of existingPicksTx) {
          if (isEventLocked(ex.firstMatchStartsAt, ex.lockedAt)) {
            const pool = await playerPoolForEvent(tournamentKey, ex.scheduleDivisionKey, data);
            const costMap = new Map(pool.map((p) => [normName(p.player_name), p.waki_cash]));
            for (const s of ex.slots) {
              totalSpend += costMap.get(normName(s.playerName)) ?? 0;
            }
          }
        }

        const toDelete = existingPicksTx
          .filter((ex) => !isEventLocked(ex.firstMatchStartsAt, ex.lockedAt))
          .map((ex) => ex.id);
        if (toDelete.length) {
          await tx.fantasyTournamentEventPick.deleteMany({ where: { id: { in: toDelete } } });
        }

        const now = new Date();
        for (const inc of incoming) {
          const ex = existingPicksTx.find((x) => x.eventKey === inc.event_key);
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
              mlpTeamName: isMlpTournament(tournamentKey) ? inc.mlp_team_name?.trim() ?? null : null,
              predictedTotalMatches:
                inc.predicted_total_matches !== undefined ? inc.predicted_total_matches : null,
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
        }),
        );
      } catch (e) {
        if (e instanceof HttpReplyError) {
          reply.statusCode = e.status;
          return reply.send(e.body as never);
        }
        throw e;
      }

      const refreshedCatalog = await prisma.tournamentEventCatalog.findMany({
        where: { tournamentKey },
      });
      const filteredRefreshedCatalog = refreshedCatalog.filter((c) =>
        isAtlantaProMainDrawRow({ tournamentKey, eventType: c.eventType }),
      );
      const catMap = new Map(filteredRefreshedCatalog.map((c) => [c.eventKey, c]));
      const pools = await Promise.all(
        filteredRefreshedCatalog.map(async (c) => [
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
            mlp_team_name: ep.mlpTeamName ?? null,
            predicted_total_matches: ep.predictedTotalMatches ?? null,
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
