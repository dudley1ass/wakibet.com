import type { SeoEntry } from "../lib/seoConfig";

export type ArticleSlug =
  | "pickleball-10-players-everyone-overrates"
  | "lacrosse-why-defense-wins-championships"
  | "volleyball-most-underrated-skill"
  | "poker-wsop-fantasy-strategy-explained"
  | "poker-which-poker-ranking-is-real"
  | "poker-wsop-leaderboard-vs-featured-pools"
  | "poker-wsop-fantasy-draft-names-not-results"
  | "poker-bracelets-vs-consistency-not-best-player"
  | "poker-main-event-survival-vs-skill"
  | "pickleball-50-ratings-vs-pro-qualifiers"
  | "pickleball-bangers-vs-soft-game-rec"
  | "pickleball-45-to-pro-gap-ego-check"
  | "volleyball-serve-receive-still-underrated"
  | "volleyball-club-hype-vs-player-development"
  | "lacrosse-attack-gets-too-much-credit"
  | "lacrosse-highlights-vs-fundamentals";

export type ArticleRecord = {
  slug: ArticleSlug;
  /** Single H1 on the page */
  headline: string;
  /** Meta description ~150–160 chars */
  description: string;
  /** Focus phrases for copy / internal linking hints */
  keywords: string[];
  datePublished: string;
  dateModified: string;
};

export const ARTICLES: ArticleRecord[] = [
  {
    slug: "pickleball-10-players-everyone-overrates",
    headline: "10 Pickleball Players Everyone Overrates (And What to Look at Instead)",
    description:
      "Why rec-league hype, highlight reels, and DUPR snapshots mislead pickleball fans—and how to judge talent for fantasy lineups, debates, and rankings.",
    keywords: [
      "pickleball fantasy",
      "pickleball rankings",
      "overrated pickleball players",
      "WakiBet",
      "MLP fantasy",
    ],
    datePublished: "2026-05-01",
    dateModified: "2026-05-06",
  },
  {
    slug: "lacrosse-why-defense-wins-championships",
    headline: "Why Defense Still Wins Championships in Professional Lacrosse",
    description:
      "How PLL defenses, goalies, and settled possessions decide playoff games—and what that means for lacrosse fantasy slates and confidence picks.",
    keywords: ["PLL lacrosse", "lacrosse defense", "lacrosse fantasy", "Utah Open", "WakiBet"],
    datePublished: "2026-05-02",
    dateModified: "2026-05-06",
  },
  {
    slug: "volleyball-most-underrated-skill",
    headline: "The Most Underrated Skill in Beach Volleyball (It Is Not What Instagram Shows)",
    description:
      "Serving, side-out rhythm, and defensive discipline matter more than viral swings. A guide for AVP fans building smarter fantasy and ranking arguments.",
    keywords: ["beach volleyball", "AVP", "volleyball fantasy", "side out", "WakiBet"],
    datePublished: "2026-05-03",
    dateModified: "2026-05-06",
  },
  {
    slug: "poker-wsop-fantasy-strategy-explained",
    headline: "WSOP Fantasy Strategy Explained: How to Think Like a Media Game, Not a Cash Game",
    description:
      "Bracelet pools, survivor formats, and public scoring reward different skills than traditional poker. Stack construction, variance, and narrative edges on WakiBet.",
    keywords: ["WSOP fantasy", "poker fantasy", "World Series of Poker", "fantasy poker strategy", "WakiBet"],
    datePublished: "2026-05-04",
    dateModified: "2026-05-06",
  },
  {
    slug: "poker-which-poker-ranking-is-real",
    headline: "Which Poker Ranking List Is the “Real” One — And Why None of Them Lie",
    description:
      "GPI-style indexes, Hendon Mob stats, WSOP earnings boards, and media hype measure different things. A plain-language map so fantasy players pick the right signal for each decision.",
    keywords: ["poker rankings", "GPI poker", "Hendon Mob", "WSOP leaderboard", "poker fantasy", "WakiBet"],
    datePublished: "2026-05-07",
    dateModified: "2026-05-07",
  },
  {
    slug: "poker-wsop-leaderboard-vs-featured-pools",
    headline: "Why the WSOP Website Leaderboard Is Not Your Fantasy Player Pool",
    description:
      "Site earnings boards reward legacy volume and visibility; WakiBet featured pools reward playability. How to translate one list into the other without drowning users in names.",
    keywords: ["WSOP leaderboard", "poker fantasy pool", "featured players", "salary cap fantasy", "WakiBet"],
    datePublished: "2026-05-07",
    dateModified: "2026-05-07",
  },
  {
    slug: "poker-wsop-fantasy-draft-names-not-results",
    headline: "Most WSOP Fantasy Players Draft Names Instead of Results",
    description:
      "Big-name pros get overdrafted every summer while anonymous grinders spike fantasy boards. Why narratives beat spreadsheets—and how to argue without sounding salty.",
    keywords: ["WSOP fantasy", "poker fantasy draft", "overdrafted players", "WakiBet"],
    datePublished: "2026-05-08",
    dateModified: "2026-05-08",
  },
  {
    slug: "poker-bracelets-vs-consistency-not-best-player",
    headline: "Bracelets Don’t Mean You’re the Best Tournament Player",
    description:
      "Bracelets vs consistency, WSOP volume vs high rollers, splashy wins vs quiet ROI—pick your poison and defend it without pretending one trophy tells the whole story.",
    keywords: ["WSOP bracelet", "tournament poker debate", "deep runs vs bracelets", "WakiBet"],
    datePublished: "2026-05-08",
    dateModified: "2026-05-08",
  },
  {
    slug: "poker-main-event-survival-vs-skill",
    headline: "The WSOP Main Event Rewards Survival More Than Skill",
    description:
      "Structure, depth, field size, and variance—why the biggest trophy in poker measures something besides pure edge.",
    keywords: ["WSOP Main Event", "poker variance", "luck vs skill poker", "WakiBet"],
    datePublished: "2026-05-08",
    dateModified: "2026-05-08",
  },
  {
    slug: "pickleball-50-ratings-vs-pro-qualifiers",
    headline: "Most 5.0 Players Would Get Destroyed in Pro Qualifiers",
    description:
      "DUPR inflation, regional truth gaps, and why “club rating” culture hates hearing about qualifier washouts.",
    keywords: ["pickleball DUPR", "5.0 pickleball", "pro qualifiers", "WakiBet"],
    datePublished: "2026-05-08",
    dateModified: "2026-05-08",
  },
  {
    slug: "pickleball-bangers-vs-soft-game-rec",
    headline: "Bangers Win More Recreational Games Than Dinkers",
    description:
      "At league night the loud wins steal highlights—but does the patient soft game still decide tight matches? Built for comments.",
    keywords: ["pickleball rec league", "bangers pickleball", "dinking strategy", "WakiBet"],
    datePublished: "2026-05-08",
    dateModified: "2026-05-08",
  },
  {
    slug: "pickleball-45-to-pro-gap-ego-check",
    headline: "The Gap Between 4.5 and Pro Is Bigger Than Most Players Realize",
    description:
      "Ego, training debates, and reality checks—why incremental ratings hide exponential gaps.",
    keywords: ["pickleball ratings", "4.5 vs pro", "pickleball skill gap", "WakiBet"],
    datePublished: "2026-05-08",
    dateModified: "2026-05-08",
  },
  {
    slug: "volleyball-serve-receive-still-underrated",
    headline: "Most Players Underrate Serve Receive Because It Isn’t Flashy",
    description:
      "Passers quietly decide matches while swings steal TikTok. Volleyball people live for this debate.",
    keywords: ["volleyball serve receive", "passing volleyball", "volleyball fundamentals", "WakiBet"],
    datePublished: "2026-05-08",
    dateModified: "2026-05-08",
  },
  {
    slug: "volleyball-club-hype-vs-player-development",
    headline: "Club Volleyball Culture Is Becoming More About Hype Than Development",
    description:
      "Parents, coaches, athletes—everyone has receipts when hype clips replace reps.",
    keywords: ["club volleyball", "junior volleyball culture", "volleyball training", "WakiBet"],
    datePublished: "2026-05-08",
    dateModified: "2026-05-08",
  },
  {
    slug: "lacrosse-attack-gets-too-much-credit",
    headline: "Attack Players Get Too Much Credit for Team Success",
    description:
      "Defense anchors possessions while highlights crown dodgers—PLL fans argue roster construction forever.",
    keywords: ["PLL lacrosse", "lacrosse attack vs defense", "lacrosse roles", "WakiBet"],
    datePublished: "2026-05-08",
    dateModified: "2026-05-08",
  },
  {
    slug: "lacrosse-highlights-vs-fundamentals",
    headline: "Highlight Culture Is Hurting Lacrosse Fundamentals",
    description:
      "Social clips reward flash while clears, rides, and settled possessions disappear from feeds—but not scoreboards.",
    keywords: ["lacrosse fundamentals", "lacrosse highlights", "PLL culture", "WakiBet"],
    datePublished: "2026-05-08",
    dateModified: "2026-05-08",
  },
];

