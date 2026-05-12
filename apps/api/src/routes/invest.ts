import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import {
  INVEST_ELIGIBLE_UNIVERSE_STARTER,
  INVEST_WEEKLY_PICKEM_RULES,
  resolveCurrentWeeklyContest,
} from "@wakibet/shared";
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

/** Cap the bulk-quote request to keep request shape safe; 100 symbols >> our 50-symbol starter universe. */
const MAX_QUOTES_PER_REQUEST = 100;

export const investRoutes: FastifyPluginAsync = async (app) => {
  const typed = app.withTypeProvider<ZodTypeProvider>();

  typed.get(
    "/current-contest",
    {
      schema: {
        tags: ["invest"],
        summary:
          "Current Weekly Stock Pick'em contest window + rules. Virtual portfolios only — no real money is invested.",
        response: {
          200: z.object({
            sport: z.literal("invest"),
            contest_type: z.literal("weekly_pickem"),
            window: contestWindowSchema,
            rules: ruleSchema,
            disclaimer: z.string(),
            generated_at: z.string(),
          }),
        },
      },
    },
    async () => ({
      sport: "invest" as const,
      contest_type: "weekly_pickem" as const,
      window: resolveCurrentWeeklyContest(new Date()),
      rules: INVEST_WEEKLY_PICKEM_RULES,
      disclaimer:
        "Free stock-picking contest using virtual portfolios. No real money is invested. Not investment advice.",
      generated_at: new Date().toISOString(),
    }),
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
        params: z.object({
          symbol: z.string().min(1).max(12),
        }),
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
        querystring: z.object({
          symbols: z.string().min(1),
        }),
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

  typed.get(
    "/season-leaderboard",
    {
      schema: {
        tags: ["invest"],
        summary:
          "Wakibet user portfolio-return leaderboard (empty until the weekly settlement engine is live)",
        response: {
          200: z.object({
            sport: z.literal("invest"),
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
        },
      },
    },
    async () => ({ sport: "invest" as const, total_players: 0, rows: [] }),
  );
};
