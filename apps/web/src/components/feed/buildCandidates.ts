/**
 * Layer 2 — triggers + templates → candidate messages (before queue rules).
 */

import type { FeedMessage, FeedMessageType, FeedPriority, MessageSource } from "./types";
import type { FeedEngineContext } from "./context";
import {
  HOT_STREAK_LINES,
  IDLE_WHILE_LOADING_LINES,
  IDLE_WHILE_QUIET_LINES,
  LOCK_LINES,
  OPEN_SLOT_LINES,
  PICK_PRAISE_LINES,
  PROJECTION_LINES,
  RANK_NEAR_LINES,
  RANK_UP_LINES,
  SYSTEM_HINT_LINES,
  WELCOME_LINES,
  pick,
} from "./templates";
import { isoPlusMs, nowIso, ttlMsForPriority } from "./timing";
import { newFeedId } from "./ids";

function baseMsg(
  type: FeedMessageType,
  text: string,
  priority: FeedPriority,
  source: MessageSource,
  extra: Partial<Pick<FeedMessage, "dedupeKey" | "tournamentId" | "eventId" | "userId" | "expiresAt">> = {},
): FeedMessage {
  const ttl = ttlMsForPriority(priority);
  return {
    id: newFeedId(),
    type,
    text,
    priority,
    source,
    createdAt: nowIso(),
    expiresAt: isoPlusMs(ttl),
    ...extra,
  };
}

function rankJumpSteps(before: number | null, after: number | null): number {
  if (before == null || after == null) return 0;
  return Math.abs(before - after);
}

