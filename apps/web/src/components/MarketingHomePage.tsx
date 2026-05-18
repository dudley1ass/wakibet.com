import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { apiGet } from "../api";
import { trackHowItWorksClick, trackPlayInstantClick, trackRedditLead } from "../lib/analytics";
import DashboardSeasonPrizesStrip from "./dashboard/DashboardSeasonPrizesStrip";
import GuestDemoContest from "./GuestDemoContest";
import InstantPlayStrip from "./InstantPlayStrip";
import {
  getMarketingHotTakes,
  isThursdayHotTakeDay,
  marketingHotTakePeriodIndex,
} from "../lib/marketingHotTakes";

const sectionCard: React.CSSProperties = {
  background: "rgba(20, 20, 24, 0.92)",
  border: "1px solid rgba(148, 163, 184, 0.25)",
  borderRadius: 16,
  padding: 16,
  boxShadow: "0 20px 40px rgba(0,0,0,0.28)",
};

const PICKLEBALL_STRATEGY_ARTICLES: {
  slug: string;
  title: string;
  blurb: string;
}[] = [
  {
    slug: "pickleball-ppa-fantasy-captain-picks-mlp-dallas-2026",
    title: "MLP Dallas 2026: Captain picks & sleepers",
    blurb: "Weekly fantasy guide tied to the next MLP stop.",
  },
  {
    slug: "pickleball-fantasy-scoring-wakipoints-explained",
    title: "How WakiPoints scoring works",
    blurb: "Captain multipliers, WakiCash, and a 10-minute weekly workflow.",
  },
  {
    slug: "pickleball-10-players-everyone-overrates",
    title: "10 pickleball profiles fans overrate",
    blurb: "Archetypes to avoid when pricing fantasy lineups.",
  },
];

const FEATURED_ARTICLES: {
  slug: string;
  title: string;
  category: string;
  comments: number;
  trending: boolean;
  thumbMod: string;
}[] = [
  {
    slug: "pickleball-ppa-fantasy-captain-picks-mlp-dallas-2026",
    title: "MLP Dallas 2026 Fantasy: Captain Picks & Sleepers",
    category: "Pickleball strategy",
    comments: 0,
    trending: true,
    thumbMod: "article-thumb--pb",
  },
  {
    slug: "pickleball-fantasy-scoring-wakipoints-explained",
    title: "How Pickleball Fantasy Scoring Works (WakiPoints)",
    category: "Pickleball strategy",
    comments: 0,
    trending: true,
    thumbMod: "article-thumb--pb",
  },
  {
    slug: "pickleball-anna-leigh-waters-bad-for-pickleball",
    title: "Is Anna Leigh Waters Bad for Pickleball?",
    category: "Pickleball",
    comments: 0,
    trending: true,
    thumbMod: "article-thumb--pb",
  },
  {
    slug: "pickleball-dupr-ratings-inflated",
    title: "Most DUPR Ratings Are Inflated",
    category: "Pickleball",
    comments: 0,
    trending: true,
    thumbMod: "article-thumb--pb",
  },
  {
    slug: "pickleball-bangers-vs-soft-game-rec",
    title: "Bangers Beat Dinkers More Often Than People Admit",
    category: "Pickleball",
    comments: 0,
    trending: true,
    thumbMod: "article-thumb--pb",
  },
  {
    slug: "pickleball-pro-too-predictable",
    title: "Pro Pickleball Is Becoming Too Predictable",
    category: "Pickleball",
    comments: 0,
    trending: true,
    thumbMod: "article-thumb--pb",
  },
  {
    slug: "poker-wsop-main-event-endurance-more-than-skill",
    title: "The WSOP Main Event Rewards Endurance More Than Skill",
    category: "Poker",
    comments: 0,
    trending: true,
    thumbMod: "article-thumb--pk",
  },
  {
    slug: "poker-bracelets-overrated",
    title: "Bracelets Are Overrated",
    category: "Poker",
    comments: 0,
    trending: true,
    thumbMod: "article-thumb--pk",
  },
  {
    slug: "poker-pros-better-at-branding-than-poker",
    title: "Most Poker Pros Are Better at Branding Than Poker",
    category: "Poker",
    comments: 0,
    trending: true,
    thumbMod: "article-thumb--pk",
  },
  {
    slug: "poker-gto-made-poker-less-interesting",
    title: "GTO Has Made Poker Less Interesting to Watch",
    category: "Poker",
    comments: 0,
    trending: true,
    thumbMod: "article-thumb--pk",
  },
  {
    slug: "lacrosse-highlights-vs-fundamentals",
    title: "Lacrosse Culture Cares More About Highlights Than Fundamentals",
    category: "Lacrosse",
    comments: 0,
    trending: true,
    thumbMod: "article-thumb--lx",
  },
  {
    slug: "lacrosse-attack-gets-too-much-credit",
    title: "Attack Players Get Too Much Credit",
    category: "Lacrosse",
    comments: 0,
    trending: true,
    thumbMod: "article-thumb--lx",
  },
  {
    slug: "lacrosse-high-school-rankings-are-politics",
    title: "Most High School Lacrosse Rankings Are Politics",
    category: "Lacrosse",
    comments: 0,
    trending: true,
    thumbMod: "article-thumb--lx",
  },
  {
    slug: "volleyball-players-dont-understand-rotations",
    title: "Most Volleyball Players Don’t Actually Understand Rotations",
    category: "Volleyball",
    comments: 0,
    trending: true,
    thumbMod: "article-thumb--vb",
  },
  {
    slug: "volleyball-liberos-most-underrated-athletes",
    title: "Liberos Are the Most Underrated Athletes in Volleyball",
    category: "Volleyball",
    comments: 0,
    trending: true,
    thumbMod: "article-thumb--vb",
  },
  {
    slug: "volleyball-power-hitters-get-too-much-credit",
    title: "Power Hitters Get Too Much Credit",
    category: "Volleyball",
    comments: 0,
    trending: true,
    thumbMod: "article-thumb--vb",
  },
];

