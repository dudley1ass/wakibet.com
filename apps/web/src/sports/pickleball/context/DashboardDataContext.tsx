import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import { useQueries, useQueryClient } from "@tanstack/react-query";
import { apiGet } from "../../../api";
import type { DashboardData } from "../../../components/Dashboard";
import {
  dashboardQueryKeys,
  mergeDashboardParts,
  type DashboardInsightsPayload,
  type DashboardRostersPayload,
  type DashboardSummaryPayload,
} from "../lib/dashboardQuery";

const DASHBOARD_CHUNK_TIMEOUT_MS = import.meta.env.PROD ? 42_000 : 18_000;

type Ctx = {
  preview: DashboardData | null;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
};

const DashboardDataContext = createContext<Ctx | null>(null);

export function DashboardDataProvider({
  enabled,
  children,
}: {
  enabled: boolean;
  children: ReactNode;
}) {
  const queryClient = useQueryClient();

  const results = useQueries({
    queries: [
      {
        queryKey: dashboardQueryKeys.summary(),
        queryFn: () =>
          apiGet<DashboardSummaryPayload>("/api/v1/users/me/dashboard/summary", {
            timeoutMs: DASHBOARD_CHUNK_TIMEOUT_MS,
          }),
        staleTime: 30_000,
        retry: 0,
        enabled,
      },
      {
        queryKey: dashboardQueryKeys.rosters(),
        queryFn: () =>
          apiGet<DashboardRostersPayload>("/api/v1/users/me/dashboard/rosters", {
            timeoutMs: DASHBOARD_CHUNK_TIMEOUT_MS,
          }),
        staleTime: 30_000,
        retry: 0,
        enabled,
      },
      {
        queryKey: dashboardQueryKeys.insights(),
        queryFn: () =>
          apiGet<DashboardInsightsPayload>("/api/v1/users/me/dashboard/insights", {
            timeoutMs: DASHBOARD_CHUNK_TIMEOUT_MS,
          }),
        staleTime: 30_000,
        retry: 0,
        enabled,
      },
    ],
  });

  const summaryQ = results[0]!;
  const rostersQ = results[1]!;
  const insightsQ = results[2]!;
  const coreReady = Boolean(summaryQ.data && rostersQ.data);
  const loading = Boolean(
    enabled && !coreReady && (summaryQ.isPending || rostersQ.isPending),
  );

  const error = useMemo(() => {
    if (!enabled) return null;
    if (summaryQ.error instanceof Error) return summaryQ.error.message;
    if (rostersQ.error instanceof Error) return rostersQ.error.message;
    if (summaryQ.error || rostersQ.error) return "Failed to load dashboard.";
    return null;
  }, [enabled, summaryQ.error, rostersQ.error]);

  const preview = useMemo(() => {
    if (!enabled) return null;
    return mergeDashboardParts(summaryQ.data, rostersQ.data, insightsQ.data);
  }, [enabled, summaryQ.data, rostersQ.data, insightsQ.data]);

  const reload = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: dashboardQueryKeys.all });
  }, [queryClient]);

  const value = useMemo(
    () => ({
      preview,
      loading,
      error,
      reload,
    }),
    [preview, loading, error, reload],
  );

  return <DashboardDataContext.Provider value={value}>{children}</DashboardDataContext.Provider>;
}

export function useDashboardData(): Ctx | null {
  return useContext(DashboardDataContext);
}

export function useDashboardDataRequired(): Ctx {
  const v = useContext(DashboardDataContext);
  if (!v) throw new Error("useDashboardDataRequired outside DashboardDataProvider");
  return v;
}
