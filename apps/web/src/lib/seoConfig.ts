export type SeoEntry = {
  title: string;
  description: string;
  /** If true, emit robots noindex,nofollow (admin / internal). */
  noindex?: boolean;
};

const SITE = "WakiBet";

const ROUTES: Record<string, SeoEntry> = {
  "/": {
    title: `${SITE} — Fantasy pickleball & NASCAR`,
    description:
      "Free-to-play fantasy for pickleball tournaments and NASCAR. Build lineups with WakiCash budgets, earn WakiPoints, and climb leaderboards.",
  },
  "/pick-teams": {
    title: `Pick / edit teams — pickleball tournament fantasy | ${SITE}`,
    description:
      "Pick up to five pickleball events per tournament, set captains, and save your multi-event fantasy lineup before locks hit.",
  },
  "/rosters": {
    title: `My rosters — pickleball fantasy | ${SITE}`,
    description:
      "Review your saved pickleball fantasy rosters, tournament shells, and lineup status across WakiBet seasons.",
  },
  "/pick-teams/leaderboard": {
    title: `Pickleball season leaderboard | ${SITE}`,
    description:
      "See how your WakiPoints rank against other players for the pickleball fantasy season on WakiBet.",
  },
  "/nascar": {
    title: `NASCAR fantasy hub | ${SITE}`,
    description:
      "Weekly NASCAR fantasy — race picks, WakiCash salaries, captain scoring, and tiebreak rules in one hub.",
  },
  "/nascar/rosters": {
    title: `My NASCAR lineups | ${SITE}`,
    description:
      "Your saved NASCAR weekly fantasy lineups, driver picks, and captain choices for each race week.",
  },
  "/nascar/scoring": {
    title: `NASCAR scoring table | ${SITE}`,
    description:
      "Official WakiBet NASCAR weekly fantasy scoring: finishing positions, stage points, captain multiplier, and tiebreakers.",
  },
  "/nascar/leaderboard": {
    title: `NASCAR season leaderboard | ${SITE}`,
    description:
      "Season-long NASCAR fantasy standings and WakiPoints leaderboard for WakiBet weekly picks.",
  },
  "/fantasy-rules": {
    title: `How fantasy works — rules | ${SITE}`,
    description:
      "WakiBet fantasy rules: WakiCash budgets, roster sizes, captains, gender mix for MLP, locks, and fair play.",
  },
  "/scoring-table": {
    title: `Pickleball scoring table | ${SITE}`,
    description:
      "WakiPoints table for pickleball fantasy: match wins, game margins, upsets, tiers, and MLP franchise bonuses.",
  },
  "/terms": {
    title: `Terms of Service | ${SITE}`,
    description: "Terms of Service governing your use of WakiBet accounts, fantasy games, and the website.",
  },
  "/privacy": {
    title: `Privacy Policy | ${SITE}`,
    description: "How WakiBet collects, uses, and protects personal data when you play fantasy and use the site.",
  },
  "/responsible-play": {
    title: `Responsible play | ${SITE}`,
    description:
      "Responsible gaming guidance for WakiBet: healthy play habits, self-awareness, and where to get help.",
  },
  "/contact": {
    title: `Contact | ${SITE}`,
    description: "Contact WakiBet for support, feedback, partnership questions, or account help.",
  },
  "/admin/lineups": {
    title: `Admin — users & lineups | ${SITE}`,
    description: "Internal WakiBet admin tools for support staff.",
    noindex: true,
  },
};

const DEFAULT: SeoEntry = {
  title: SITE,
  description:
    "WakiBet — fantasy pickleball tournaments and NASCAR weekly picks. Free-to-play lineups, scoring, and leaderboards.",
};

export function getSeoForPathname(pathname: string): SeoEntry {
  const path = pathname.endsWith("/") && pathname.length > 1 ? pathname.slice(0, -1) : pathname;
  return ROUTES[path] ?? DEFAULT;
}
