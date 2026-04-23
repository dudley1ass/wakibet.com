import type { SessionUser } from "../../App";
import type { DashboardData } from "../Dashboard";

type Pulse = DashboardData["fantasy_pulse"];

const WELCOME_KEY = "wakifeed_welcome";

export function shouldShowWelcomeToday(userId: string): boolean {
  try {
    const today = new Date().toDateString();
    return sessionStorage.getItem(`${WELCOME_KEY}_${userId}`) !== today;
  } catch {
    return true;
  }
}

export function markWelcomeShown(userId: string): void {
  try {
    sessionStorage.setItem(`${WELCOME_KEY}_${userId}`, new Date().toDateString());
  } catch {
    /* ignore */
  }
}

/** Layer 3 inputs — facts the engine reads from dashboard + session. */
export type FeedEngineContext = {
  userId: string;
  path: string;
  firstName: string;
  preview: DashboardData | null;
  pulse: Pulse | null;
  shouldWelcome: boolean;
  /** Incomplete roster rows (needs picks / completion). */
  openSlotCount: number;
  rank: number | null;
  rankPlayers: number;
  rankDelta: number | null;
  seasonPoints: number;
  /** Minutes until user’s next listed match (rough urgency signal). */
  nextMatchMinutes: number | null;
  nextMatchLabel: string | null;
  nextMatchId: string | null;
  /** 30 / 10 / 2 minute urgency bucket when next match is soon. */
  lockBucket: 30 | 10 | 2 | null;
  /** Top what-ifs for projection copy (already ranked server-side). */
  projections: {
    playerName: string;
    kind: "win_next" | "lose_next";
    rankBefore: number | null;
    rankAfter: number | null;
    scenarioDelta: number;
  }[];
  recentHitLines: { headline: string; points: number }[];
  /** Best performing live pick row for praise / value heuristics. */
  strongestPick: { name: string; points: number; isCaptain: boolean } | null;
  upsetInRecentHit: boolean;
  /** Heuristic: several recent hits = “hot” feed signal. */
  hotResultsSignal: boolean;
};

function firstName(user: SessionUser): string {
  const d = user.display_name?.trim();
  if (d) return d.split(/\s+/)[0] ?? d;
  return user.email.split("@")[0] ?? "there";
}

export function buildFeedContext(
  user: SessionUser,
  path: string,
  preview: DashboardData | null,
  pulse: Pulse | null,
): FeedEngineContext {
  const openSlotCount =
    preview?.winter_fantasy_rosters.filter((r) => !r.waki_lineup_complete || r.picks.length < 5).length ?? 0;

  let nextMatchMinutes: number | null = null;
  let nextMatchLabel: string | null = null;
  let nextMatchId: string | null = null;
  let lockBucket: 30 | 10 | 2 | null = null;

  if (preview) {
    const upcoming = preview.tournament_schedules.flatMap((t) =>
      t.my_upcoming_matches.map((m) => ({
        ...m,
        tournament_name: t.tournament_name,
      })),
    );
    upcoming.sort((a, b) => a.event_date.localeCompare(b.event_date));
    const m0 = upcoming[0];
    if (m0?.event_date) {
      const ms = new Date(m0.event_date).getTime() - Date.now();
      nextMatchMinutes = Math.round(ms / 60_000);
      nextMatchLabel = `${m0.tournament_name} · vs ${m0.opponent}`;
      nextMatchId = m0.match_id;
      if (nextMatchMinutes > 0 && nextMatchMinutes <= 30) {
        if (nextMatchMinutes <= 2) lockBucket = 2;
        else if (nextMatchMinutes <= 10) lockBucket = 10;
        else lockBucket = 30;
      }
    }
  }

  const projections = (preview?.fantasy_what_if ?? []).slice(0, 3).map((w) => ({
    playerName: w.player_name,
    kind: w.kind,
    rankBefore: w.rank_before,
    rankAfter: w.rank_after,
    scenarioDelta: w.scenario_player_delta,
  }));

  const recentHitLines = pulse?.recent_hits?.slice(0, 6).map((h) => ({ headline: h.headline, points: h.points })) ?? [];

  let strongestPick: FeedEngineContext["strongestPick"] = null;
  if (pulse?.pick_rows?.length) {
    const sorted = [...pulse.pick_rows].sort((a, b) => b.points_on_roster - a.points_on_roster);
    const top = sorted[0];
    if (top && top.points_on_roster > 0) {
      strongestPick = {
        name: top.player_name,
        points: top.points_on_roster,
        isCaptain: top.is_captain,
      };
    }
  }

  const upsetInRecentHit = recentHitLines.some(
    (h) => /upset/i.test(h.headline) || (h.points >= 8 && /win/i.test(h.headline)),
  );

  const hotResultsSignal = recentHitLines.length >= 3;

  return {
    userId: user.user_id,
    path,
    firstName: firstName(user),
    preview,
    pulse,
    shouldWelcome: shouldShowWelcomeToday(user.user_id),
    openSlotCount,
    rank: pulse?.my_rank ?? null,
    rankPlayers: pulse?.rank_players_count ?? 0,
    rankDelta: pulse?.rank_change ?? null,
    seasonPoints: preview?.fantasy_season.total_fantasy_points ?? 0,
    nextMatchMinutes,
    nextMatchLabel,
    nextMatchId,
    lockBucket,
    projections,
    recentHitLines,
    strongestPick,
    upsetInRecentHit,
    hotResultsSignal,
  };
}