/** Build all candidates for this tick (queue will dedupe / order). */
export function buildCandidateMessages(ctx: FeedEngineContext): FeedMessage[] {
  const out: FeedMessage[] = [];

  if (ctx.shouldWelcome) {
    out.push(
      baseMsg("WELCOME", `${pick(WELCOME_LINES)} You’re ${ctx.rank != null ? `#${ctx.rank} of ${ctx.rankPlayers}` : "on the board"}.`, "medium", "system", {
        dedupeKey: `welcome-${ctx.userId}-${new Date().toDateString()}`,
        userId: ctx.userId,
      }),
    );
  }

  if (ctx.rank != null && ctx.rank <= 12) {
    const gap = 10 - ctx.rank;
    if (gap > 0 && gap <= 8) {
      out.push(
        baseMsg(
          "SYSTEM_HINT",
          pick(RANK_NEAR_LINES(10)),
          "low",
          "ranking",
          { dedupeKey: `near-top10-${ctx.userId}` },
        ),
      );
    }
  }

  const rd = ctx.rankDelta;
  if (rd != null && rd !== 0) {
    const abs = Math.abs(rd);
    if (abs >= 2 || (ctx.rank != null && ctx.rank <= 10 && abs >= 1)) {
      const type: FeedMessageType = rd > 0 ? "RANK_UP" : "RANK_DOWN";
      const pri: FeedPriority = abs >= 3 ? "high" : "medium";
      const text =
        rd > 0
          ? `🚀 ${pick(RANK_UP_LINES(abs))}`
          : `📉 Slipped ${abs} spot${abs === 1 ? "" : "s"} vs last snapshot — next result can claw it back.`;
      out.push(
        baseMsg(type, text, pri, "ranking", {
          dedupeKey: `rank-delta-${ctx.userId}-${rd}`,
        }),
      );
    }
  }

  if (ctx.openSlotCount > 0) {
    out.push(
      baseMsg(
        "OPEN_SLOT",
        `✏️ ${pick(OPEN_SLOT_LINES(ctx.openSlotCount))}`,
        ctx.openSlotCount >= 3 ? "high" : "medium",
        "lineup",
        { dedupeKey: `open-slots-${ctx.userId}-${ctx.openSlotCount}` },
      ),
    );
  }

  if (ctx.lockBucket && ctx.nextMatchLabel && ctx.nextMatchMinutes != null && ctx.nextMatchMinutes > 0) {
    const mins =
      ctx.lockBucket === 2
        ? Math.max(1, Math.min(2, ctx.nextMatchMinutes))
        : ctx.lockBucket === 10
          ? Math.max(3, Math.min(10, ctx.nextMatchMinutes))
          : Math.max(11, Math.min(30, ctx.nextMatchMinutes));
    const label = ctx.nextMatchLabel;
    out.push(
      baseMsg("LOCK_WARNING", `⏳ ${pick(LOCK_LINES(label, mins))}`, "urgent", "system", {
        dedupeKey: `lock-${ctx.nextMatchId}-${ctx.lockBucket}`,
        eventId: ctx.nextMatchId ?? undefined,
      }),
    );
  }

  for (const p of ctx.projections) {
    const jump = rankJumpSteps(p.rankBefore, p.rankAfter);
    if (jump >= 2 && p.kind === "win_next") {
      out.push(
        baseMsg(
          "PROJECTION",
          pick(PROJECTION_LINES(p.playerName, jump)),
          "high",
          "projection",
          { dedupeKey: `proj-${p.playerName}-${p.kind}-${jump}` },
        ),
      );
    }
  }

  if (ctx.hotResultsSignal) {
    out.push(
      baseMsg(
        "HOT_STREAK",
        `🔥 ${pick(HOT_STREAK_LINES)}`,
        "high",
        "results",
        { dedupeKey: `hot-results-${ctx.userId}` },
      ),
    );
  }

  if (ctx.strongestPick && ctx.strongestPick.points >= 10) {
    const { name, points, isCaptain } = ctx.strongestPick;
    if (isCaptain) {
      out.push(
        baseMsg(
          "PICK_PRAISE",
          `👑 Captain ${name} is carrying ${points} pts on your card.`,
          "high",
          "lineup",
          { dedupeKey: `captain-${name}-${points}` },
        ),
      );
    } else if (ctx.strongestPick.points >= 14) {
      out.push(
        baseMsg(
          "VALUE_PICK",
          `💰 ${pick(PICK_PRAISE_LINES)} ${name} is at ${points} pts — nice value.`,
          "high",
          "lineup",
          { dedupeKey: `value-${name}` },
        ),
      );
    } else {
      out.push(
        baseMsg(
          "PICK_PRAISE",
          `🔥 ${pick(PICK_PRAISE_LINES)} (${name}, ${points} pts).`,
          "medium",
          "lineup",
          { dedupeKey: `pick-praise-${name}` },
        ),
      );
    }
  }

  if (ctx.upsetInRecentHit) {
    out.push(
      baseMsg(
        "RESULT_UPDATE",
        "⚡ Upset energy on your last big hit — that’s the table doing its job.",
        "high",
        "results",
        { dedupeKey: `upset-${ctx.userId}-${ctx.recentHitLines[0]?.headline ?? "x"}`.slice(0, 80) },
      ),
    );
  }

  const hit0 = ctx.recentHitLines[0];
  if (hit0) {
    out.push(
      baseMsg(
        "RESULT_UPDATE",
        `⚡ ${hit0.headline} (${hit0.points >= 0 ? "+" : ""}${hit0.points} pts).`,
        "medium",
        "results",
        { dedupeKey: `result-${hit0.headline}`.slice(0, 120) },
      ),
    );
  }

  if (ctx.seasonPoints > 0) {
    out.push(
      baseMsg(
        "SYSTEM_HINT",
        `${pick(SYSTEM_HINT_LINES)} You’re at ${ctx.seasonPoints} WakiPoints season total.`,
        "low",
        "system",
        { dedupeKey: `season-pts-${ctx.userId}` },
      ),
    );
  }

  if (ctx.path !== "/" && ctx.path !== "/pick-teams" && ctx.path !== "/rosters") {
    out.push(
      baseMsg(
        "SYSTEM_HINT",
        "📍 Dashboard has your pulse; Pick / Edit Teams is where lineups lock in.",
        "low",
        "system",
        { dedupeKey: "nav-hint-offhub" },
      ),
    );
  }

  /* No dedupeKey: otherwise a single “loading” key blocks forever while preview stays null. */
  if (out.length === 0) {
    if (ctx.preview == null) {
      out.push(baseMsg("SYSTEM_HINT", pick(IDLE_WHILE_LOADING_LINES), "medium", "system"));
    } else {
      out.push(
        baseMsg("SYSTEM_HINT", pick(IDLE_WHILE_QUIET_LINES(ctx.firstName)), "medium", "system"),
      );
    }
  }

  return out;
}