function HotTakeCard({
  text,
  agreeStart,
  disagreeStart,
}: {
  text: string;
  agreeStart: number;
  disagreeStart: number;
}) {
  const [agree, setAgree] = useState(agreeStart);
  const [disagree, setDisagree] = useState(disagreeStart);
  const [vote, setVote] = useState<"agree" | "disagree" | null>(null);

  function pick(side: "agree" | "disagree") {
    if (vote === side) return;
    if (vote === "agree") setAgree((n) => n - 1);
    if (vote === "disagree") setDisagree((n) => n - 1);
    if (side === "agree") setAgree((n) => n + 1);
    else setDisagree((n) => n + 1);
    setVote(side);
  }

  const total = agree + disagree;

  return (
    <article className="hot-take-card">
      <p className="hot-take-card__quote">&ldquo;{text}&rdquo;</p>
      <div className="hot-take-card__actions">
        <button type="button" className="hot-take-card__btn hot-take-card__btn--agree" onClick={() => pick("agree")}>
          Agree · {agree}
        </button>
        <button type="button" className="hot-take-card__btn hot-take-card__btn--disagree" onClick={() => pick("disagree")}>
          Disagree · {disagree}
        </button>
      </div>
      <div className="hot-take-card__meta">
        <span>{total} votes</span>
        <span className="hot-take-card__hint">Tap to vote (demo)</span>
      </div>
    </article>
  );
}

const REDDIT_COMMUNITIES: { label: string; href: string }[] = [
  { label: "r/Fantasy_Pickleball", href: "https://www.reddit.com/r/Fantasy_Pickleball/" },
  { label: "r/Fantasy_Lacrosse", href: "https://www.reddit.com/r/Fantasy_Lacrosse/" },
  { label: "r/Fantasy_Volleyball", href: "https://www.reddit.com/r/Fantasy_Volleyball/" },
  { label: "r/Fantasy_Poker", href: "https://www.reddit.com/r/Fantasy_Poker/" },
];

const HERO_FANTASY_SPORTS: { label: string; href: string; title: string }[] = [
  { label: "Pickleball", href: "/pick-teams", title: "Pickleball tournament fantasy" },
  { label: "Lacrosse", href: "/lacrosse", title: "PLL lacrosse fantasy" },
  { label: "Volleyball", href: "/volleyball", title: "AVP beach volleyball fantasy" },
  { label: "WSOP", href: "/poker/pick", title: "WSOP fantasy poker" },
];