const BY_SLUG = new Map(ARTICLES.map((a) => [a.slug, a]));

export function getArticleBySlug(slug: string): ArticleRecord | undefined {
  return BY_SLUG.get(slug as ArticleSlug);
}

/** Merge into `seoConfig` ROUTES */
export const ARTICLE_SEO_ROUTES: Record<string, SeoEntry> = {
  "/articles": {
    title: "Sports articles — fantasy, rankings & strategy | WakiBet",
    description:
      "Long-form WakiBet articles on pickleball fantasy, PLL lacrosse, AVP volleyball, and WSOP-style competition—SEO-friendly guides with actionable takeaways.",
  },
  ...Object.fromEntries(
    ARTICLES.map((a) => [
      `/articles/${a.slug}`,
      {
        title: `${a.headline} | WakiBet`,
        description: a.description,
      } satisfies SeoEntry,
    ]),
  ),
};

export function articleJsonLdGraph(params: {
  article: ArticleRecord;
  canonicalUrl: string;
  origin: string;
}): Record<string, unknown> {
  const { article, canonicalUrl, origin } = params;
  const logo = `${origin}/brand/logo-primary.svg`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: article.headline,
        description: article.description,
        datePublished: article.datePublished,
        dateModified: article.dateModified,
        mainEntityOfPage: { "@type": "WebPage", "@id": canonicalUrl },
        author: {
          "@type": "Organization",
          name: "WakiBet",
          url: origin,
        },
        publisher: {
          "@type": "Organization",
          name: "WakiBet",
          url: origin,
          logo: { "@type": "ImageObject", url: logo },
        },
        image: logo,
        keywords: article.keywords.join(", "),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${origin}/` },
          { "@type": "ListItem", position: 2, name: "Articles", item: `${origin}/articles` },
          {
            "@type": "ListItem",
            position: 3,
            name: article.headline,
            item: canonicalUrl,
          },
        ],
      },
    ],
  };
}

export function pathnameToArticle(pathname: string): ArticleRecord | null {
  const path = pathname.endsWith("/") && pathname.length > 1 ? pathname.slice(0, -1) : pathname;
  const prefix = "/articles/";
  if (!path.startsWith(prefix) || path === "/articles") return null;
  const slug = path.slice(prefix.length);
  return getArticleBySlug(slug) ?? null;
}
