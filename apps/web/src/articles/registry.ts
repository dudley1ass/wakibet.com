import type { SeoEntry } from "../lib/seoConfig";

export type ArticleSlug =
  | "pickleball-10-players-everyone-overrates"
  | "lacrosse-why-defense-wins-championships"
  | "volleyball-most-underrated-skill"
  | "poker-wsop-fantasy-strategy-explained";

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
