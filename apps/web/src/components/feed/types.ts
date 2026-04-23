/**
 * Layer 1 — message shape (all feed items).
 * priority: queue ordering + TTL; source: which pipeline produced it.
 */
export type FeedMessageType =
  | "WELCOME"
  | "PICK_PRAISE"
  | "VALUE_PICK"
  | "HOT_STREAK"
  | "RANK_UP"
  | "RANK_DOWN"
  | "LOCK_WARNING"
  | "OPEN_SLOT"
  | "PROJECTION"
  | "RESULT_UPDATE"
  | "SYSTEM_HINT";

export type FeedPriority = "low" | "medium" | "high" | "urgent";

export type MessageSource = "system" | "lineup" | "results" | "ranking" | "projection";

export type FeedMessage = {
  id: string;
  type: FeedMessageType;
  text: string;
  priority: FeedPriority;
  source: MessageSource;
  createdAt: string;
  expiresAt?: string;
  tournamentId?: string;
  eventId?: string;
  userId?: string;
  dedupeKey?: string;
};

/** Layer 4 — runtime only (display controller TTL). */
export type FeedMessageLive = FeedMessage & { _expiresAtMs: number };
