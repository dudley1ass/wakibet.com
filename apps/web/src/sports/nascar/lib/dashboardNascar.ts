export type NascarWeekRow = {
  week_key: string;
  race_name: string;
  track: string;
  race_start_at: string;
  lock_at: string;
  status: "upcoming" | "locked" | "closed";
};

export type NascarLineupPayload = {
  week_key: string;
  lineup_size: number;
  /** Whole seconds P1 ahead of P2 at the line (tiebreaker #1). */
  tiebreaker_win_margin_seconds: number | null;
  /** Predicted total caution laps in the race (tiebreaker #2). */
  tiebreaker_caution_laps: number | null;
  picks: {
    slot_index: number;
    driver_key: string;
    driver_name: string;
    car_number?: string | null;
    sponsor?: string | null;
    manufacturer?: string | null;
    team_name?: string | null;
    is_captain: boolean;
    waki_cash_price: number;
    is_elite: boolean;
  }[];
};

export function nascarFocusWeek(weeks: NascarWeekRow[]): NascarWeekRow | null {
  const open = weeks.find((w) => w.status === "upcoming");
  if (open) return open;
  const live = weeks.find((w) => w.status === "locked");
  if (live) return live;
  return weeks[0] ?? null;
}

export function nascarLineupComplete(lineup: NascarLineupPayload | undefined, size: number): boolean {
  if (!lineup) return false;
  if (lineup.picks.length !== size) return false;
  if (lineup.picks.filter((p) => p.is_captain).length !== 1) return false;
  if (lineup.tiebreaker_win_margin_seconds == null || lineup.tiebreaker_caution_laps == null) return false;
  return true;
}
