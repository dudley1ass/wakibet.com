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
 * 2026 AVP season structure (League, Heritage, Contenders) — dates/locations from the official schedule graphic.
 * Some weekends overlap across tiers; fantasy rules will need to pin which stop counts per slate.
 */
const AVP_2026_EVENTS_UNSORTED: Avp2026Event[] = [
  // AVP League
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
    event_key: "avp_2026_league_w5_los_angeles",
    category: "league",
    name: "AVP League Week 5",
    location: "Los Angeles, CA",
    start_date: "2026-07-11",
    end_date: "2026-07-12",
  },
  {
    event_key: "avp_2026_league_w6_central_park",
    category: "league",
    name: "AVP League Week 6",
    location: "Central Park, NY",
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
    event_key: "avp_2026_league_championships_chicago",
    category: "league",
    name: "AVP League Championships",
    location: "Chicago, IL",
    start_date: "2026-09-05",
    end_date: "2026-09-06",
  },
  // AVP Heritage (majors)
  {
    event_key: "avp_2026_heritage_huntington_beach",
    category: "heritage",
    name: "AVP Huntington Beach Open",
    location: "Huntington Beach, CA",
    start_date: "2026-05-14",
    end_date: "2026-05-17",
  },
  {
    event_key: "avp_2026_heritage_manhattan_beach",
    category: "heritage",
    name: "AVP Manhattan Beach Open",
    location: "Manhattan Beach, CA",
    start_date: "2026-08-14",
    end_date: "2026-08-16",
  },
  {
    event_key: "avp_2026_heritage_laguna",
    category: "heritage",
    name: "AVP Laguna Open",
    location: "Laguna Beach, CA",
    start_date: "2026-09-18",
    end_date: "2026-09-20",
  },
  // AVP Heritage Contenders
  {
    event_key: "avp_2026_contender_austin",
    category: "contender",
    name: "AVP Austin Open",
    location: "Austin, TX",
    start_date: "2026-04-17",
    end_date: "2026-04-18",
  },
  {
    event_key: "avp_2026_contender_south_florida",
    category: "contender",
    name: "AVP South Florida Open",
    location: "South Florida",
    start_date: "2026-05-23",
    end_date: "2026-05-24",
  },
  {
    event_key: "avp_2026_contender_virginia_beach",
    category: "contender",
    name: "AVP Virginia Beach Open",
    location: "Virginia Beach, VA",
    start_date: "2026-06-13",
    end_date: "2026-06-14",
  },
  {
    event_key: "avp_2026_contender_denver",
    category: "contender",
    name: "AVP Denver Open",
    location: "Denver, CO",
    start_date: "2026-07-04",
    end_date: "2026-07-05",
  },
  {
    event_key: "avp_2026_contender_waupaca",
    category: "contender",
    name: "AVP Waupaca Open",
    location: "Waupaca, WI",
    start_date: "2026-07-09",
    end_date: "2026-07-10",
  },
  {
    event_key: "avp_2026_contender_mother_lode",
    category: "contender",
    name: "AVP Mother Lode",
    location: "Grass Valley, CA",
    start_date: "2026-09-05",
    end_date: "2026-09-07",
  },
  {
    event_key: "avp_2026_contender_midwest",
    category: "contender",
    name: "AVP Midwest Open",
    location: "Midwest",
    start_date: "2026-09-26",
    end_date: "2026-09-27",
  },
  {
    event_key: "avp_2026_contender_santa_barbara",
    category: "contender",
    name: "AVP Santa Barbara Open",
    location: "Santa Barbara, CA",
    start_date: "2026-10-02",
    end_date: "2026-10-03",
  },
];

export const AVP_2026_EVENTS: Avp2026Event[] = [...AVP_2026_EVENTS_UNSORTED].sort(
  (a, b) => a.start_date.localeCompare(b.start_date) || a.event_key.localeCompare(b.event_key),
);
