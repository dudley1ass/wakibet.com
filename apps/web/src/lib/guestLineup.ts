export type GuestLineupSport = "pickleball" | "lacrosse" | "volleyball" | "poker";

export type GuestLineup = {
  sport: GuestLineupSport;
  tournament_key: string;
  tournament_name: string;
  player_names: string[];
  display_names: string[];
  projected_score: number;
  waki_cash_spent: number;
  saved_at: string;
};

const STORAGE_KEY = "wakibet_guest_lineup_v1";

export function saveGuestLineup(lineup: GuestLineup): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lineup));
  } catch {
    /* quota / private mode */
  }
}

export function loadGuestLineup(): GuestLineup | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as GuestLineup;
  } catch {
    return null;
  }
}

export function clearGuestLineup(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}
