import { POKER_WORLD_RANKINGS_TOP_200 } from "./worldRankingsTop200.js";
import { WSOP_SITE_TOP_50_PLAYERS, type WsopSiteLeaderboardPlayer } from "./wsopSiteTop50.js";

/**
 * When WSOP display names differ from our global list spelling, map to the world-ranking `player_name`.
 */
const WSOP_DISPLAY_TO_WORLD_PLAYER_NAME: Record<string, string> = {
  "Christopher Brian Hunichen": "Chris Hunichen",
};

function normalizeComparable(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function firstAndLastMatch(a: string, b: string): boolean {
  const ta = normalizeComparable(a)
    .split(" ")
    .filter(Boolean);
  const tb = normalizeComparable(b)
    .split(" ")
    .filter(Boolean);
  if (ta.length === 0 || tb.length === 0) return false;
  return ta[0] === tb[0] && ta[ta.length - 1] === tb[tb.length - 1];
}

/** True if this WSOP leaderboard row corresponds to someone already on the global top-200 list. */
export function wsopPlayerAppearsInWorldTop200(wsopDisplayName: string): boolean {
  const mapped = WSOP_DISPLAY_TO_WORLD_PLAYER_NAME[wsopDisplayName] ?? wsopDisplayName;
  const normMapped = normalizeComparable(mapped);
  for (const row of POKER_WORLD_RANKINGS_TOP_200) {
    const normW = normalizeComparable(row.player_name);
    if (normMapped === normW) return true;
    if (normMapped.includes(normW) || normW.includes(normMapped)) return true;
    if (firstAndLastMatch(mapped, row.player_name)) return true;
  }
  return false;
}

/**
 * WSOP top-50 rows whose players are not represented on the global top-200 list (after name matching).
 * Excludes placeholder “Unknown Player”.
 */
export function wsopLeaderboardPlayersNotInWorldTop200(): WsopSiteLeaderboardPlayer[] {
  return WSOP_SITE_TOP_50_PLAYERS.filter(
    (p) => p.player_name !== "Unknown Player" && !wsopPlayerAppearsInWorldTop200(p.player_name),
  );
}
