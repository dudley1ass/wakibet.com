import type { DashboardData } from "../../../components/Dashboard";

export type DashboardSummaryPayload = Pick<
  DashboardData,
  "profile" | "open_contests" | "tournament_schedules"
>;

export type DashboardRostersPayload = Pick<DashboardData, "winter_fantasy_rosters" | "fantasy_season">;

export type DashboardInsightsPayload = Pick<DashboardData, "fantasy_pulse" | "fantasy_what_if">;

/** Safe defaults when insights endpoint is slow or fails — avoids a blank dashboard. */
export const EMPTY_FANTASY_PULSE: DashboardData["fantasy_pulse"] = {
  my_rank: null,
  rank_players_count: 0,
  rank_change: null,
  pick_rows: [],
  recent_hits: [],
  progress: [],
  leaderboard: [],
};

export function mergeDashboardParts(
  summary: DashboardSummaryPayload | undefined,
  rosters: DashboardRostersPayload | undefined,
  insights: DashboardInsightsPayload | undefined,
): DashboardData | null {
  if (!summary || !rosters) return null;
  const mergedInsights: DashboardInsightsPayload = insights ?? {
    fantasy_pulse: EMPTY_FANTASY_PULSE,
    fantasy_what_if: [],
  };
  return { ...summary, ...rosters, ...mergedInsights };
}

export const dashboardQueryKeys = {
  all: ["dashboard"] as const,
  summary: () => [...dashboardQueryKeys.all, "summary"] as const,
  rosters: () => [...dashboardQueryKeys.all, "rosters"] as const,
  insights: () => [...dashboardQueryKeys.all, "insights"] as const,
};
