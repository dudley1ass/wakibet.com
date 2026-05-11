/**
 * Pickleball pro skill ratings — top 50 men + top 50 women.
 * Used by the public landing-page demo to price the player pool by world rank
 * (rather than by per-tournament results), so the visible WakiCash reflects
 * each player's actual standing in the sport.
 */

export type PickleballSkillGender = "M" | "F";

export type PickleballSkillRating = {
  rank: number;
  player_name: string;
  gender: PickleballSkillGender;
};

export const PICKLEBALL_MENS_TOP_50: ReadonlyArray<{ rank: number; player_name: string }> = [
  { rank: 1, player_name: "Christopher Haworth" },
  { rank: 2, player_name: "Federico Staksrud" },
  { rank: 3, player_name: "Hunter Johnson" },
  { rank: 4, player_name: "Zane Ford" },
  { rank: 5, player_name: "Christian Alshon" },
  { rank: 6, player_name: "Ben Johns" },
  { rank: 7, player_name: "Jack Sock" },
  { rank: 8, player_name: "Roscoe Bellamy" },
  { rank: 9, player_name: "Ammar Wazir" },
  { rank: 10, player_name: "Jaume Martinez Vich" },
  { rank: 11, player_name: "Connor Garnett" },
  { rank: 12, player_name: "John Goins" },
  { rank: 13, player_name: "Noe Khlif" },
  { rank: 14, player_name: "JW Johnson" },
  { rank: 15, player_name: "Mohaned Alhouni" },
  { rank: 16, player_name: "Mota Alhouni" },
  { rank: 17, player_name: "Matthew Barlow" },
  { rank: 18, player_name: "Tama Shimabukuro" },
  { rank: 19, player_name: "Dylan Frazier" },
  { rank: 20, player_name: "Nam Ly Hoang" },
  { rank: 21, player_name: "Adam Harvey" },
  { rank: 22, player_name: "Gabriel Joseph" },
  { rank: 23, player_name: "Gabriel Tardio" },
  { rank: 24, player_name: "Yates Johnson" },
  { rank: 25, player_name: "Luca Mack" },
  { rank: 26, player_name: "Donald Young" },
  { rank: 27, player_name: "Phuc Huynh" },
  { rank: 28, player_name: "Grayson Goldin" },
  { rank: 29, player_name: "Rafael Lenhard" },
  { rank: 30, player_name: "Camden Chaffin" },
  { rank: 31, player_name: "Dusty Boyer" },
  { rank: 32, player_name: "Eric Oncins" },
  { rank: 33, player_name: "Alexander Crum" },
  { rank: 34, player_name: "Rafa Hewett" },
  { rank: 35, player_name: "Cason Campbell" },
  { rank: 36, player_name: "Jay Devilliers" },
  { rank: 37, player_name: "Brandon French" },
  { rank: 38, player_name: "Ronan Camron" },
  { rank: 39, player_name: "Oliver Frank" },
  { rank: 40, player_name: "Connor Mogle" },
  { rank: 41, player_name: "Luc Pham" },
  { rank: 42, player_name: "Jhonnatan Medina Alvarez" },
  { rank: 43, player_name: "Marshall Brown" },
  { rank: 44, player_name: "Youssef Bouzidi" },
  { rank: 45, player_name: "Tyson Mcguffin" },
  { rank: 46, player_name: "Eric Roddy" },
  { rank: 47, player_name: "Tom Protzek" },
  { rank: 48, player_name: "Max Green" },
  { rank: 49, player_name: "Truong Hien" },
  { rank: 50, player_name: "Richard Livornese Jr" },
];

