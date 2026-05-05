import { useQuery } from "@tanstack/react-query";
import {
  buildLacrossePicksSpotlightPayload,
  buildPickleballPicksSpotlightPayload,
  buildVolleyballPicksSpotlightPayload,
} from "@wakibet/shared";
import { apiGet } from "../api";

export type PicksSpotlightStatus = "live" | "upcoming" | "ended";

export type PicksSpotlightItem = {
  sport_key: string;
  window_key: string;
  href: string;
  label_short: string;
  label_full: string;
  venue: string;
  status: PicksSpotlightStatus;
  starts_at: string;
  ends_at: string;
};

export type PicksSpotlightResponse = {
  generated_at: string;
  items: PicksSpotlightItem[];
};

const vbFallback = buildVolleyballPicksSpotlightPayload();
const pbFallback = buildPickleballPicksSpotlightPayload();
const lxFallback = buildLacrossePicksSpotlightPayload();

/** Used when the API is down or returns no rows — matches prior static copy. */
export const PICKS_SPOTLIGHT_FALLBACK: PicksSpotlightItem[] = [
  {
    sport_key: vbFallback.sport_key,
    window_key: vbFallback.window_key,
    href: vbFallback.href,
    label_short: vbFallback.label_short,
    label_full: vbFallback.label_full,
    venue: vbFallback.venue,
    status: vbFallback.status,
    starts_at: vbFallback.starts_at,
    ends_at: vbFallback.ends_at,
  },
  {
    sport_key: pbFallback.sport_key,
    window_key: pbFallback.window_key,
    href: pbFallback.href,
    label_short: pbFallback.label_short,
    label_full: pbFallback.label_full,
    venue: pbFallback.venue,
    status: pbFallback.status,
    starts_at: pbFallback.starts_at,
    ends_at: pbFallback.ends_at,
  },
  {
    sport_key: lxFallback.sport_key,
    window_key: lxFallback.window_key,
    href: lxFallback.href,
    label_short: lxFallback.label_short,
    label_full: lxFallback.label_full,
    venue: lxFallback.venue,
    status: lxFallback.status,
    starts_at: lxFallback.starts_at,
    ends_at: lxFallback.ends_at,
  },
];

export function usePicksSpotlight() {
  const q = useQuery({
    queryKey: ["picks", "spotlight"] as const,
    queryFn: () => apiGet<PicksSpotlightResponse>("/api/v1/picks/spotlight", { timeoutMs: 20_000 }),
    staleTime: 60_000,
    retry: 1,
  });

  const items = q.data?.items?.length ? q.data.items : PICKS_SPOTLIGHT_FALLBACK;

  function item(sportKey: string): PicksSpotlightItem | undefined {
    return items.find((i) => i.sport_key === sportKey);
  }

  return { ...q, items, item };
}
