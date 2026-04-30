import fs from "node:fs/promises";
import path from "node:path";
import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { prisma } from "../lib/prisma.js";
import { requireAuthUser } from "../lib/requireAuthUser.js";

type TeamRow = {
  team: string;
  rating: number;
};

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function normalize(v: number, min: number, max: number): number {
  if (max <= min) return 50;
  return clamp(((v - min) / (max - min)) * 100, 0, 100);
}

function expectedScore(a: number, b: number): number {
  return 1 / (1 + 10 ** (-(a - b) / 400));
}

function probabilityToOdds(p: number): number {
  const q = clamp(p, 0.0001, 0.9999);
  if (q >= 0.5) return -Math.round(100 * q / (1 - q));
  return Math.round(100 * (1 - q) / q);
}

function spreadFromDiff(diff: number): number {
  return Math.round((diff / 50) * 2) / 2;
}

function confidenceFromP(p: number): number {
  return Math.round(Math.abs(p - 0.5) * 100);
}

async function loadTeamRatings(): Promise<TeamRow[]> {
  const csvPath = path.resolve(process.cwd(), "data", "pll-player-stats.csv");
  const raw = await fs.readFile(csvPath, "utf8");
  const lines = raw.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const head = lines[0]!.split(",");
  const idx = new Map(head.map((h, i) => [h.trim(), i]));
  const gi = (row: string[], k: string): string => row[idx.get(k) ?? -1] ?? "";
  const num = (row: string[], k: string): number => {
    const n = Number(gi(row, k));
    return Number.isFinite(n) ? n : 0;
  };

  const byTeam = new Map<string, string[][]>();
  for (const line of lines.slice(1)) {
    const row = line.split(",");
    const team = gi(row, "Team");
    if (!team) continue;
    const arr = byTeam.get(team) ?? [];
    arr.push(row);
    byTeam.set(team, arr);
  }

  const rawTeams = Array.from(byTeam.entries()).map(([team, rows]) => {
    const avg = (k: string) => rows.reduce((s, r) => s + num(r, k), 0) / Math.max(rows.length, 1);
    const total = (k: string) => rows.reduce((s, r) => s + num(r, k), 0);
    const gPlayed = Math.max(1, avg("Games Played"));
    const goalsPg = total("Total Goals") / gPlayed;
    const astPg = total("Assists") / gPlayed;
    const shoot = avg("Shooting %") * (avg("Shooting %") <= 1 ? 100 : 1);
    const caused = total("Caused Turnovers") / gPlayed;
    const pen = total("Penalties (in minutes)") / gPlayed;
    const fo = avg("Faceoff %") * (avg("Faceoff %") <= 1 ? 100 : 1);
    const gb = total("Groundballs") / gPlayed;
    const savePct = avg("Save %") * (avg("Save %") <= 1 ? 100 : 1);
    const saa = avg("Scores Against Average") || 12;
    const form = total("Points") / gPlayed;
    return { team, goalsPg, astPg, shoot, caused, pen, fo, gb, savePct, saa, form };
  });

  const range = (k: keyof (typeof rawTeams)[number]) => {
    const vals = rawTeams.map((r) => r[k] as number);
    return { min: Math.min(...vals), max: Math.max(...vals) };
  };
  const rgGoals = range("goalsPg");
  const rgAst = range("astPg");
  const rgShoot = range("shoot");
  const rgCaused = range("caused");
  const rgPen = range("pen");
  const rgFo = range("fo");
  const rgGb = range("gb");
  const rgSave = range("savePct");
  const rgSaa = range("saa");
  const rgForm = range("form");

  return rawTeams
    .map((r) => {
      const O = 0.5 * normalize(r.goalsPg, rgGoals.min, rgGoals.max) + 0.3 * normalize(r.shoot, rgShoot.min, rgShoot.max) + 0.2 * normalize(r.astPg, rgAst.min, rgAst.max);
      const D = 0.6 * (100 - normalize(r.saa, rgSaa.min, rgSaa.max)) + 0.25 * normalize(r.caused, rgCaused.min, rgCaused.max) + 0.15 * (100 - normalize(r.pen, rgPen.min, rgPen.max));
      const G = 0.7 * normalize(r.savePct, rgSave.min, rgSave.max) + 0.3 * (100 - normalize(r.saa, rgSaa.min, rgSaa.max));
      const F = normalize(r.form, rgForm.min, rgForm.max);
      const P = 0.7 * normalize(r.fo, rgFo.min, rgFo.max) + 0.3 * normalize(r.gb, rgGb.min, rgGb.max);
      const S = 50;
      const H = 50;
      const rating = 0.30 * O + 0.25 * D + 0.15 * G + 0.10 * F + 0.10 * P + 0.05 * S + 0.05 * H;
      return { team: r.team, rating };
    })
    .sort((a, b) => b.rating - a.rating);
}

