import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import {
  INVEST_ELIGIBLE_UNIVERSE_STARTER,
  INVEST_WEEKLY_PICKEM_MAX_POSITION_PCT,
  INVEST_WEEKLY_PICKEM_PICKS,
  INVEST_WEEKLY_PICKEM_RULES,
  INVEST_WEEKLY_PICKEM_STARTING_CASH_USD,
  computePortfolioReturnScore,
  computeWeeklyContestPhase,
  resolveCurrentWeeklyContest,
} from "@wakibet/shared";
import { prisma } from "../lib/prisma.js";
import { requireAuthUser } from "../lib/requireAuthUser.js";
import { finnhubStatus, getQuote, getQuotes } from "../lib/finnhubClient.js";

const ruleSchema = z.object({
  picks: z.number().int(),
  starting_cash_usd: z.number(),
  starting_wakicash: z.number(),
  max_position_pct: z.number(),
  min_share_price_usd: z.number(),
  lock_time_et: z.string(),
  end_time_et: z.string(),
  allowed_asset_types: z.array(z.enum(["stock", "etf"])),
  excluded: z.array(z.string()),
});

const contestWindowSchema = z.object({
  contest_key: z.string(),
  lock_at_iso: z.string(),
  end_at_iso: z.string(),
  label: z.string(),
});

const assetSchema = z.object({
  symbol: z.string(),
  name: z.string(),
  asset_type: z.enum(["stock", "etf"]),
  sector: z.string(),
});

const quoteSchema = z.object({
  symbol: z.string(),
  current_price: z.number().nullable(),
  open_price: z.number().nullable(),
  previous_close: z.number().nullable(),
  change_abs: z.number().nullable(),
  change_pct: z.number().nullable(),
  source_ts: z.number().nullable(),
  available: z.boolean(),
});

const portfolioPositionInputSchema = z.object({
  symbol: z.string().min(1).max(12),
  allocation_pct: z
    .number()
    .min(0)
    .max(INVEST_WEEKLY_PICKEM_MAX_POSITION_PCT),
});

const portfolioPositionViewSchema = z.object({
  symbol: z.string(),
  allocation_pct: z.number(),
  lock_price_usd: z.number().nullable(),
  end_price_usd: z.number().nullable(),
  current_price_usd: z.number().nullable(),
});

const portfolioViewSchema = z.object({
  contest_key: z.string(),
  lock_at_iso: z.string(),
  end_at_iso: z.string(),
  is_locked: z.boolean(),
  is_settled: z.boolean(),
  starting_value_usd: z.number().nullable(),
  ending_value_usd: z.number().nullable(),
  /** Live return % vs starting bank when locked; pre-lock this is the indicative % at current prices. */
  live_return_pct: z.number().nullable(),
  settled_return_pct: z.number().nullable(),
  positions: z.array(portfolioPositionViewSchema),
  updated_at_iso: z.string(),
});

const ELIGIBLE_SYMBOLS: Set<string> = new Set(
  INVEST_ELIGIBLE_UNIVERSE_STARTER.map((a) => a.symbol.toUpperCase()),
);

const MAX_QUOTES_PER_REQUEST = 100;
const STARTING_CASH = INVEST_WEEKLY_PICKEM_STARTING_CASH_USD;

const adminEmails: Set<string> = new Set(
  (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean),
);

async function requireAdminUser(req: FastifyRequest, reply: FastifyReply): Promise<boolean> {
  if (adminEmails.size === 0) {
    await reply.code(503).send({ message: "Admin routes disabled until ADMIN_EMAILS is set." } as const);
    return false;
  }
  const email = req.authUser?.email?.toLowerCase() ?? "";
  if (!adminEmails.has(email)) {
    await reply.code(403).send({ message: "Admin access required." } as const);
    return false;
  }
  return true;
}

const authPre = { preHandler: [requireAuthUser] };

/**
 * Compute a portfolio's "live return %" using whatever price data is currently
 * available. Behavior:
 *   - settled  → use stored settledReturnPct.
 *   - locked   → use lockPriceUsd as basis vs current quote (or endPriceUsd if it's been written).
 *   - pre-lock → use a notional $100k bank and quote each symbol at the current price.
 *     (Pre-lock the return is indicative only.)
 */
