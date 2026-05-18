/** Guest draft for pickleball tournament lineup — restored after sign-up when possible. */

export type PendingTournamentLineup = {
  tournament_key: string;
  season_key: string;
  events: {
    slot_index: number;
    event_key: string;
    picks: { player_name: string; is_captain: boolean }[];
    mlp_team_name?: string;
    predicted_total_matches?: number;
  }[];
  saved_at: string;
};

const STORAGE_KEY = "wakibet_pending_tournament_lineup_v1";

export function savePendingTournamentLineup(lineup: PendingTournamentLineup): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lineup));
  } catch {
    /* quota */
  }
}

export function loadPendingTournamentLineup(): PendingTournamentLineup | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PendingTournamentLineup;
  } catch {
    return null;
  }
}

export function clearPendingTournamentLineup(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}
