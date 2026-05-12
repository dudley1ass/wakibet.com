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
  "/lacrosse/leaderboard": {
    title: `Lacrosse standings — PLL & fantasy leaderboard | ${SITE}`,
    description:
      "Wakibet lacrosse standings: user fantasy leaderboard for PLL fantasy plus the top PLL scorers by season points.",
  },
  "/volleyball/leaderboard": {
    title: `Volleyball standings — AVP & fantasy leaderboard | ${SITE}`,
    description:
      "Wakibet volleyball standings: user fantasy leaderboard for AVP 2026 plus the top priced AVP players by event.",
  },
  "/poker/leaderboard": {
    title: `Poker standings — WSOP & fantasy leaderboard | ${SITE}`,
    description:
      "Wakibet poker standings: user fantasy leaderboard for WSOP 2026 plus the WSOP.com-style top 50 earnings board.",
  },
  "/poker/rosters": {
    title: `My WSOP rosters | ${SITE}`,
    description:
      "Your saved Wakibet WSOP 2026 lineups across the five main events — six players per event, 100 WakiCash cap.",
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
  "/poker/scoring": {
    title: `WSOP fantasy — WakiCash & scoring table | ${SITE}`,
    description:
      "WSOP Las Vegas fantasy on WakiBet: 100 WakiCash cap, 6-player lineups, finish-based points, event tier multipliers, optional bonuses, and MVP scoring formula.",
  },
  "/poker/pick": {
    title: `WSOP fantasy — pick your lineup | ${SITE}`,
    description:
      "Build a 6-player WSOP fantasy lineup under a 100 WakiCash cap using the featured pool — same dashboard styling as pickleball picks.",
  },
  "/invest": {
    title: `Invest — Weekly Stock Pick'em | ${SITE}`,
    description:
      "Free stock-picking contest using virtual portfolios. $100,000 in virtual cash, five picks, locks at the Monday market open, settles at the Friday close. No real money is invested.",
  },
  "/invest/pick": {
    title: `Invest — build your weekly portfolio | ${SITE}`,
    description:
      "Pick five stocks or ETFs from a curated universe and allocate virtual cash for the Wakibet Weekly Stock Pick'em. Highest weekly return wins.",
  },
  "/invest/portfolios": {
    title: `My Invest portfolios | ${SITE}`,
    description:
      "Your saved virtual portfolios for the Wakibet Weekly Stock Pick'em — live return, lock and settle status across every weekly contest.",
  },
  "/invest/leaderboard": {
    title: `Invest standings — Weekly Stock Pick'em | ${SITE}`,
    description:
      "Live Wakibet user leaderboard for the Weekly Stock Pick'em — portfolio return % vs a $100,000 starting bank.",
  },
  "/invest/scoring": {
    title: `Invest — rules and scoring | ${SITE}`,
    description:
      "How Wakibet's Weekly Stock Pick'em works: $100,000 virtual cash, 5 picks, max 30% per position, Monday open lock, Friday close settle, portfolio-return scoring.",
  },
  "/info/invest": {
    title: `Invest — how the contest works | ${SITE}`,
    description:
      "How the Wakibet Weekly Stock Pick'em works: virtual $100,000 starting cash, pick five stocks or ETFs, lock Monday open, settle Friday close. No real money is invested.",
  },
  "/fantasy-rules": {
    title: `How fantasy works — rules | ${SITE}`,
    description:
      "WakiBet fantasy rules: WakiCash budgets, roster sizes, captains, gender mix for MLP, locks, and fair play.",
  },
  "/info/pickleball": {
    title: `Pickleball fantasy — WakiCash & WakiPoints | ${SITE}`,
    description:
      "How WakiBet pickleball fantasy works: WakiCash budgets, captains, earning WakiPoints from tournaments, and links to the full scoring table.",
  },
  "/info/volleyball": {
    title: `Volleyball fantasy — WakiCash & lineups | ${SITE}`,
    description:
      "How WakiBet beach volleyball fantasy works: 100 WakiCash salary cap, five-player rosters, captains, and WakiPoints from tour results.",
  },
  "/info/lacrosse": {
    title: `Lacrosse fantasy — WakiCash on PLL slates | ${SITE}`,
    description:
      "How WakiBet PLL lacrosse slates work: allocating 100 WakiCash across lines, locks, and how returns relate to posted odds and ratings.",
  },
  "/info/poker": {
    title: `Poker fantasy — WSOP WakiCash lineups | ${SITE}`,
    description:
      "How WakiBet WSOP fantasy works: salary-cap lineups in WakiCash, featured player pools, and scoring from published outcome tables.",
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
