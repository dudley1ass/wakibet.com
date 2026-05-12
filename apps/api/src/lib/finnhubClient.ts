/**
 * Finnhub market-data client for the Invest sport.
 *
 * Used for the Weekly Stock Pick'em — virtual portfolios, no real money. Scope
 * is intentionally narrow: current quote (price, open, prev close, daily change).
 *
 * Auth: set `FINNHUB_API_KEY` env var. If unset, every call returns
 * `{ available: false, ... }` and the caller renders a graceful empty state.
 *
 * Caching: 60-second TTL (Redis if `REDIS_URL` is configured, otherwise an
 * in-memory Map). Tuned to keep us comfortably under Finnhub's free-tier
 * 60-requests/minute limit even with a few thousand active sessions.
 */

import { redisGetJson, redisSetJson } from "./redisOptional.js";

const FINNHUB_BASE_URL = "https://finnhub.io/api/v1";
const QUOTE_CACHE_TTL_SECONDS = 60;
const QUOTE_REQUEST_TIMEOUT_MS = 8_000;

export type FinnhubQuote = {
  symbol: string;
  /** Current price (last trade). */
  current_price: number | null;
  /** Today's open price. */
  open_price: number | null;
  /** Previous trading day's close. */
  previous_close: number | null;
  /** Absolute daily change (current − previous close). */
  change_abs: number | null;
  /** Percent daily change. */
  change_pct: number | null;
  /** Unix seconds of last update from upstream. */
  source_ts: number | null;
  /** False when no API key is configured or upstream returns an empty quote. */
  available: boolean;
};

type FinnhubQuoteRaw = {
  c?: number;
  d?: number;
  dp?: number;
  h?: number;
  l?: number;
  o?: number;
  pc?: number;
  t?: number;
};

const memoryCache = new Map<string, { value: FinnhubQuote; expires_at_ms: number }>();

function cacheKey(symbol: string): string {
  return `finnhub:quote:${symbol.toUpperCase()}`;
}

function isApiKeyConfigured(): boolean {
  const k = process.env.FINNHUB_API_KEY?.trim();
  return !!k && k.length > 0;
}

function emptyQuote(symbol: string): FinnhubQuote {
  return {
    symbol: symbol.toUpperCase(),
    current_price: null,
    open_price: null,
    previous_close: null,
    change_abs: null,
    change_pct: null,
    source_ts: null,
    available: false,
  };
}

async function readFromCache(symbol: string): Promise<FinnhubQuote | null> {
  const key = cacheKey(symbol);
  const memHit = memoryCache.get(key);
  if (memHit && memHit.expires_at_ms > Date.now()) return memHit.value;
  const redisHit = await redisGetJson<FinnhubQuote>(key);
  if (redisHit) {
    memoryCache.set(key, {
      value: redisHit,
      expires_at_ms: Date.now() + QUOTE_CACHE_TTL_SECONDS * 1000,
    });
    return redisHit;
  }
  return null;
}

async function writeToCache(quote: FinnhubQuote): Promise<void> {
  const key = cacheKey(quote.symbol);
  memoryCache.set(key, {
    value: quote,
    expires_at_ms: Date.now() + QUOTE_CACHE_TTL_SECONDS * 1000,
  });
  await redisSetJson(key, quote, QUOTE_CACHE_TTL_SECONDS);
}

async function fetchQuoteFromUpstream(symbol: string): Promise<FinnhubQuote> {
  const apiKey = process.env.FINNHUB_API_KEY?.trim();
  if (!apiKey) return emptyQuote(symbol);

  const url = `${FINNHUB_BASE_URL}/quote?symbol=${encodeURIComponent(symbol.toUpperCase())}&token=${encodeURIComponent(apiKey)}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), QUOTE_REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) {
      console.error(`[finnhub] quote ${symbol} HTTP ${res.status}`);
      return emptyQuote(symbol);
    }
    const data = (await res.json()) as FinnhubQuoteRaw;
    const current = typeof data.c === "number" && data.c > 0 ? data.c : null;
    const prev = typeof data.pc === "number" && data.pc > 0 ? data.pc : null;
    const open = typeof data.o === "number" && data.o > 0 ? data.o : null;
    const changeAbs = typeof data.d === "number" ? data.d : null;
    const changePct = typeof data.dp === "number" ? data.dp : null;
    const ts = typeof data.t === "number" && data.t > 0 ? data.t : null;
    const available = current !== null;
    return {
      symbol: symbol.toUpperCase(),
      current_price: current,
      open_price: open,
      previous_close: prev,
      change_abs: changeAbs,
      change_pct: changePct,
      source_ts: ts,
      available,
    };
  } catch (err) {
    console.error(`[finnhub] quote ${symbol} error`, err);
    return emptyQuote(symbol);
  } finally {
    clearTimeout(timer);
  }
}

/** Fetch a single quote (cached). */
export async function getQuote(symbol: string): Promise<FinnhubQuote> {
  const cached = await readFromCache(symbol);
  if (cached) return cached;
  const fresh = await fetchQuoteFromUpstream(symbol);
  if (fresh.available || isApiKeyConfigured()) {
    // Always cache, even unavailable responses, to avoid hammering on bad
    // tickers. Unavailable responses still respect the 60s TTL.
    await writeToCache(fresh);
  }
  return fresh;
}

/**
 * Fetch many quotes in parallel. Returns one entry per requested symbol
 * (order preserved). Caching deduplicates upstream load across calls.
 */
export async function getQuotes(symbols: ReadonlyArray<string>): Promise<FinnhubQuote[]> {
  const unique = Array.from(new Set(symbols.map((s) => s.trim().toUpperCase()).filter(Boolean)));
  const results = await Promise.all(unique.map((s) => getQuote(s)));
  const lookup = new Map(results.map((q) => [q.symbol, q] as const));
  return symbols.map((raw) => {
    const key = raw.trim().toUpperCase();
    return lookup.get(key) ?? emptyQuote(key);
  });
}

/** Lightweight health probe for diagnostics. */
export function finnhubStatus(): { api_key_configured: boolean } {
  return { api_key_configured: isApiKeyConfigured() };
}
