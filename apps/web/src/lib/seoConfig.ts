import { ARTICLE_SEO_ROUTES } from "../articles/registry";

export type SeoEntry = {
  title: string;
  description: string;
  /** If true, emit robots noindex,nofollow (admin / internal). */
  noindex?: boolean;
};

const SITE = "WakiBet";

const ROUTES: Record<string, SeoEntry> = {
  "/": {
    title: `${SITE} — Fantasy pickleball, lacrosse & volleyball`,
    description:
      "Free-to-play fantasy for pickleball tournaments, PLL lacrosse, and beach volleyball. Build lineups with WakiCash budgets, earn WakiPoints, and climb leaderboards.",
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
  "/volleyball": {
    title: `AVP beach volleyball — 2026 schedule hub | ${SITE}`,
    description:
      "2026 AVP League, Heritage, and Contender tour stops with dates and locations on WakiBet — fantasy lineups and scoring coming soon (pickleball-style WakiCash and captains).",
  },
  "/fantasy-rules": {
    title: `How fantasy works — rules | ${SITE}`,
    description:
      "WakiBet fantasy rules: WakiCash budgets, roster sizes, captains, gender mix for MLP, locks, and fair play.",
  },
  "/week-picks": {
    title: `This week’s fantasy picks — MLP Dallas & AVP | ${SITE}`,
    description:
      "This week on WakiBet: MLP Dallas 2026 pickleball targets and AVP beach volleyball schedule highlights — lineups, value, and strategy.",
  },
  "/ppa-atlanta-picks": {
    title: `This week’s fantasy picks — MLP Dallas & AVP | ${SITE}`,
    description:
      "This week on WakiBet: MLP Dallas 2026 pickleball targets and AVP beach volleyball schedule highlights — lineups, value, and strategy.",
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
  "/auth": {
    title: `Sign in or create account | ${SITE}`,
    description:
      "Log in or register for WakiBet: free-to-play fantasy pickleball, lacrosse, volleyball, and community competition.",
  },
  ...ARTICLE_SEO_ROUTES,
};

const DEFAULT: SeoEntry = {
  title: SITE,
  description:
    "WakiBet — fantasy pickleball, lacrosse, and volleyball. Free-to-play lineups, scoring, and leaderboards.",
};

export function getSeoForPathname(pathname: string): SeoEntry {
  const path = pathname.endsWith("/") && pathname.length > 1 ? pathname.slice(0, -1) : pathname;
  return ROUTES[path] ?? DEFAULT;
}
