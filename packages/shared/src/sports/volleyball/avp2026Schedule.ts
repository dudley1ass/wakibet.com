import { AVP_SOUTH_BEACH_MAY_OPEN_EVENT_KEY } from "./avpSouthBeachMayOpen2026Teams.js";

/** Calendar year for the AVP schedule shipped in the API (must match hub + seeds). */
export const AVP_2026_SEASON_YEAR = 2026 as const;

/** Heritage stop with bundled athlete + team CSV in the API (`avp_huntington_beach_open_athletes.csv`). */
export const AVP_HUNTINGTON_BEACH_OPEN_EVENT_KEY = "avp_2026_heritage_huntington_beach" as const;

export type AvpEventCategory = "league" | "heritage" | "contender";

export type Avp2026Event = {
  event_key: string;
  category: AvpEventCategory;
  name: string;
  location: string;
  /** Inclusive start (ISO date, America local dates as published). */
  start_date: string;
  /** Inclusive end (ISO date). */
  end_date: string;
};

/**
 * 2026 AVP season (Heritage, League, Contenders, majors, fall) — dates/locations per tour calendar.
 * Overlapping weekends (e.g. League Week 2 vs Virginia Beach) are both listed.
 */
const AVP_2026_EVENTS_UNSORTED: Avp2026Event[] = [
  {
    event_key: "avp_2026_heritage_huntington_beach",
    category: "heritage",
    name: "Huntington Beach Open",
    location: "Huntington Beach, CA",
    start_date: "2026-05-15",
    end_date: "2026-05-17",
  },
  {
    event_key: "avp_2026_contender_south_florida",
    category: "contender",
    name: "Pompano Beach Open",
    location: "Pompano Beach, FL",
    start_date: "2026-05-23",
    end_date: "2026-05-24",
  },
  {
    event_key: "avp_2026_league_w1_belmar",
    category: "league",
    name: "AVP League Week 1",
    location: "Belmar, NJ",
    start_date: "2026-05-30",
    end_date: "2026-05-31",
  },
  {
    event_key: "avp_2026_league_w2_aspen",
    category: "league",
    name: "AVP League Week 2",
    location: "Aspen, CO",
    start_date: "2026-06-06",
    end_date: "2026-06-07",
  },
  {
    event_key: "avp_2026_contender_virginia_beach",
    category: "contender",
    name: "Virginia Beach Open",
    location: "Virginia Beach, VA",
    start_date: "2026-06-06",
    end_date: "2026-06-07",
  },
  {
    event_key: "avp_2026_league_w3_miami",
    category: "league",
    name: "AVP League Week 3",
    location: "Miami, FL",
    start_date: "2026-06-12",
    end_date: "2026-06-13",
  },
  {
    event_key: "avp_2026_league_w4_las_vegas",
    category: "league",
    name: "AVP League Week 4",
    location: "Las Vegas, NV",
    start_date: "2026-06-19",
    end_date: "2026-06-20",
  },
  {
    event_key: "avp_2026_contender_denver",
    category: "contender",
    name: "Denver Open",
    location: "Denver, CO",
    start_date: "2026-07-03",
    end_date: "2026-07-05",
  },
  {
    event_key: "avp_2026_contender_waupaca",
    category: "contender",
    name: "Waupaca Open",
    location: "Waupaca, WI",
    start_date: "2026-07-08",
    end_date: "2026-07-10",
  },
  {
    event_key: "avp_2026_league_w5_long_beach",
    category: "league",
    name: "AVP League Week 5",
    location: "Long Beach, CA",
    start_date: "2026-07-11",
    end_date: "2026-07-12",
  },
  {
    event_key: "avp_2026_league_w6_new_york_city",
    category: "league",
    name: "AVP League Week 6",
    location: "New York City, NY",
    start_date: "2026-07-18",
    end_date: "2026-07-19",
  },
  {
    event_key: "avp_2026_league_w7_east_hampton",
    category: "league",
    name: "AVP League Week 7",
    location: "East Hampton, NY",
    start_date: "2026-07-25",
    end_date: "2026-07-26",
  },
  {
    event_key: "avp_2026_league_w8_dallas",
    category: "league",
    name: "AVP League Week 8",
    location: "Dallas, TX",
    start_date: "2026-08-07",
    end_date: "2026-08-08",
  },
  {
    event_key: "avp_2026_heritage_manhattan_beach",
    category: "heritage",
    name: "Manhattan Beach Open",
    location: "Manhattan Beach, CA",
    start_date: "2026-08-14",
    end_date: "2026-08-16",
  },
  {
    event_key: "avp_2026_league_championships_chicago",
    category: "league",
    name: "AVP League Championship",
    location: "Chicago, IL",
    start_date: "2026-09-05",
    end_date: "2026-09-06",
  },
  {
    event_key: "avp_2026_contender_mother_lode",
    category: "contender",
    name: "Motherlode",
    location: "Aspen, CO",
    start_date: "2026-09-05",
    end_date: "2026-09-07",
  },
  {
    event_key: "avp_2026_heritage_laguna",
    category: "heritage",
    name: "Laguna Beach Open",
    location: "Laguna Beach, CA",
    start_date: "2026-09-18",
    end_date: "2026-09-20",
  },
  {
    event_key: "avp_2026_contender_midwest",
    category: "contender",
    name: "Midwest Open",
    location: "Edwardsville, IL",
    start_date: "2026-09-25",
    end_date: "2026-09-27",
  },
  {
    event_key: "avp_2026_contender_santa_barbara",
    category: "contender",
    name: "Santa Barbara Open",
    location: "Santa Barbara, CA",
    start_date: "2026-10-02",
    end_date: "2026-10-03",
  },
];