export const PICKLEBALL_WOMENS_TOP_50: ReadonlyArray<{ rank: number; player_name: string }> = [
  { rank: 1, player_name: "Anna Leigh Waters" },
  { rank: 2, player_name: "Kate Fahey" },
  { rank: 3, player_name: "Parris Todd" },
  { rank: 4, player_name: "Katerina Stewart" },
  { rank: 5, player_name: "Sofia Sewing" },
  { rank: 6, player_name: "Lea Jansen" },
  { rank: 7, player_name: "Kaitlyn Christian" },
  { rank: 8, player_name: "Seone Mendez" },
  { rank: 9, player_name: "Brooke Buckner" },
  { rank: 10, player_name: "Kiora Kunimoto" },
  { rank: 11, player_name: "Catherine Parenteau" },
  { rank: 12, player_name: "Genie Bouchard" },
  { rank: 13, player_name: "Judit Castillo Gargallo" },
  { rank: 14, player_name: "Sahra Dennehy" },
  { rank: 15, player_name: "Chao Yi Wang" },
  { rank: 16, player_name: "Mary Brascia" },
  { rank: 17, player_name: "Andie Dikosavljevic" },
  { rank: 18, player_name: "Domenika Turkovic" },
  { rank: 19, player_name: "Roos Van Reek" },
  { rank: 20, player_name: "Salome Devidze" },
  { rank: 21, player_name: "Samantha Parker" },
  { rank: 22, player_name: "Yufei Long" },
  { rank: 23, player_name: "Jorja Johnson" },
  { rank: 24, player_name: "Kao Pei Chuan" },
  { rank: 25, player_name: "Victoria DiMuzio" },
  { rank: 26, player_name: "Isabella Dunlap" },
  { rank: 27, player_name: "Yu-Chieh Hsieh" },
  { rank: 28, player_name: "Bobbi Oshiro" },
  { rank: 29, player_name: "Michaela Haet" },
  { rank: 30, player_name: "Simone Jardim" },
  { rank: 31, player_name: "Lina Padegimaite" },
  { rank: 32, player_name: "Rika Fujiwara" },
  { rank: 33, player_name: "Emilia Schmidt" },
  { rank: 34, player_name: "Liz Truluck" },
  { rank: 35, player_name: "Cailyn Campbell" },
  { rank: 36, player_name: "Samantha Buyckx" },
  { rank: 37, player_name: "Amber Policare" },
  { rank: 38, player_name: "Milan Rane" },
  { rank: 39, player_name: "Jessica Warren" },
  { rank: 40, player_name: "Zoey Weil" },
  { rank: 41, player_name: "Lara Giltinan" },
  { rank: 42, player_name: "Carlota Trevino" },
  { rank: 43, player_name: "Selina Turulja" },
  { rank: 44, player_name: "Katie Morris" },
  { rank: 45, player_name: "Estee Widdershoven" },
  { rank: 46, player_name: "Madalina Grigoriu" },
  { rank: 47, player_name: "Lingwei Kong" },
  { rank: 48, player_name: "Hannah Blatt" },
  { rank: 49, player_name: "Keilly Ulery" },
  { rank: 50, player_name: "Karin Ptaszek-Kochis" },
];

/** Canonical key: lowercase, "Last, First" flipped to "first last", whitespace collapsed. */
function nameKey(input: string): string {
  let s = input.trim().toLowerCase().replace(/\./g, "");
  if (s.includes(",")) {
    const parts = s.split(",").map((p) => p.trim());
    if (parts.length === 2 && parts[0] && parts[1]) s = `${parts[1]} ${parts[0]}`;
  }
  return s.replace(/\s+/g, " ");
}

const RATING_LOOKUP: Map<string, PickleballSkillRating> = (() => {
  const m = new Map<string, PickleballSkillRating>();
  for (const r of PICKLEBALL_MENS_TOP_50) {
    m.set(nameKey(r.player_name), { rank: r.rank, player_name: r.player_name, gender: "M" });
  }
  for (const r of PICKLEBALL_WOMENS_TOP_50) {
    m.set(nameKey(r.player_name), { rank: r.rank, player_name: r.player_name, gender: "F" });
  }
  return m;
})();

export function findPickleballSkillRating(playerName: string): PickleballSkillRating | null {
  return RATING_LOOKUP.get(nameKey(playerName)) ?? null;
}

/**
 * Map a player's gender-rank to a WakiCash tier in WAKICASH_COST_TIERS [40,32,24,16,10].
 * Players outside the top 50 (or with no rating match) fall to the cheapest tier.
 */
export function pickleballDemoWakiCashFromRating(playerName: string): number {
  const rating = findPickleballSkillRating(playerName);
  if (!rating) return 10;
  const r = rating.rank;
  if (r <= 5) return 40;
  if (r <= 10) return 32;
  if (r <= 20) return 24;
  if (r <= 35) return 16;
  return 10;
}
