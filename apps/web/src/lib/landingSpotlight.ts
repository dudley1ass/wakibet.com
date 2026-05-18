import { lineupEntryForSport, LINEUP_ENTRY } from "./lineupEntryRoutes";

export type LandingSpotlightItem = {
  sport_key: string;
  href: string;
  label_short: string;
  label_full: string;
  venue: string;
  status: "live" | "upcoming" | "ended";
  starts_at: string;
  ends_at: string;
};

const STATUS_RANK: Record<LandingSpotlightItem["status"], number> = {
  live: 0,
  upcoming: 1,
  ended: 2,
};

const SPORT_LABEL: Record<string, string> = {
  pickleball: "pickleball",
  lacrosse: "lacrosse",
  volleyball: "volleyball",
  poker: "WSOP",
};

/** Next slate for the hero CTA: live first, then soonest upcoming. */
export function pickHeroSpotlightItem(items: LandingSpotlightItem[]): LandingSpotlightItem | undefined {
  if (items.length === 0) return undefined;
  const pool = items.some((i) => i.status !== "ended") ? items.filter((i) => i.status !== "ended") : items;
  return [...pool].sort((a, b) => {
    const byStatus = STATUS_RANK[a.status] - STATUS_RANK[b.status];
    if (byStatus !== 0) return byStatus;
    return new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime();
  })[0];
}

export function sportDisplayName(sportKey: string): string {
  return SPORT_LABEL[sportKey] ?? sportKey;
}

export function lineupHrefForSpotlight(item: LandingSpotlightItem): string {
  const key = item.sport_key as keyof typeof LINEUP_ENTRY;
  if (key in LINEUP_ENTRY) return lineupEntryForSport(key);
  return item.href;
}