export const AVP_2026_EVENTS: Avp2026Event[] = [...AVP_2026_EVENTS_UNSORTED].sort(
  (a, b) => a.start_date.localeCompare(b.start_date) || a.event_key.localeCompare(b.event_key),
);

/** Stops with a registered team list in the API (player pool + lineups). */
export const AVP_EVENT_KEYS_WITH_REGISTERED_POOL = [
  AVP_HUNTINGTON_BEACH_OPEN_EVENT_KEY,
  AVP_SOUTH_BEACH_MAY_OPEN_EVENT_KEY,
] as const;

export type Avp2026SpotlightStatus = "live" | "upcoming" | "ended";

export function avp2026SpotlightStatus(stop: Avp2026Event, todayYmd: string): Avp2026SpotlightStatus {
  if (todayYmd >= stop.start_date && todayYmd <= stop.end_date) return "live";
  if (todayYmd < stop.start_date) return "upcoming";
  return "ended";
}

/** Featured stop: in-window → next upcoming → last event on calendar. */
export function resolveFeaturedAvp2026Event(now: Date = new Date()): Avp2026Event {
  const todayYmd = now.toISOString().slice(0, 10);
  const live = AVP_2026_EVENTS.find((s) => todayYmd >= s.start_date && todayYmd <= s.end_date);
  if (live) return live;
  const upcoming = AVP_2026_EVENTS.find((s) => todayYmd < s.start_date);
  if (upcoming) return upcoming;
  return AVP_2026_EVENTS[AVP_2026_EVENTS.length - 1]!;
}

export type VolleyballPicksSpotlightPayload = {
  sport_key: "volleyball";
  window_key: string;
  href: string;
  label_short: string;
  label_full: string;
  venue: string;
  status: Avp2026SpotlightStatus;
  starts_at: string;
  ends_at: string;
};

export function buildVolleyballPicksSpotlightPayload(now: Date = new Date()): VolleyballPicksSpotlightPayload {
  const stop = resolveFeaturedAvp2026Event(now);
  const todayYmd = now.toISOString().slice(0, 10);
  const status = avp2026SpotlightStatus(stop, todayYmd);
  const poolKeys = AVP_EVENT_KEYS_WITH_REGISTERED_POOL as readonly string[];
  const href = poolKeys.includes(stop.event_key)
    ? `/volleyball-picks?event_key=${encodeURIComponent(stop.event_key)}`
    : "/volleyball-picks";
  return {
    sport_key: "volleyball",
    window_key: stop.event_key,
    href,
    label_short: "Volleyball",
    label_full: "Volleyball Picks",
    venue: stop.name,
    status,
    starts_at: `${stop.start_date}T12:00:00.000Z`,
    ends_at: `${stop.end_date}T23:59:59.999Z`,
  };
}
