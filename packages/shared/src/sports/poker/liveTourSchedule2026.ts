/**
 * 2026 live poker festival calendar for fantasy contest scaffolding.
 * ISO dates; stable `event_key` values for future player pools and lineups.
 */

export type PokerTourTier = "major" | "international" | "regional";

export type PokerLiveTourEvent2026 = {
  event_key: string;
  /** YYYY-MM-DD */
  start_date: string;
  end_date: string;
  country: string;
  city: string;
  /** Short tour / series label */
  series_code: string;
  /** Display title (includes series context where helpful) */
  title: string;
  tier: PokerTourTier;
};

export const POKER_LIVE_TOUR_SEASON_YEAR = 2026;

export const POKER_LIVE_TOUR_2026_EVENTS: PokerLiveTourEvent2026[] = [
  {
    event_key: "merit_carmen_kyrenia_2026",
    start_date: "2026-04-27",
    end_date: "2026-05-07",
    country: "Cyprus",
    city: "Kyrenia",
    series_code: "Merit",
    title: "Merit Poker Classic — Carmen Series",
    tier: "international",
  },
  {
    event_key: "pgt_texas_houston_2026",
    start_date: "2026-04-29",
    end_date: "2026-05-11",
    country: "United States",
    city: "Houston",
    series_code: "PGT",
    title: "PokerGO Tour — PGT Texas Poker Open",
    tier: "international",
  },
  {
    event_key: "chamada_prime_2026",
    start_date: "2026-04-29",
    end_date: "2026-05-11",
    country: "Cyprus",
    city: "Chamada",
    series_code: "Chamada",
    title: "Chamada Prime Poker Series ($2M GTD)",
    tier: "international",
  },
  {
    event_key: "ept_monte_carlo_2026",
    start_date: "2026-04-30",
    end_date: "2026-05-10",
    country: "Monaco",
    city: "Monte Carlo",
    series_code: "EPT",
    title: "European Poker Tour — EPT Monte Carlo",
    tier: "major",
  },
  {
    event_key: "spt_sofia_23_2026",
    start_date: "2026-05-01",
    end_date: "2026-05-10",
    country: "Bulgaria",
    city: "Sofia",
    series_code: "SPT",
    title: "Smart Poker Tour — SPT 23 Sofia",
    tier: "regional",
  },
  {
    event_key: "party_madrid_2026",
    start_date: "2026-05-11",
    end_date: "2026-05-17",
    country: "Spain",
    city: "Madrid",
    series_code: "PartyPoker",
    title: "The PartyPoker Tour — Madrid",
    tier: "international",
  },
  {
    event_key: "888live_barcelona_2026",
    start_date: "2026-05-14",
    end_date: "2026-05-24",
    country: "Spain",
    city: "Barcelona",
    series_code: "888poker",
    title: "888poker LIVE — Barcelona",
    tier: "international",
  },
  {
    event_key: "unibet_paris_2026",
    start_date: "2026-05-14",
    end_date: "2026-05-25",
    country: "France",
    city: "Paris",
    series_code: "Unibet",
    title: "Unibet Open — UO & UDSO Paris",
    tier: "international",
  },
  {
    event_key: "wsop_2026_las_vegas",
    start_date: "2026-05-26",
    end_date: "2026-07-15",
    country: "United States",
    city: "Las Vegas",
    series_code: "WSOP",
    title: "57th World Series of Poker — WSOP 2026",
    tier: "major",
  },
  {
    event_key: "battle_malta_spring_2026",
    start_date: "2026-05-27",
    end_date: "2026-06-03",
    country: "Malta",
    city: "St Julian's",
    series_code: "BoM",
    title: "Battle of Malta 2026 — Spring Edition",
    tier: "international",
  },
  {
    event_key: "sigma_manila_2026",
    start_date: "2026-05-30",
    end_date: "2026-06-04",
    country: "Philippines",
    city: "Manila",
    series_code: "SiGMA",
    title: "SiGMA Poker Tour — SPT Manila",
    tier: "international",
  },
  {
    event_key: "festival_rozvadov_2026",
    start_date: "2026-06-09",
    end_date: "2026-06-15",
    country: "Czech Republic",
    city: "Rozvadov",
    series_code: "Festival",
    title: "The Festival in Rozvadov",
    tier: "international",
  },
  {
    event_key: "thmc_nottingham_2026",
    start_date: "2026-07-08",
    end_date: "2026-07-12",
    country: "England",
    city: "Nottingham",
    series_code: "THMC",
    title: "The Hendon Mob Championship — Nottingham",
    tier: "international",
  },
  {
    event_key: "rdpt_jeju_2026",
    start_date: "2026-07-08",
    end_date: "2026-07-19",
    country: "South Korea",
    city: "Jeju",
    series_code: "RDPT",
    title: "Red Dragon Poker Tour — RDPT Plus Jeju Summer 2026",
    tier: "international",
  },
  {
    event_key: "thmc_liechtenstein_2026",
    start_date: "2026-08-18",
    end_date: "2026-08-23",
    country: "Liechtenstein",
    city: "Gamprin-Bendern",
    series_code: "THMC",
    title: "The Hendon Mob Championship — Liechtenstein",
    tier: "international",
  },
];
