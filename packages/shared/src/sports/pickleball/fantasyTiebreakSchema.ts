/**
 * Authoritative tiebreak ladder for **pickleball** season standings (WakiPoints first; these apply on ties only).
 * Order: compare #1; if still tied, go to #2, then #3, etc.
 */
export const PICKLEBALL_FANTASY_TIEBREAK_STEPS = [
  {
    id: 1,
    key: "best_single_player_raw",
    label: "Highest individual player score (best single raw pick in any scored event)",
  },
  {
    id: 2,
    key: "captain_score",
    label: "Highest captain score (1.5× raw WakiPoints on the captain slot)",
  },
  {
    id: 3,
    key: "franchise_match_wins",
    label: "Franchise team match wins (MLP team bonus layer; season total)",
  },
  {
    id: 4,
    key: "franchise_undefeated",
    label: "Undefeated franchise bonus (earned in any MLP event)",
  },
  {
    id: 5,
    key: "match_count_prediction",
    label: "Closest prediction: total matches in the event (user entry vs schedule)",
  },
] as const;

export type PickleballFantasyTiebreakKey = (typeof PICKLEBALL_FANTASY_TIEBREAK_STEPS)[number]["key"];