async function ensureCurrentSlate() {
  const seasonYear = new Date().getUTCFullYear();
  const slateKey = `pll_week_${seasonYear}`;
  const lockAt = new Date();
  lockAt.setUTCDate(lockAt.getUTCDate() + 3);
  const slate = await prisma.lacrosseSlate.upsert({
    where: { slateKey },
    create: { slateKey, seasonYear, lockAt, name: `PLL Week ${seasonYear}` },
    update: { name: `PLL Week ${seasonYear}`, lockAt },
  });

  const teams = await loadTeamRatings();
  const pairs: Array<{ a: TeamRow; b: TeamRow }> = [];
  for (let i = 0; i + 1 < teams.length && pairs.length < 3; i += 2) {
    pairs.push({ a: teams[i]!, b: teams[i + 1]! });
  }

  for (let i = 0; i < pairs.length; i++) {
    const p = pairs[i]!;
    const ra = 1400 + p.a.rating * 3;
    const rb = 1400 + p.b.rating * 3;
    const pa = expectedScore(ra, rb);
    const diff = ra - rb;
    await prisma.lacrosseSlateLine.upsert({
      where: { slateId_lineKey: { slateId: slate.id, lineKey: `line_${i + 1}` } },
      create: {
        slateId: slate.id,
        lineKey: `line_${i + 1}`,
        teamA: p.a.team,
        teamB: p.b.team,
        spreadA: spreadFromDiff(diff),
        oddsA: probabilityToOdds(pa),
        oddsB: probabilityToOdds(1 - pa),
        confidence: confidenceFromP(pa),
      },
      update: {
        teamA: p.a.team,
        teamB: p.b.team,
        spreadA: spreadFromDiff(diff),
        oddsA: probabilityToOdds(pa),
        oddsB: probabilityToOdds(1 - pa),
        confidence: confidenceFromP(pa),
      },
    });
  }

  return slate;
}

function estReturn(stake: number, odds: number): number {
  if (odds < 0) return stake * (1 + 100 / Math.abs(odds));
  return stake * (1 + Math.abs(odds) / 100);
}

const authPre = { preHandler: [requireAuthUser] };

