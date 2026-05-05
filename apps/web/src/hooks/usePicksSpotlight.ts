import { useQuery } from "@tanstack/react-query";
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

/** Used when the API is down or returns no rows — matches prior static copy. */
export const PICKS_SPOTLIGHT_FALLBACK: PicksSpotlightItem[] = [
  {
    sport_key: "volleyball",
    window_key: "fallback",
    href: "/volleyball-picks",
    label_short: "Volleyball",
    label_full: "Volleyball Picks",
    venue: "Huntington Beach Open",
    status: "live",
    starts_at: "1970-01-01T00:00:00.000Z",
    ends_at: "2099-12-31T23:59:59.999Z",
  },
  {
    sport_key: "pickleball",
    window_key: "fallback",
    href: "/week-picks",
    label_short: "Pickleball",
    label_full: "Pickleball Picks",
    venue: "MLP Dallas 2026",
    status: "live",
    starts_at: "1970-01-01T00:00:00.000Z",
    ends_at: "2099-12-31T23:59:59.999Z",
  },
  {
    sport_key: "lacrosse",
    window_key: "fallback",
    href: "/lacrosse",
    label_short: "Lacrosse",
    label_full: "Lacrosse Slate",
    venue: "Utah Open · PLL",
    status: "live",
    starts_at: "1970-01-01T00:00:00.000Z",
    ends_at: "2099-12-31T23:59:59.999Z",
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
