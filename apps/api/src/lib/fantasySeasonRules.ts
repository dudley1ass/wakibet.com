/**
 * Season leaderboard policy (v1). See docs/fantasy-rules-v1.md.
 */
export const FANTASY_SEASON_V1 = {
  skippedTournamentPoints: 0,
  scoringMode: "sum_all_tournaments",
  /** Tie order after total points: display name, then stable user id. */
  tieBreakerNote:
    "Ties: higher WakiPoints wins; if equal, alphabetical display name; if still equal, user id (stable). Same points share rank.",
} as const;
