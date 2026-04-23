/**
 * Layer 3 — ordering, dedupe, cooldowns (anti-spam).
 */

import type { FeedMessage, FeedMessageType } from "./types";
import { priorityRank } from "./timing";

const TYPE_COOLDOWN_MS = 60_000;

export class FeedSessionState {
  private readonly shownDedupeKeys = new Set<string>();
  private readonly lastTypeAt = new Map<FeedMessageType, number>();
  private readonly exactTextOnce = new Set<string>();

  /** Returns candidates that pass dedupe + per-type cooldown (urgent bypasses type cooldown). */
  filterFresh(candidates: FeedMessage[], now = Date.now()): FeedMessage[] {
    const sorted = [...candidates].sort((a, b) => {
      const pr = priorityRank(b.priority) - priorityRank(a.priority);
      if (pr !== 0) return pr;
      return (b.text?.length ?? 0) - (a.text?.length ?? 0);
    });

    const out: FeedMessage[] = [];
    for (const m of sorted) {
      if (m.dedupeKey && this.shownDedupeKeys.has(m.dedupeKey)) continue;

      const lastT = this.lastTypeAt.get(m.type) ?? 0;
      if (m.priority !== "urgent" && now - lastT < TYPE_COOLDOWN_MS) continue;

      const exact = `${m.type}::${m.text}`;
      if (this.exactTextOnce.has(exact)) continue;

      out.push(m);
    }
    return out;
  }

  /** Call after a message is actually shown in the UI. */
  recordShown(m: FeedMessage): void {
    if (m.dedupeKey) this.shownDedupeKeys.add(m.dedupeKey);
    this.lastTypeAt.set(m.type, Date.now());
    this.exactTextOnce.add(`${m.type}::${m.text}`);
  }

  /** When the queue is empty, relax exact-text memory so the feed can breathe. */
  clearSoft(): void {
    this.exactTextOnce.clear();
  }

  reset(): void {
    this.shownDedupeKeys.clear();
    this.lastTypeAt.clear();
    this.exactTextOnce.clear();
  }
}
