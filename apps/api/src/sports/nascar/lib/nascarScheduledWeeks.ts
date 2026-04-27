/**
 * Canonical `NascarWeek.weekKey` values for seeded Cup events (lineup + dashboard URLs).
 * Times are stored as UTC; 2026-05-03 is EDT (UTC−4) in the eastern U.S.
 */
export const NASCAR_WEEK_KEY_WURTH400_TEXAS_MAY2026 = "2026_cup_wurth400_texas" as const;

/** Würth 400 presented by LIQUI MOLY — Texas Motor Speedway, 2026 Cup schedule. */
export const WURTH400_TEXAS_MAY2026 = {
  weekKey: NASCAR_WEEK_KEY_WURTH400_TEXAS_MAY2026,
  seasonYear: 2026,
  raceName: "Würth 400 presented by LIQUI MOLY",
  trackName: "Texas Motor Speedway",
  /** Green flag 2:30 PM ET (per product listing; adjust if series publishes a change). */
  raceStartAt: new Date("2026-05-03T18:30:00.000Z"),
  /** Lineup lock 60 minutes before green (1:30 PM ET). */
  lockAt: new Date("2026-05-03T17:30:00.000Z"),
} as const;
