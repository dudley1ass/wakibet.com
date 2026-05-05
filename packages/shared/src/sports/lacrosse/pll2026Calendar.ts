/**
 * 2026 PLL weekend calendar (regular season, mid-season, playoffs).
 * Used for picks spotlight and editorial “featured weekend” copy.
 */
export const PLL_2026_SEASON_YEAR = 2026 as const;

export type Pll2026Stop = {
  window_key: string;
  label: string;
  venue: string;
  start_date: string;
  end_date: string;
};

const PLL_2026_STOPS_UNSORTED: Pll2026Stop[] = [
  {
    window_key: "pll_2026_albany",
    label: "PLL — Albany",
    venue: "Albany, NY",
    start_date: "2026-05-29",
    end_date: "2026-05-30",
  },
  {
    window_key: "pll_2026_charlotte",
    label: "PLL — Charlotte",
    venue: "Charlotte, NC",
    start_date: "2026-06-05",
    end_date: "2026-06-06",
  },
  {
    window_key: "pll_2026_columbus",
    label: "PLL — Columbus",
    venue: "Columbus, OH",
    start_date: "2026-06-12",
    end_date: "2026-06-13",
  },
  {
    window_key: "pll_2026_baltimore",
    label: "PLL — Baltimore",
    venue: "Baltimore, MD",
    start_date: "2026-06-19",
    end_date: "2026-06-20",
  },
  {
    window_key: "pll_2026_denver",
    label: "PLL — Denver",
    venue: "Denver, CO",
    start_date: "2026-06-26",
    end_date: "2026-06-27",
  },
  {
    window_key: "pll_2026_dallas",
    label: "PLL — Dallas",
    venue: "Dallas, TX",
    start_date: "2026-07-10",
    end_date: "2026-07-11",
  },
  {
    window_key: "pll_2026_chicago",
    label: "PLL — Chicago",
    venue: "Chicago, IL",
    start_date: "2026-07-17",
    end_date: "2026-07-18",
  },
  {
    window_key: "pll_2026_los_angeles",
    label: "PLL — Los Angeles",
    venue: "Los Angeles, CA",
    start_date: "2026-07-24",
    end_date: "2026-07-25",
  },
  {
    window_key: "pll_2026_boston",
    label: "PLL — Boston",
    venue: "Boston, MA",
    start_date: "2026-08-07",
    end_date: "2026-08-08",
  },
  {
    window_key: "pll_2026_philadelphia",
    label: "PLL — Philadelphia",
    venue: "Philadelphia, PA",
    start_date: "2026-08-14",
    end_date: "2026-08-15",
  },
  {
    window_key: "pll_2026_semifinals",
    label: "PLL Semifinals",
    venue: "Location TBD",
    start_date: "2026-08-28",
    end_date: "2026-08-29",
  },
  {
    window_key: "pll_2026_championship",
    label: "PLL Championship Game",
    venue: "TBD",
    start_date: "2026-09-05",
    end_date: "2026-09-05",
  },
];

export const PLL_2026_STOPS: Pll2026Stop[] = [...PLL_2026_STOPS_UNSORTED].sort(
  (a, b) => a.start_date.localeCompare(b.start_date) || a.window_key.localeCompare(b.window_key),
);

export type Pll2026SpotlightStatus = "live" | "upcoming" | "ended";

export function pll2026SpotlightStatus(stop: Pll2026Stop, todayYmd: string): Pll2026SpotlightStatus {
  if (todayYmd >= stop.start_date && todayYmd <= stop.end_date) return "live";
  if (todayYmd < stop.start_date) return "upcoming";
  return "ended";
}

export function resolveFeaturedPll2026Stop(now: Date = new Date()): Pll2026Stop {
  const todayYmd = now.toISOString().slice(0, 10);
  const live = PLL_2026_STOPS.find((s) => todayYmd >= s.start_date && todayYmd <= s.end_date);
  if (live) return live;
  const upcoming = PLL_2026_STOPS.find((s) => todayYmd < s.start_date);
  if (upcoming) return upcoming;
  return PLL_2026_STOPS[PLL_2026_STOPS.length - 1]!;
}

export type LacrossePicksSpotlightPayload = {
  sport_key: "lacrosse";
  window_key: string;
  href: string;
  label_short: string;
  label_full: string;
  venue: string;
  status: Pll2026SpotlightStatus;
  starts_at: string;
  ends_at: string;
};

export function buildLacrossePicksSpotlightPayload(now: Date = new Date()): LacrossePicksSpotlightPayload {
  const stop = resolveFeaturedPll2026Stop(now);
  const todayYmd = now.toISOString().slice(0, 10);
  const status = pll2026SpotlightStatus(stop, todayYmd);
  return {
    sport_key: "lacrosse",
    window_key: stop.window_key,
    href: "/lacrosse",
    label_short: "Lacrosse",
    label_full: "Lacrosse Slate",
    venue: stop.label,
    status,
    starts_at: `${stop.start_date}T12:00:00.000Z`,
    ends_at: `${stop.end_date}T23:59:59.999Z`,
  };
}