export const lacrosseRoutes: FastifyPluginAsync = async (app) => {
  const typed = app.withTypeProvider<ZodTypeProvider>();
  const ErrorMessage = z.object({ message: z.string() });

  typed.get(
    "/current",
    {
      schema: {
        tags: ["lacrosse"],
        response: {
          200: z.object({
            slate_key: z.string(),
            name: z.string(),
            season_year: z.number().int(),
            lock_at: z.string(),
            lines: z.array(
              z.object({
                line_id: z.string(),
                line_key: z.string(),
                team_a: z.string(),
                team_b: z.string(),
                spread_a: z.number(),
                odds_a: z.number().int(),
                odds_b: z.number().int(),
                confidence: z.number().int(),
              }),
            ),
          }),
        },
      },
    },
    async () => {
      const slate = await ensureCurrentSlate();
      const lines = await prisma.lacrosseSlateLine.findMany({
        where: { slateId: slate.id },
        orderBy: { lineKey: "asc" },
      });
      return {
        slate_key: slate.slateKey,
        name: slate.name,
        season_year: slate.seasonYear,
        lock_at: slate.lockAt.toISOString(),
        lines: lines.map((l) => ({
          line_id: l.id,
          line_key: l.lineKey,
          team_a: l.teamA,
          team_b: l.teamB,
          spread_a: Number(l.spreadA),
          odds_a: l.oddsA,
          odds_b: l.oddsB,
          confidence: l.confidence,
        })),
      };
    },
  );

  const LineupBody = z.object({
    slate_key: z.string().min(1),
    picks: z.array(
      z.object({
        line_id: z.string(),
        side: z.enum(["A", "B"]),
        stake: z.number().int().min(0).max(40),
      }),
    ),
  });

  typed.get(
    "/lineup",
    {
      ...authPre,
      schema: {
        tags: ["lacrosse"],
        querystring: z.object({ slate_key: z.string().min(1) }),
        response: {
          200: z.object({
            slate_key: z.string(),
            spent_wakicash: z.number().int(),
            est_return: z.number(),
            picks: z.array(
              z.object({
                line_id: z.string(),
                side: z.string(),
                stake: z.number().int(),
                odds_at_save: z.number().int(),
                est_return: z.number(),
              }),
            ),
          }),
          404: ErrorMessage,
        },
      },
    },
    async (req, reply) => {
      const slate = await prisma.lacrosseSlate.findUnique({ where: { slateKey: req.query.slate_key } });
      if (!slate) return reply.code(404).send({ message: "Unknown slate_key." } as const);
      const lineup = await prisma.lacrosseLineup.upsert({
        where: { userId_slateId: { userId: req.authUser!.id, slateId: slate.id } },
        create: { userId: req.authUser!.id, slateId: slate.id },
        update: {},
        include: { picks: true },
      });
      return {
        slate_key: slate.slateKey,
        spent_wakicash: lineup.spentWakiCash,
        est_return: Number(lineup.estReturn),
        picks: lineup.picks.map((p) => ({
          line_id: p.lineId,
          side: p.side,
          stake: p.stake,
          odds_at_save: p.oddsAtSave,
          est_return: Number(p.estReturn),
        })),
      };
    },
  );

  typed.put(
    "/lineup",
    {
      ...authPre,
      schema: {
        tags: ["lacrosse"],
        body: LineupBody,
        response: {
          200: z.object({ ok: z.literal(true) }),
          400: ErrorMessage,
          404: ErrorMessage,
          409: ErrorMessage,
        },
      },
    },
    async (req, reply) => {
      const slate = await prisma.lacrosseSlate.findUnique({ where: { slateKey: req.body.slate_key } });
      if (!slate) return reply.code(404).send({ message: "Unknown slate_key." } as const);
      if (slate.isClosed || new Date() >= slate.lockAt) {
        return reply.code(409).send({ message: "This lacrosse slate is locked." } as const);
      }
      const total = req.body.picks.reduce((s, p) => s + p.stake, 0);
      if (total > 100) return reply.code(400).send({ message: "Total stake exceeds 100 WakiCash." } as const);

      const lines = await prisma.lacrosseSlateLine.findMany({ where: { slateId: slate.id } });
      const byId = new Map(lines.map((l) => [l.id, l]));
      for (const p of req.body.picks) {
        if (!byId.has(p.line_id)) return reply.code(400).send({ message: "Invalid line_id for slate." } as const);
      }

      const lineup = await prisma.lacrosseLineup.upsert({
        where: { userId_slateId: { userId: req.authUser!.id, slateId: slate.id } },
        create: { userId: req.authUser!.id, slateId: slate.id },
        update: {},
      });
      await prisma.lacrossePick.deleteMany({ where: { lineupId: lineup.id } });

      let est = 0;
      for (const p of req.body.picks) {
        const line = byId.get(p.line_id)!;
        const odds = p.side === "A" ? line.oddsA : line.oddsB;
        const ret = estReturn(p.stake, odds);
        est += ret;
        await prisma.lacrossePick.create({
          data: {
            lineupId: lineup.id,
            lineId: p.line_id,
            side: p.side,
            stake: p.stake,
            oddsAtSave: odds,
            estReturn: ret,
          },
        });
      }
      await prisma.lacrosseLineup.update({
        where: { id: lineup.id },
        data: { spentWakiCash: total, estReturn: est },
      });
      return { ok: true as const };
    },
  );

  typed.get(
    "/lineups",
    {
      ...authPre,
      schema: {
        tags: ["lacrosse"],
        response: {
          200: z.object({
            rows: z.array(
              z.object({
                slate_key: z.string(),
                slate_name: z.string(),
                lock_at: z.string(),
                spent_wakicash: z.number().int(),
                est_return: z.number(),
                picks: z.array(
                  z.object({
                    line_id: z.string(),
                    team_a: z.string(),
                    team_b: z.string(),
                    side: z.string(),
                    stake: z.number().int(),
                    odds_at_save: z.number().int(),
                    est_return: z.number(),
                  }),
                ),
              }),
            ),
          }),
        },
      },
    },
    async (req) => {
      const lineups = await prisma.lacrosseLineup.findMany({
        where: { userId: req.authUser!.id },
        orderBy: { createdAt: "desc" },
        include: {
          slate: true,
          picks: { include: { line: true }, orderBy: { createdAt: "asc" } },
        },
      });
      return {
        rows: lineups.map((l) => ({
          slate_key: l.slate.slateKey,
          slate_name: l.slate.name,
          lock_at: l.slate.lockAt.toISOString(),
          spent_wakicash: l.spentWakiCash,
          est_return: Number(l.estReturn),
          picks: l.picks.map((p) => ({
            line_id: p.lineId,
            team_a: p.line.teamA,
            team_b: p.line.teamB,
            side: p.side,
            stake: p.stake,
            odds_at_save: p.oddsAtSave,
            est_return: Number(p.estReturn),
          })),
        })),
      };
    },
  );
};
