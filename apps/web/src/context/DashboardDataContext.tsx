import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { apiGet } from "../api";
import type { DashboardData } from "../components/Dashboard";

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
  const [preview, setPreview] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const prevEnabled = useRef(false);

  useLayoutEffect(() => {
    if (enabled && !prevEnabled.current) {
      setLoading(true);
    }
    if (!enabled) {
      setLoading(false);
    }
    prevEnabled.current = enabled;
  }, [enabled]);

  const loadDashboard = useCallback(async () => {
    setError(null);
    try {
      setLoading(true);
      const data = await apiGet<DashboardData>("/api/v1/users/me/dashboard");
      setPreview(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load dashboard.");
      setPreview(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      setPreview(null);
      setError(null);
      setLoading(false);
      return;
    }
    void loadDashboard();
  }, [enabled, loadDashboard]);

  const value = useMemo(
    () => ({
      preview,
      loading,
      error,
      reload: loadDashboard,
    }),
    [preview, loading, error, loadDashboard],
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
