/** Public entry URLs for building a real tournament lineup (not guest demo). */

export const LINEUP_ENTRY = {
  pickleball: "/pick-teams",
  lacrosse: "/lacrosse",
  volleyball: "/volleyball",
  poker: "/auth?mode=register&from=poker_pick",
} as const;

export function lineupEntryForSport(sport: keyof typeof LINEUP_ENTRY): string {
  return LINEUP_ENTRY[sport];
}
