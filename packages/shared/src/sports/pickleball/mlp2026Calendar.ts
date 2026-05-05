/**
 * 2026 MLP event calendar (source: tour schedule). Used to pick the featured stop for
 * dashboard hero, picks spotlight, and default tournament selection.
 */
export const MLP_2026_CALENDAR = [
  {
    tournament_key: "mlp_dallas_2026",
    label: "MLP Dallas 2026",
    venue: "Dallas, TX",
    start_date: "2026-05-22",
    end_date: "2026-05-25",
  },
  {
    tournament_key: "mlp_columbus_2026",
    label: "MLP Columbus 2026",
    venue: "Columbus, OH",
    start_date: "2026-05-28",
    end_date: "2026-05-31",
  },
  {
    tournament_key: "mlp_st_louis_2026",
    label: "MLP St. Louis 2026",
    venue: "St. Louis, MO",
    start_date: "2026-06-04",
    end_date: "2026-06-07",
  },
  {
    tournament_key: "mlp_austin_2026",
    label: "MLP Austin 2026",
    venue: "Austin, TX",
    start_date: "2026-06-11",
    end_date: "2026-06-14",
  },
  {
    tournament_key: "mlp_st_petersburg_2026",
    label: "MLP St. Petersburg 2026",
    venue: "St. Petersburg, FL",
    start_date: "2026-06-17",
    end_date: "2026-06-21",
  },
  {
    tournament_key: "mlp_new_york_2026",
    label: "MLP New York 2026",
    venue: "New York, NY",
    start_date: "2026-06-25",
    end_date: "2026-06-28",
  },
  {
    tournament_key: "mlp_grand_rapids_2026",
    label: "MLP Grand Rapids 2026",
    venue: "Grand Rapids, MI",
    start_date: "2026-07-08",
    end_date: "2026-07-12",
  },
  {
    tournament_key: "mlp_san_diego_2026",
    label: "MLP San Diego 2026",
    venue: "San Diego, CA",
    start_date: "2026-07-16",
    end_date: "2026-07-19",
  },
  {
    tournament_key: "mlp_chicago_2026",
    label: "MLP Chicago 2026",
    venue: "Chicago, IL",
    start_date: "2026-07-23",
    end_date: "2026-07-26",
  },
  {
    tournament_key: "mlp_orlando_2026",
    label: "MLP Orlando 2026",
    venue: "Orlando, FL",
    start_date: "2026-07-30",
    end_date: "2026-08-02",
  },
  {
    tournament_key: "mlp_dallas_playoffs_2026",
    label: "MLP Dallas Playoffs 2026",
    venue: "Dallas, TX",
    start_date: "2026-08-06",
    end_date: "2026-08-09",
  },
  {
    tournament_key: "mlp_newport_beach_2026",
    label: "MLP Newport Beach 2026",
    venue: "Newport Beach, CA",
    start_date: "2026-08-13",
    end_date: "2026-08-16",
  },
  {
    tournament_key: "mlp_new_york_championship_2026",
    label: "MLP New York Championship 2026",
    venue: "New York, NY",
    start_date: "2026-08-28",
    end_date: "2026-08-30",
  },
] as const;

export type Mlp2026TournamentKey = (typeof MLP_2026_CALENDAR)[number]["tournament_key"];

export type Mlp2026CalendarStop = (typeof MLP_2026_CALENDAR)[number];

export const PICKLEBALL_TOURNAMENT_KEYS = [
  ...MLP_2026_CALENDAR.map((s) => s.tournament_key),
  "atlanta_weekend",
] as const;

export type PickleballTournamentKey = (typeof PICKLEBALL_TOURNAMENT_KEYS)[number];

export function isPickleballTournamentKey(s: string): s is PickleballTournamentKey {
  return (PICKLEBALL_TOURNAMENT_KEYS as readonly string[]).includes(s);
}

/** YYYY-MM-DD in UTC (good enough for tour stop boundaries). */
export function utcCalendarDayYmd(d: Date = new Date()): string {
  return d.toISOString().slice(0, 10);
}

/**
 * Featured stop: in-window event if today falls on dates; otherwise next upcoming;
 * if the season is over, the last championship weekend.
 */
export function resolveFeaturedMlp2026Tournament(now: Date = new Date()): Mlp2026CalendarStop {
  const todayYmd = utcCalendarDayYmd(now);
  const live = MLP_2026_CALENDAR.find((s) => todayYmd >= s.start_date && todayYmd <= s.end_date);
  if (live) return live;
  const upcoming = MLP_2026_CALENDAR.find((s) => todayYmd < s.start_date);
  if (upcoming) return upcoming;
  return MLP_2026_CALENDAR[MLP_2026_CALENDAR.length - 1]!;
}

export type Mlp2026SpotlightStatus = "live" | "upcoming" | "ended";

export function mlp2026SpotlightStatus(stop: Mlp2026CalendarStop, todayYmd: string): Mlp2026SpotlightStatus {
  if (todayYmd >= stop.start_date && todayYmd <= stop.end_date) return "live";
  if (todayYmd < stop.start_date) return "upcoming";
  return "ended";
}

export type PicksSpotlightPickleballPayload = {
  sport_key: "pickleball";
  window_key: string;
  href: string;
  label_short: string;
  label_full: string;
  venue: string;
  status: Mlp2026SpotlightStatus;
  starts_at: string;
  ends_at: string;
};

/** Pickleball row for GET /api/v1/picks/spotlight (calendar-driven; not DB). */
export function buildPickleballPicksSpotlightPayload(now: Date = new Date()): PicksSpotlightPickleballPayload {
  const stop = resolveFeaturedMlp2026Tournament(now);
  const todayYmd = utcCalendarDayYmd(now);
  const status = mlp2026SpotlightStatus(stop, todayYmd);
  const enc = encodeURIComponent(stop.tournament_key);
  return {
    sport_key: "pickleball",
    window_key: stop.tournament_key,
    href: `/pick-teams?tournament_key=${enc}`,
    label_short: "Pickleball",
    label_full: "Pickleball Picks",
    venue: stop.label,
    status,
    starts_at: `${stop.start_date}T12:00:00.000Z`,
    ends_at: `${stop.end_date}T23:59:59.999Z`,
  };
}