type LandingStats = {
  generated_at: string;
  registered_users: number;
  saved_lineups: number;
  pickleball_slate: {
    label: string;
    venue: string;
    status: "live" | "upcoming" | "ended";
    starts_at: string;
    href: string;
  } | null;
};

function LandingSocialProof({ stats }: { stats: LandingStats | undefined }) {
  const users = stats?.registered_users ?? 0;
  const lineups = stats?.saved_lineups ?? 0;

  return (
    <section className="landing-activity-strip" aria-label="Platform activity">
      <div className="landing-activity-strip__item">
        <strong>{users > 0 ? users : "—"}</strong>
        <span>players registered</span>
      </div>
      <div className="landing-activity-strip__item">
        <strong>{lineups > 0 ? lineups : "—"}</strong>
        <span>lineups saved</span>
      </div>
      <div className="landing-activity-strip__item landing-activity-strip__item--wide landing-activity-strip__item--rankings">
        <strong>New pickleball ranking system</strong>
        <span>PPA Tour 2026 — win rate, opponent strength, and participation across all five pro divisions.</span>
        <Link className="landing-activity-strip__link" to="/pickleball/rankings">
          Explore rankings →
        </Link>
      </div>
    </section>
  );
}

function LandingRedditStrip() {
  return (
    <section className="landing-reddit-strip" aria-label="Reddit communities">
      <div className="landing-reddit-strip__copy">
        <p className="landing-reddit-strip__kicker">From Reddit</p>
        <h2 className="landing-reddit-strip__title">Join the niche fantasy conversation</h2>
        <p className="landing-reddit-strip__lede">
          Pickleball, lacrosse, volleyball, and poker — each sport has its own subreddit. Debate picks, share lineups,
          and tell us what to build next.
        </p>
      </div>
      <div className="landing-reddit-strip__actions">
        {REDDIT_COMMUNITIES.map((sub, i) => (
          <a
            key={sub.href}
            className={i === 0 ? "dash-main-btn" : "dash-ghost-btn"}
            href={sub.href}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackRedditLead()}
          >
            {sub.label}
          </a>
        ))}
      </div>
    </section>
  );
}

