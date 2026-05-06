import { Redis } from "ioredis";

let client: Redis | null | undefined;

/** Lazily connect when REDIS_URL is set; otherwise returns null (caller uses memory fallback). */
export function getRedis(): Redis | null {
  if (client !== undefined) return client;
  const url = process.env.REDIS_URL?.trim();
  if (!url) {
    client = null;
    return null;
  }
  try {
    client = new Redis(url, {
      maxRetriesPerRequest: 2,
      lazyConnect: true,
    });
    client.on("error", (err: Error) => {
      console.error("[redis] connection error:", err.message);
    });
    return client;
  } catch {
    client = null;
    return null;
  }
}

export async function redisGetJson<T>(key: string): Promise<T | null> {
  const r = getRedis();
  if (!r) return null;
  try {
    const raw = await r.get(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function redisSetJson(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  const r = getRedis();
  if (!r) return;
  try {
    await r.set(key, JSON.stringify(value), "EX", ttlSeconds);
  } catch {
    /* ignore — fallback paths handle misses */
  }
}

/** Rate limit: increment key with TTL window; returns current count after increment. */
export async function redisIncrWithExpiry(key: string, windowSeconds: number): Promise<number | null> {
  const r = getRedis();
  if (!r) return null;
  try {
    const n = await r.incr(key);
    if (n === 1) {
      await r.expire(key, windowSeconds);
    }
    return n;
  } catch {
    return null;
  }
}
