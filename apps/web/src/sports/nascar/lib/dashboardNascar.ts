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
  picks: { slot_index: number; driver_key: string; driver_name: string; is_captain: boolean }[];
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
  return lineup.picks.filter((p) => p.is_captain).length === 1;
}
