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
  "/lacrosse": {
    title: `Utah Open — PLL lacrosse hub, ratings & WakiCash | ${SITE}`,
    description:
      "Utah Open PLL slate on WakiBet: team power ratings, spread and odds lines, and 100-point WakiCash allocation.",
  },
  "/lacrosse/scoring": {
    title: `Lacrosse scoring and rating table | ${SITE}`,
    description:
      "How Wakibet calculates PLL lacrosse team ratings and WakiCash slate payouts from offense, defense, goalie, form, possession, schedule, and venue factors.",
  },
  "/lacrosse/rosters": {
    title: `My lacrosse rosters | ${SITE}`,
    description: "Your saved Wakibet lacrosse WakiCash allocations and projected return by slate.",
  },
  "/fantasy-rules": {
    title: `How fantasy works — rules | ${SITE}`,
    description:
      "WakiBet fantasy rules: WakiCash budgets, roster sizes, captains, gender mix for MLP, locks, and fair play.",
  },
  "/ppa-atlanta-picks": {
    title: `PPA Atlanta fantasy picks — top plays & value | ${SITE}`,
    description:
      "Pickleball fantasy picks for PPA Atlanta: top targets, value plays, sleepers, and lineup strategy with WakiCash.",
  },
  "/nascar-texas-picks": {
    title: `NASCAR Texas fantasy picks — TMS lineup ideas | ${SITE}`,
    description:
      "NASCAR fantasy picks for Texas Motor Speedway: drivers to target, value plays, sleepers, and weekly lineup tips.",
  },
  "/scoring-table": {
    title: `Pickleball scoring table | ${SITE}`,
    description:
      "WakiPoints table for pickleball fantasy: match wins, game margins, upsets, tiers, and MLP franchise bonuses.",
  },
  "/wakiodds": {
    title: `WakiOdds calculation table | ${SITE}`,
    description:
      "How Wakibet calculates WakiOdds: Elo win probability, American odds conversion, spread mapping, confidence, and rating updates.",
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