async function computeLiveReturnForPortfolio(p: {
  isLocked: boolean;
  isSettled: boolean;
  settledReturnPct: number | null;
  positions: Array<{
    symbol: string;
    allocationPct: number;
    lockPriceUsd: number | null;
    endPriceUsd: number | null;
  }>;
}): Promise<{ liveReturnPct: number | null; positionQuotes: Map<string, number | null> }> {
  if (p.isSettled && p.settledReturnPct !== null) {
    return { liveReturnPct: p.settledReturnPct, positionQuotes: new Map() };
  }

  const symbols = Array.from(new Set(p.positions.map((pos) => pos.symbol.toUpperCase())));
  const quotes = symbols.length > 0 ? await getQuotes(symbols) : [];
  const priceBySym = new Map<string, number | null>();
  for (const q of quotes) priceBySym.set(q.symbol.toUpperCase(), q.current_price);

  let denom = 0;
  let numer = 0;
  for (const pos of p.positions) {
    const sym = pos.symbol.toUpperCase();
    const alloc = pos.allocationPct;
    const lock = pos.lockPriceUsd ?? null;
    const live = priceBySym.get(sym) ?? null;
    if (lock !== null && live !== null && lock > 0) {
      const dollarsAllocated = (alloc / 100) * STARTING_CASH;
      const shares = dollarsAllocated / lock;
      const currentValue = shares * live;
      denom += dollarsAllocated;
      numer += currentValue;
    } else if (lock === null && live !== null && live > 0) {
      // Pre-lock indicative: treat the position as if it locked-in at the current price (0% so far),
      // but still ensure we never explode with NaN if some quote is unavailable.
      const dollarsAllocated = (alloc / 100) * STARTING_CASH;
      denom += dollarsAllocated;
      numer += dollarsAllocated;
    }
  }

  if (denom <= 0) return { liveReturnPct: null, positionQuotes: priceBySym };
  return {
    liveReturnPct: computePortfolioReturnScore(denom, numer),
    positionQuotes: priceBySym,
  };
}

type StoredPortfolioRow = {
  contestKey: string;
  lockAt: Date;
  endAt: Date;
  isLocked: boolean;
  isSettled: boolean;
  startingValueUsd: number | null;
  endingValueUsd: number | null;
  settledReturnPct: number | null;
  updatedAt: Date;
  positions: Array<{
    symbol: string;
    allocationPct: number;
    lockPriceUsd: number | null;
    endPriceUsd: number | null;
  }>;
};

async function serializePortfolio(p: StoredPortfolioRow): Promise<z.infer<typeof portfolioViewSchema>> {
  const { liveReturnPct, positionQuotes } = await computeLiveReturnForPortfolio(p);
  return {
    contest_key: p.contestKey,
    lock_at_iso: p.lockAt.toISOString(),
    end_at_iso: p.endAt.toISOString(),
    is_locked: p.isLocked,
    is_settled: p.isSettled,
    starting_value_usd: p.startingValueUsd,
    ending_value_usd: p.endingValueUsd,
    live_return_pct: liveReturnPct,
    settled_return_pct: p.settledReturnPct,
    positions: p.positions.map((pos) => ({
      symbol: pos.symbol,
      allocation_pct: pos.allocationPct,
      lock_price_usd: pos.lockPriceUsd,
      end_price_usd: pos.endPriceUsd,
      current_price_usd: positionQuotes.get(pos.symbol.toUpperCase()) ?? null,
    })),
    updated_at_iso: p.updatedAt.toISOString(),
  };
}

