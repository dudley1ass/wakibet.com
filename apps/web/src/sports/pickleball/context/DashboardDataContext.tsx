import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
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

/** Match DEFAULT_FETCH_MS in api.ts (90s prod) — cold Render + heavy roster query can exceed 42s. */
const DASHBOARD_CHUNK_TIMEOUT_MS = import.meta.env.PROD ? 90_000 : 25_000;
const DASHBOARD_CACHE_KEY = "wakibet_dashboard_preview_v1";

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
  const [cachedPreview, setCachedPreview] = useState<DashboardData | null>(null);

  useEffect(() => {
    if (!enabled) return;
    try {
      const raw = localStorage.getItem(DASHBOARD_CACHE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as DashboardData;
      if (parsed?.profile?.email) {
        setCachedPreview(parsed);
      }
    } catch {
      // ignore cache parse errors
    }
  }, [enabled]);

  const results = useQueries({
    queries: [
      {
        queryKey: dashboardQueryKeys.summary(),
        queryFn: () =>
          apiGet<DashboardSummaryPayload>("/api/v1/users/me/dashboard/summary", {
            timeoutMs: DASHBOARD_CHUNK_TIMEOUT_MS,
          }),
        staleTime: 30_000,
        retry: 1,
        enabled,
      },
      {
        queryKey: dashboardQueryKeys.rosters(),
        queryFn: () =>
          apiGet<DashboardRostersPayload>("/api/v1/users/me/dashboard/rosters", {
            timeoutMs: DASHBOARD_CHUNK_TIMEOUT_MS,
          }),
        staleTime: 30_000,
        retry: 1,
        enabled,
      },
      {
        queryKey: dashboardQueryKeys.insights(),
        queryFn: () =>
          apiGet<DashboardInsightsPayload>("/api/v1/users/me/dashboard/insights", {
            timeoutMs: DASHBOARD_CHUNK_TIMEOUT_MS,
          }),
        staleTime: 30_000,
        retry: 1,
        enabled,
      },
    ],
  });

  const summaryQ = results[0]!;
  const rostersQ = results[1]!;
  const insightsQ = results[2]!;
  const coreReady = Boolean(summaryQ.data && rostersQ.data);
  const loading = Boolean(
    enabled && !coreReady && !cachedPreview && (summaryQ.isPending || rostersQ.isPending),
  );

  const error = useMemo(() => {
    if (!enabled) return null;
    if (summaryQ.error instanceof Error) return summaryQ.error.message;
    if (rostersQ.error instanceof Error) return rostersQ.error.message;
    if (summaryQ.error || rostersQ.error) return "Failed to load dashboard.";
    return null;
  }, [enabled, summaryQ.error, rostersQ.error]);

  const livePreview = useMemo(() => {
    if (!enabled) return null;
    return mergeDashboardParts(summaryQ.data, rostersQ.data, insightsQ.data);
  }, [enabled, summaryQ.data, rostersQ.data, insightsQ.data]);

  useEffect(() => {
    if (!enabled || !livePreview) return;
    setCachedPreview(livePreview);
    try {
      localStorage.setItem(DASHBOARD_CACHE_KEY, JSON.stringify(livePreview));
    } catch {
      // ignore quota/storage errors
    }
  }, [enabled, livePreview]);

  const preview = livePreview ?? cachedPreview;

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
