import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import { useQueries, useQueryClient } from "@tanstack/react-query";
import { apiGet } from "../api";
import type { DashboardData } from "../components/Dashboard";
import {
  dashboardQueryKeys,
  mergeDashboardParts,
  type DashboardInsightsPayload,
  type DashboardRostersPayload,
  type DashboardSummaryPayload,
} from "../lib/dashboardQuery";

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
        queryFn: () => apiGet<DashboardSummaryPayload>("/api/v1/users/me/dashboard/summary"),
        staleTime: 30_000,
        enabled,
      },
      {
        queryKey: dashboardQueryKeys.rosters(),
        queryFn: () => apiGet<DashboardRostersPayload>("/api/v1/users/me/dashboard/rosters"),
        staleTime: 30_000,
        enabled,
      },
      {
        queryKey: dashboardQueryKeys.insights(),
        queryFn: () => apiGet<DashboardInsightsPayload>("/api/v1/users/me/dashboard/insights"),
        staleTime: 30_000,
        enabled,
      },
    ],
  });

  const loading = Boolean(enabled && results.some((q) => q.isPending));

  const error = useMemo(() => {
    if (!enabled) return null;
    for (const q of results) {
      if (q.error instanceof Error) return q.error.message;
      if (q.error) return "Failed to load dashboard.";
    }
    return null;
  }, [enabled, results]);

  const preview = useMemo(() => {
    if (!enabled) return null;
    return mergeDashboardParts(results[0]?.data, results[1]?.data, results[2]?.data);
  }, [enabled, results[0]?.data, results[1]?.data, results[2]?.data]);

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