export const investRoutes: FastifyPluginAsync = async (app) => {
  const typed = app.withTypeProvider<ZodTypeProvider>();

  typed.get(
    "/current-contest",
    {
      schema: {
        tags: ["invest"],
        summary: "Current Weekly Stock Pick'em contest window + rules.",
        response: {
          200: z.object({
            sport: z.literal("invest"),
            contest_type: z.literal("weekly_pickem"),
            window: contestWindowSchema,
            rules: ruleSchema,
            phase: z.enum(["open", "locked", "settled"]),
            disclaimer: z.string(),
            generated_at: z.string(),
          }),
        },
      },
    },
    async () => {
      const window = resolveCurrentWeeklyContest(new Date());
      const phase = computeWeeklyContestPhase(window, new Date());
      return {
        sport: "invest" as const,
        contest_type: "weekly_pickem" as const,
        window,
        rules: INVEST_WEEKLY_PICKEM_RULES,
        phase,
        disclaimer:
          "Free stock-picking contest using virtual portfolios. No real money is invested. Not investment advice.",
        generated_at: new Date().toISOString(),
      };
    },
  );

  typed.get(
    "/universe",
    {
      schema: {
        tags: ["invest"],
        summary:
          "Curated starter universe of eligible US large-cap stocks + broad ETFs, with optional live quotes",
        querystring: z.object({
          with_quotes: z
            .union([z.literal("true"), z.literal("false")])
            .optional()
            .default("false"),
        }),
        response: {
          200: z.object({
            sport: z.literal("invest"),
            assets: z.array(assetSchema),
            quotes: z.array(quoteSchema).nullable(),
            data_source: z.object({
              provider: z.literal("finnhub"),
              available: z.boolean(),
            }),
            note: z.string(),
            generated_at: z.string(),
          }),
        },
      },
    },
    async (req) => {
      const status = finnhubStatus();
      const assets = [...INVEST_ELIGIBLE_UNIVERSE_STARTER];
      let quotes: Awaited<ReturnType<typeof getQuotes>> | null = null;
      if (req.query.with_quotes === "true") {
        quotes = await getQuotes(assets.map((a) => a.symbol));
      }
      return {
        sport: "invest" as const,
        assets,
        quotes,
        data_source: { provider: "finnhub" as const, available: status.api_key_configured },
        note: status.api_key_configured
          ? "Live quotes from Finnhub (60s cache)."
          : "Live quotes unavailable — set FINNHUB_API_KEY on the server to enable.",
        generated_at: new Date().toISOString(),
      };
    },
  );

  typed.get(
    "/quote/:symbol",
    {
      schema: {
        tags: ["invest"],
        summary: "Single-symbol live quote (cached 60s)",
        params: z.object({ symbol: z.string().min(1).max(12) }),
        response: {
          200: z.object({
            sport: z.literal("invest"),
            quote: quoteSchema,
            data_source: z.object({
              provider: z.literal("finnhub"),
              available: z.boolean(),
            }),
            generated_at: z.string(),
          }),
        },
      },
    },
    async (req) => {
      const quote = await getQuote(req.params.symbol);
      const status = finnhubStatus();
      return {
        sport: "invest" as const,
        quote,
        data_source: { provider: "finnhub" as const, available: status.api_key_configured },
        generated_at: new Date().toISOString(),
      };
    },
  );

  typed.get(
    "/quotes",
    {
      schema: {
        tags: ["invest"],
        summary: "Bulk live quotes for a comma-separated list of symbols (cached 60s)",
        querystring: z.object({ symbols: z.string().min(1) }),
        response: {
          200: z.object({
            sport: z.literal("invest"),
            quotes: z.array(quoteSchema),
            data_source: z.object({
              provider: z.literal("finnhub"),
              available: z.boolean(),
            }),
            generated_at: z.string(),
          }),
          400: z.object({ message: z.string() }),
        },
      },
    },
    async (req, reply) => {
      const list = req.query.symbols
        .split(",")
        .map((s) => s.trim().toUpperCase())
        .filter(Boolean);
      if (list.length === 0) {
        return reply.code(400).send({ message: "At least one symbol is required." } as const);
      }
      if (list.length > MAX_QUOTES_PER_REQUEST) {
        return reply
          .code(400)
          .send({ message: `Too many symbols — max ${MAX_QUOTES_PER_REQUEST} per request.` } as const);
      }
      const quotes = await getQuotes(list);
      const status = finnhubStatus();
      return {
        sport: "invest" as const,
        quotes,
        data_source: { provider: "finnhub" as const, available: status.api_key_configured },
        generated_at: new Date().toISOString(),
      };
    },
  );

  // ============ Persistent portfolios (authenticated) ============

  typed.get(
    "/my-portfolios",
    {
      ...authPre,
      schema: {
        tags: ["invest"],
        summary: "All saved Invest portfolios for the signed-in user, newest first.",
        response: {
          200: z.object({
            sport: z.literal("invest"),
            portfolios: z.array(portfolioViewSchema),
            current_contest_key: z.string(),
            generated_at: z.string(),
          }),
          401: z.object({ message: z.string() }),
        },
      },
    },
    async (req) => {
      const userId = req.authUser!.id;
      const rows = await prisma.investPortfolio.findMany({
        where: { userId },
        orderBy: { lockAt: "desc" },
        include: { positions: { orderBy: { createdAt: "asc" } } },
      });
      const current = resolveCurrentWeeklyContest(new Date());
      const serialized = await Promise.all(rows.map((r) => serializePortfolio(r)));
      return {
        sport: "invest" as const,
        portfolios: serialized,
        current_contest_key: current.contest_key,
        generated_at: new Date().toISOString(),
      };
    },
  );

  typed.put(
    "/portfolio",
    {
      ...authPre,
      schema: {
        tags: ["invest"],
        summary:
          "Create or update the signed-in user's portfolio for a specific contest window. Locked contests are read-only.",
        body: z.object({
          contest_key: z.string().min(1),
          positions: z.array(portfolioPositionInputSchema).min(1).max(INVEST_WEEKLY_PICKEM_PICKS),
        }),
        response: {
          200: z.object({
            sport: z.literal("invest"),
            portfolio: portfolioViewSchema,
            generated_at: z.string(),
          }),
          400: z.object({ message: z.string() }),
          401: z.object({ message: z.string() }),
          403: z.object({ message: z.string() }),
          404: z.object({ message: z.string() }),
        },
      },
    },
    async (req, reply) => {
      const userId = req.authUser!.id;
      const { contest_key, positions } = req.body;

      // Resolve the contest window — must match one of the current/upcoming windows.
      const current = resolveCurrentWeeklyContest(new Date());
      let window = current;
      if (contest_key !== current.contest_key) {
        return reply.code(404).send({ message: "Only the current weekly contest accepts new portfolios." } as const);
      }

      // Validate symbols against the eligible universe.
      const seen = new Set<string>();
      let totalPct = 0;
      for (const p of positions) {
        const sym = p.symbol.trim().toUpperCase();
        if (!ELIGIBLE_SYMBOLS.has(sym)) {
          return reply.code(400).send({ message: `Symbol ${sym} is not in the eligible universe.` } as const);
        }
        if (seen.has(sym)) {
          return reply.code(400).send({ message: `Duplicate symbol: ${sym}.` } as const);
        }
        seen.add(sym);
        totalPct += p.allocation_pct;
      }
      if (totalPct > 100 + 1e-6) {
        return reply
          .code(400)
          .send({ message: "Total allocation exceeds 100%." } as const);
      }

      // Reject edits after lock.
      const phase = computeWeeklyContestPhase(window, new Date());
      const existing = await prisma.investPortfolio.findUnique({
        where: { userId_contestKey: { userId, contestKey: contest_key } },
        include: { positions: true },
      });
      if (existing?.isLocked || phase !== "open") {
        return reply
          .code(403)
          .send({ message: "Lineup is locked — edits are no longer allowed for this contest." } as const);
      }

      // Upsert: delete + re-insert positions in a transaction for simplicity.
      const lockAt = new Date(window.lock_at_iso);
      const endAt = new Date(window.end_at_iso);
      const upserted = await prisma.$transaction(async (tx) => {
        const portfolio = await tx.investPortfolio.upsert({
          where: { userId_contestKey: { userId, contestKey: contest_key } },
          update: { lockAt, endAt },
          create: { userId, contestKey: contest_key, lockAt, endAt },
        });
        await tx.investPortfolioPosition.deleteMany({ where: { portfolioId: portfolio.id } });
        for (const p of positions) {
          await tx.investPortfolioPosition.create({
            data: {
              portfolioId: portfolio.id,
              symbol: p.symbol.trim().toUpperCase(),
              allocationPct: p.allocation_pct,
            },
          });
        }
        return tx.investPortfolio.findUniqueOrThrow({
          where: { id: portfolio.id },
          include: { positions: { orderBy: { createdAt: "asc" } } },
        });
      });

      const view = await serializePortfolio(upserted);
      return {
        sport: "invest" as const,
        portfolio: view,
        generated_at: new Date().toISOString(),
      };
    },
  );

  // ============ Leaderboard ============

  typed.get(
    "/season-leaderboard",
    {
      schema: {
        tags: ["invest"],
        summary: "Wakibet user portfolio-return leaderboard for the current weekly contest.",
        response: {
          200: z.object({
            sport: z.literal("invest"),
            contest_key: z.string(),
            phase: z.enum(["open", "locked", "settled"]),
            total_players: z.number().int(),
            rows: z.array(
              z.object({
                rank: z.number().int(),
                display_name: z.string(),
                points: z.number(),
                is_me: z.boolean(),
              }),
            ),
            generated_at: z.string(),
          }),
        },
      },
    },
    async (req) => {
      const window = resolveCurrentWeeklyContest(new Date());
      const phase = computeWeeklyContestPhase(window, new Date());
      let meUserId: string | null = null;
      const authHdr = req.headers.authorization;
      if (authHdr?.startsWith("Bearer ")) {
        try {
          const { verifyAccessToken } = await import("../lib/jwt.js");
          ({ sub: meUserId } = verifyAccessToken(authHdr.slice(7)));
        } catch {
          meUserId = null;
        }
      }
      const rows = await prisma.investPortfolio.findMany({
        where: { contestKey: window.contest_key },
        include: {
          user: { select: { id: true, displayName: true, username: true } },
          positions: true,
        },
      });
      const scored = await Promise.all(
        rows.map(async (r) => {
          const { liveReturnPct } = await computeLiveReturnForPortfolio(r);
          return {
            userId: r.userId,
            displayName: r.user.displayName || r.user.username,
            points: liveReturnPct ?? 0,
          };
        }),
      );
      scored.sort((a, b) => b.points - a.points);
      return {
        sport: "invest" as const,
        contest_key: window.contest_key,
        phase,
        total_players: scored.length,
        rows: scored.map((s, idx) => ({
          rank: idx + 1,
          display_name: s.displayName,
          points: s.points,
          is_me: meUserId !== null && s.userId === meUserId,
        })),
        generated_at: new Date().toISOString(),
      };
    },
  );

  // ============ Admin: snapshot + settle ============

  typed.post(
    "/admin/snapshot-lock",
    {
      ...authPre,
      schema: {
        tags: ["invest"],
        summary:
          "Admin: capture Monday-open lock prices for every symbol held in the current contest's portfolios.",
        response: {
          200: z.object({
            ok: z.literal(true),
            contest_key: z.string(),
            symbols_snapped: z.number(),
            portfolios_locked: z.number(),
          }),
          401: z.object({ message: z.string() }),
          403: z.object({ message: z.string() }),
          503: z.object({ message: z.string() }),
        },
      },
    },
    async (req, reply) => {
      if (!(await requireAdminUser(req, reply))) return;
      const window = resolveCurrentWeeklyContest(new Date());
      const portfolios = await prisma.investPortfolio.findMany({
        where: { contestKey: window.contest_key, isLocked: false },
        include: { positions: true },
      });
      const symbols = Array.from(
        new Set(portfolios.flatMap((p) => p.positions.map((pos) => pos.symbol.toUpperCase()))),
      );
      if (symbols.length === 0) {
        return {
          ok: true as const,
          contest_key: window.contest_key,
          symbols_snapped: 0,
          portfolios_locked: 0,
        };
      }
      const quotes = await getQuotes(symbols);
      const priceBySym = new Map<string, { price: number; ts: number | null }>();
      for (const q of quotes) {
        if (q.current_price && q.current_price > 0) {
          priceBySym.set(q.symbol.toUpperCase(), {
            price: q.current_price,
            ts: q.source_ts,
          });
        }
      }
      // Persist price snapshots + position lock prices + portfolio starting value.
      let portfoliosLocked = 0;
      await prisma.$transaction(async (tx) => {
        for (const [sym, data] of priceBySym) {
          await tx.investPriceSnapshot.upsert({
            where: { contestKey_symbol_kind: { contestKey: window.contest_key, symbol: sym, kind: "lock" } },
            update: { priceUsd: data.price, sourceTs: data.ts ?? null },
            create: {
              contestKey: window.contest_key,
              symbol: sym,
              kind: "lock",
              priceUsd: data.price,
              sourceTs: data.ts ?? null,
              provider: "finnhub",
            },
          });
        }
        for (const p of portfolios) {
          let startingValue = 0;
          for (const pos of p.positions) {
            const snap = priceBySym.get(pos.symbol.toUpperCase());
            const lockPrice = snap?.price ?? null;
            if (lockPrice !== null) {
              startingValue += (pos.allocationPct / 100) * STARTING_CASH;
              await tx.investPortfolioPosition.update({
                where: { id: pos.id },
                data: { lockPriceUsd: lockPrice },
              });
            }
          }
          await tx.investPortfolio.update({
            where: { id: p.id },
            data: { isLocked: true, startingValueUsd: startingValue },
          });
          portfoliosLocked += 1;
        }
      });
      return {
        ok: true as const,
        contest_key: window.contest_key,
        symbols_snapped: priceBySym.size,
        portfolios_locked: portfoliosLocked,
      };
    },
  );

  typed.post(
    "/admin/settle",
    {
      ...authPre,
      schema: {
        tags: ["invest"],
        summary:
          "Admin: capture Friday-close prices, compute final portfolio returns, and mark every portfolio settled.",
        response: {
          200: z.object({
            ok: z.literal(true),
            contest_key: z.string(),
            symbols_snapped: z.number(),
            portfolios_settled: z.number(),
          }),
          401: z.object({ message: z.string() }),
          403: z.object({ message: z.string() }),
          503: z.object({ message: z.string() }),
        },
      },
    },
    async (req, reply) => {
      if (!(await requireAdminUser(req, reply))) return;
      const window = resolveCurrentWeeklyContest(new Date());
      const portfolios = await prisma.investPortfolio.findMany({
        where: { contestKey: window.contest_key, isSettled: false },
        include: { positions: true },
      });
      const symbols = Array.from(
        new Set(portfolios.flatMap((p) => p.positions.map((pos) => pos.symbol.toUpperCase()))),
      );
      if (symbols.length === 0) {
        return {
          ok: true as const,
          contest_key: window.contest_key,
          symbols_snapped: 0,
          portfolios_settled: 0,
        };
      }
      const quotes = await getQuotes(symbols);
      const priceBySym = new Map<string, { price: number; ts: number | null }>();
      for (const q of quotes) {
        if (q.current_price && q.current_price > 0) {
          priceBySym.set(q.symbol.toUpperCase(), {
            price: q.current_price,
            ts: q.source_ts,
          });
        }
      }
      let portfoliosSettled = 0;
      await prisma.$transaction(async (tx) => {
        for (const [sym, data] of priceBySym) {
          await tx.investPriceSnapshot.upsert({
            where: { contestKey_symbol_kind: { contestKey: window.contest_key, symbol: sym, kind: "end" } },
            update: { priceUsd: data.price, sourceTs: data.ts ?? null },
            create: {
              contestKey: window.contest_key,
              symbol: sym,
              kind: "end",
              priceUsd: data.price,
              sourceTs: data.ts ?? null,
              provider: "finnhub",
            },
          });
        }
        for (const p of portfolios) {
          let startingValue = p.startingValueUsd ?? 0;
          let endingValue = 0;
          for (const pos of p.positions) {
            const endPrice = priceBySym.get(pos.symbol.toUpperCase())?.price ?? null;
            const lockPrice = pos.lockPriceUsd ?? null;
            if (endPrice !== null) {
              await tx.investPortfolioPosition.update({
                where: { id: pos.id },
                data: { endPriceUsd: endPrice },
              });
              if (lockPrice !== null && lockPrice > 0) {
                const dollarsAllocated = (pos.allocationPct / 100) * STARTING_CASH;
                const shares = dollarsAllocated / lockPrice;
                endingValue += shares * endPrice;
                if (p.startingValueUsd === null) {
                  startingValue += dollarsAllocated;
                }
              }
            }
          }
          const settledPct =
            startingValue > 0 ? computePortfolioReturnScore(startingValue, endingValue) : null;
          await tx.investPortfolio.update({
            where: { id: p.id },
            data: {
              isSettled: true,
              startingValueUsd: startingValue || p.startingValueUsd,
              endingValueUsd: endingValue,
              settledReturnPct: settledPct,
            },
          });
          portfoliosSettled += 1;
        }
      });
      return {
        ok: true as const,
        contest_key: window.contest_key,
        symbols_snapped: priceBySym.size,
        portfolios_settled: portfoliosSettled,
      };
    },
  );
};