export default function MarketingHomePage() {
  const spotlightQuery = useQuery({
    queryKey: ["landing", "picks-spotlight"] as const,
    queryFn: () =>
      apiGet<{
        generated_at: string;
        items: {
          sport_key: string;
          window_key: string;
          href: string;
          label_short: string;
          label_full: string;
          venue: string;
          status: "live" | "upcoming" | "ended";
          starts_at: string;
          ends_at: string;
        }[];
      }>("/api/v1/picks/spotlight", { timeoutMs: 20_000 }),
    staleTime: 60_000,
    retry: 1,
  });
  const lacrosseQuery = useQuery({
    queryKey: ["landing", "lacrosse-current"] as const,
    queryFn: () =>
      apiGet<{
        slate_key: string;
        name: string;
        season_year: number;
        lock_at: string;
        lines: { line_id: string; line_key: string; team_a: string; team_b: string; confidence: number }[];
      }>("/api/v1/lacrosse/current", { timeoutMs: 20_000 }),
    staleTime: 60_000,
    retry: 1,
  });
  const landingStatsQuery = useQuery({
    queryKey: ["landing", "public-stats"] as const,
    queryFn: () => apiGet<LandingStats>("/api/v1/public/landing-stats", { timeoutMs: 20_000 }),
    staleTime: 60_000,
    retry: 1,
  });
  const spotlightItems = spotlightQuery.data?.items ?? [];
  const hotTakePeriod = marketingHotTakePeriodIndex();
  const hotTakeThursday = isThursdayHotTakeDay();
  const hotTakes = useMemo(
    () =>
      getMarketingHotTakes({
        spotlightItems,
        lacrosseSlateName: lacrosseQuery.data?.name,
      }),
    [hotTakePeriod, hotTakeThursday, spotlightItems, lacrosseQuery.data?.name],
  );
  const pickleballSpotlight =
    spotlightItems.find((x) => x.sport_key === "pickleball") ?? spotlightItems[0];

  return (
    <div className="marketing-page">
      <div style={{ maxWidth: 1140, margin: "0 auto", padding: "20px 16px 48px", color: "#e5e7eb" }}>
        <header className="marketing-header">
          <img src="/brand/logo-primary.svg" alt="WakiBet" style={{ height: 34, width: "auto" }} />
          <nav style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link className="dash-ghost-btn" to="/articles">
              Articles
            </Link>
            <Link className="dash-ghost-btn" to="/auth?mode=login">
              Log in
            </Link>
            <Link className="dash-main-btn" to="/auth?mode=register">
              Create account
            </Link>
          </nav>
        </header>

        {/* Hero — visual energy + motion */}
        <section className="landing-hero">
          <div className="landing-hero__mesh" aria-hidden />
          <div className="landing-hero__grid">
            <div className="landing-hero__copy">
              <div
                className="landing-hero__sport-banner landing-hero__sport-banner--inline landing-hero__sport-banner--hero-top"
                aria-label="Fantasy sports on WakiBet"
              >
                <span className="landing-hero__sport-banner-kicker">Free fantasy for</span>
                <div className="landing-hero__sport-banner-list landing-hero__sport-banner-list--links">
                  {HERO_FANTASY_SPORTS.map((sport, i) => (
                    <span key={sport.href} className="landing-hero__sport-banner-entry">
                      {i > 0 ? (
                        <span className="landing-hero__sport-banner-dot" aria-hidden>
                          •
                        </span>
                      ) : null}
                      <Link className="landing-hero__sport-link" to={sport.href} title={sport.title}>
                        {sport.label}
                      </Link>
                    </span>
                  ))}
                </div>
              </div>
              <p className="landing-hero__eyebrow">100% free — no entry fees, no deposits</p>
              <h1 className="landing-hero__title">Pick players. Earn points. Climb weekly leaderboards.</h1>
              <p className="landing-hero__lede">
                Build lineups for pickleball, lacrosse, beach volleyball, and WSOP-style poker fantasy — plus our new PPA
                player rankings built from real tournament results.
              </p>
              <div className="landing-hero__cta-row landing-hero__cta-row--hero">
                <Link
                  className="dash-main-btn landing-cta-lineup"
                  to="/play"
                  onClick={() => trackPlayInstantClick("hero_create_lineup")}
                >
                  <span className="landing-cta-lineup__title">Create free lineup</span>
                  <span className="landing-cta-lineup__sub">Play instantly — no account required</span>
                </Link>
                <Link className="dash-ghost-btn landing-cta-rankings" to="/pickleball/rankings">
                  New pickleball rankings
                </Link>
                <Link
                  className="dash-ghost-btn"
                  to="/leaderboard/pickleball"
                  onClick={() => trackPlayInstantClick("hero_leaderboard")}
                >
                  Public leaderboard
                </Link>
              </div>
            </div>
          </div>
        </section>

        <LandingSocialProof stats={landingStatsQuery.data} />

        <InstantPlayStrip />

        <GuestDemoContest compact />

        <LandingRedditStrip />

        <section
          id="how-it-works"
          style={{ ...sectionCard, marginBottom: 16 }}
          onClick={() => trackHowItWorksClick("homepage_section")}
        >
          <h2 style={{ marginTop: 0, color: "#f8fafc", fontSize: "1.15rem" }}>How it works</h2>
          <ol className="landing-how-steps">
            <li>
              <strong>Pick players</strong> under a WakiCash salary cap for the week&apos;s slate.
            </li>
            <li>
              <strong>Earn WakiPoints</strong> from real match results — captains score more.
            </li>
            <li>
              <strong>Climb leaderboards</strong> and compare lineups with the community.
            </li>
          </ol>
          {pickleballSpotlight ? (
            <p className="dash-sub" style={{ marginBottom: 0 }}>
              This week: <strong>{pickleballSpotlight.label_full}</strong> ({pickleballSpotlight.venue}) —{" "}
              <Link to={pickleballSpotlight.href}>view slate</Link>
            </p>
          ) : null}
        </section>

        <section style={{ ...sectionCard, marginBottom: 16 }}>
          <h2 style={{ marginTop: 0, color: "#f8fafc", fontSize: "1.15rem" }}>Pickleball strategy & projections</h2>
          <p className="dash-sub" style={{ marginTop: 0 }}>
            Rankings and weekly guides are the fastest way to learn the game — updated for live MLP and PPA slates.
          </p>
          <div className="landing-strategy-links">
            {PICKLEBALL_STRATEGY_ARTICLES.map((a) => (
              <Link key={a.slug} to={`/articles/${a.slug}`} className="landing-strategy-links__card">
                <strong>{a.title}</strong>
                <span>{a.blurb}</span>
              </Link>
            ))}
            <Link to="/pickleball/rankings" className="landing-strategy-links__card landing-strategy-links__card--rankings">
              <strong>PPA Tour 2026 rankings</strong>
              <span>Win rate, opponent strength, and participation — all five pro divisions.</span>
            </Link>
          </div>
        </section>

        <details className="landing-more-sports" style={{ marginBottom: 16 }}>
          <summary>How each sport works · invest hub</summary>
          <div className="landing-hero__cta-row" style={{ marginTop: 12, flexWrap: "wrap", gap: 8 }}>
            <Link className="dash-ghost-btn" to="/info/pickleball">
              Pickleball rules
            </Link>
            <Link className="dash-ghost-btn" to="/info/lacrosse">
              Lacrosse rules
            </Link>
            <Link className="dash-ghost-btn" to="/info/volleyball">
              Volleyball rules
            </Link>
            <Link className="dash-ghost-btn" to="/info/poker">
              WSOP fantasy rules
            </Link>
            <Link className="dash-ghost-btn" to="/info/invest">
              Invest
            </Link>
          </div>
          <div className="landing-hero__season-prizes" style={{ marginTop: 12 }}>
            <DashboardSeasonPrizesStrip twoLineCaption />
          </div>
        </details>

        {/* Hot Takes — scroll feed + votes */}
        <section className="marketing-section marketing-section--hot">
          <div className="marketing-section__head">
            <h2 className="marketing-section__title">Hot Takes</h2>
            <span className="marketing-section__subtitle">
              {hotTakeThursday
                ? "Thursday focus — who’s winning this weekend’s tournaments? Spotlights pull from this week’s stops."
                : "Fresh set every two days — agree, disagree, argue."}
            </span>
          </div>
          <div className="hot-take-scroller">
            {hotTakes.map((t) => (
              <HotTakeCard key={t.id} text={t.text} agreeStart={t.agree} disagreeStart={t.disagree} />
            ))}
          </div>
        </section>

        {/* Featured articles — card layout */}
        <section className="marketing-section">
          <h2 style={{ marginTop: 0, color: "#f8fafc", marginBottom: 4 }}>Debate & community articles</h2>
          <p className="dash-sub" style={{ marginTop: 0, marginBottom: 16 }}>
            Hot takes with a Reddit thread on every piece — open an article, then jump to the discussion link at the
            bottom and keep arguing where the internet actually argues.
          </p>
          <div className="featured-articles-grid">
            {FEATURED_ARTICLES.map((a) => (
              <Link key={a.slug} to={`/articles/${a.slug}`} className="featured-article-card">
                <div className={`featured-article-card__thumb ${a.thumbMod}`}>
                  {a.trending ? <span className="featured-article-card__badge">Trending</span> : null}
                  <span className="featured-article-card__cat">{a.category}</span>
                </div>
                <div className="featured-article-card__body">
                  <h3 className="featured-article-card__title">{a.title}</h3>
                  <div className="featured-article-card__meta">
                    <span>{a.comments > 0 ? `${a.comments} comments` : "Discussion linked"}</span>
                    <span>Read →</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          <p className="dash-sub" style={{ marginTop: 16, marginBottom: 0 }}>
            <Link to="/articles">Browse all articles →</Link>
          </p>
        </section>

        <section style={{ ...sectionCard, textAlign: "center" }}>
          <h2 style={{ marginTop: 0, color: "#f8fafc" }}>Save your lineup — free account</h2>
          <p style={{ color: "#cbd5e1" }}>
            Try the demo above, then register to enter weekly contests and climb the leaderboard.
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap" }}>
            <Link className="dash-main-btn" to="/auth?mode=register&from=homepage">
              Create account
            </Link>
            <Link className="dash-ghost-btn" to="/auth?mode=login">
              Log in
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
