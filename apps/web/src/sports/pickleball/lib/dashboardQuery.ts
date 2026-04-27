import type { DashboardData } from "../../../components/Dashboard";

export type DashboardSummaryPayload = Pick<
  DashboardData,
  "profile" | "open_contests" | "tournament_schedules"
>;

export type DashboardRostersPayload = Pick<DashboardData, "winter_fantasy_rosters" | "fantasy_season">;

export type DashboardInsightsPayload = Pick<DashboardData, "fantasy_pulse" | "fantasy_what_if">;

export function mergeDashboardParts(
  summary: DashboardSummaryPayload | undefined,
  rosters: DashboardRostersPayload | undefined,
  insights: DashboardInsightsPayload | undefined,
): DashboardData | null {
  if (!summary || !rosters || !insights) return null;
  return { ...summary, ...rosters, ...insights };
}

export const dashboardQueryKeys = {
  all: ["dashboard"] as const,
  summary: () => [...dashboardQueryKeys.all, "summary"] as const,
  rosters: () => [...dashboardQueryKeys.all, "rosters"] as const,
  insights: () => [...dashboardQueryKeys.all, "insights"] as const,
};
