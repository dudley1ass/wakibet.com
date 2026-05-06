import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { apiGet } from "../api";

const sectionCard: React.CSSProperties = {
  background: "rgba(20, 20, 24, 0.92)",
  border: "1px solid rgba(148, 163, 184, 0.25)",
  borderRadius: 16,
  padding: 16,
  boxShadow: "0 20px 40px rgba(0,0,0,0.28)",
};

const badgeStyle: React.CSSProperties = {
  display: "inline-block",
  padding: "4px 10px",
  borderRadius: 999,
  border: "1px solid rgba(251, 191, 36, 0.45)",
  color: "#fcd34d",
  fontSize: 12,
  marginBottom: 6,
};

const SPORT_HUBS: {
  label: string;
  icon: string;
  hover: string;
  debates: number;
  pulse?: string;
  to?: string;
}[] = [
  {
    label: "Pickleball",
    icon: "🏓",
    hover:
      "Fantasy pickleball: build multi-event lineups with a WakiCash budget, set captains, and score WakiPoints across tournaments and leaderboards.",
    debates: 212,
    pulse: "+18 today",
  },
  {
    label: "Volleyball",
    icon: "🏐",
    hover:
      "Beach volleyball fantasy: roster picks tied to tour events, caps and captains — compete for season and event standings when live.",
    debates: 94,
    pulse: "live stops",
  },
  {
    label: "Lacrosse",
    icon: "🥍",
    hover:
      "Lacrosse fantasy: PLL-style slates — spread lines, confidence picks, and WakiCash-style allocations on game outcomes.",
    debates: 156,
    pulse: "PLL slate",
  },
  {
    label: "Poker",
    icon: "♠️",
    hover:
      "WSOP Las Vegas 2026 fantasy: flagship slates, 6 picks, 100 WakiCash, simple scoring — no real-money wagering on WakiBet.",
    debates: 0,
    pulse: "WSOP ’26",
    to: "/poker",
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
    slug: "poker-wsop-fantasy-draft-names-not-results",
    title: "Most WSOP Fantasy Players Draft Names Instead of Results",
    category: "Poker",
    comments: 0,
    trending: true,
    thumbMod: "article-thumb--pk",
  },
  {
    slug: "poker-bracelets-vs-consistency-not-best-player",
    title: "Bracelets Don’t Mean You’re the Best Tournament Player",
    category: "Poker",
    comments: 0,
    trending: true,
    thumbMod: "article-thumb--pk",
  },
  {
    slug: "poker-main-event-survival-vs-skill",
    title: "The WSOP Main Event Rewards Survival More Than Skill",
    category: "Poker",
    comments: 0,
    trending: true,
    thumbMod: "article-thumb--pk",
  },
  {
    slug: "pickleball-50-ratings-vs-pro-qualifiers",
    title: "Most 5.0 Players Would Get Destroyed in Pro Qualifiers",
    category: "Pickleball",
    comments: 0,
    trending: true,
    thumbMod: "article-thumb--pb",
  },
  {
    slug: "pickleball-bangers-vs-soft-game-rec",
    title: "Bangers Win More Recreational Games Than Dinkers",
    category: "Pickleball",
    comments: 0,
    trending: false,
    thumbMod: "article-thumb--pb",
  },
  {
    slug: "pickleball-45-to-pro-gap-ego-check",
    title: "The Gap Between 4.5 and Pro Is Bigger Than Most Players Realize",
    category: "Pickleball",
    comments: 0,
    trending: false,
    thumbMod: "article-thumb--pb",
  },
  {
    slug: "volleyball-serve-receive-still-underrated",
    title: "Most Players Underrate Serve Receive Because It Isn’t Flashy",
    category: "Volleyball",
    comments: 0,
    trending: true,
    thumbMod: "article-thumb--vb",
  },
  {
    slug: "volleyball-club-hype-vs-player-development",
    title: "Club Volleyball Culture Is Becoming More About Hype Than Development",
    category: "Volleyball",
    comments: 0,
    trending: false,
    thumbMod: "article-thumb--vb",
  },
  {
    slug: "lacrosse-attack-gets-too-much-credit",
    title: "Attack Players Get Too Much Credit for Team Success",
    category: "Lacrosse",
    comments: 0,
    trending: true,
    thumbMod: "article-thumb--lx",
  },
  {
    slug: "lacrosse-highlights-vs-fundamentals",
    title: "Highlight Culture Is Hurting Lacrosse Fundamentals",
    category: "Lacrosse",
    comments: 0,
    trending: false,
    thumbMod: "article-thumb--lx",
  },
];

const HOT_TAKES_SEED = [
  {
    id: "ht1",
    text: "Ben Johns is overrated in doubles when the pace gets messy — change my mind.",
    agree: 342,
    disagree: 189,
  },
  {
    id: "ht2",
    text: "PLL defenses are finally catching up to the offensive explosion.",
    agree: 267,
    disagree: 112,
  },
  {
    id: "ht3",
    text: "Volleyball analytics over-weight kills and under-weight side-out sustainability.",
    agree: 198,
    disagree: 203,
  },
  {
    id: "ht4",
    text: "Pickleball 5.0 ratings are inflated at half the clubs in Florida.",
    agree: 421,
    disagree: 156,
  },
  {
    id: "ht5",
    text: "Fantasy should reward boring consistency over one viral highlight reel.",
    agree: 512,
    disagree: 89,
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
  const oddsQuery = useQuery({
    queryKey: ["landing", "featured-odds"] as const,
    queryFn: () =>
      apiGet<{
        updated_at: string;
        markets: {
          pickleball: { source: string; team_a: { label: string; rating: number }; team_b: { label: string; rating: number } };
          lacrosse: { source: string; team_a: { label: string; rating: number }; team_b: { label: string; rating: number } };
        };
      }>("/api/v1/wakiodds/featured", { timeoutMs: 20_000 }),
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
  const spotlightItems = spotlightQuery.data?.items ?? [];
  const liveSpotlight = spotlightItems.find((x) => x.status === "live") ?? spotlightItems[0];
  const lacrosseLines = lacrosseQuery.data?.lines ?? [];

  const pbGap = useMemo(() => {
    if (!oddsQuery.data) return null;
    return Math.abs(
      oddsQuery.data.markets.pickleball.team_a.rating - oddsQuery.data.markets.pickleball.team_b.rating,
    );
  }, [oddsQuery.data]);

  return (
    <div className="marketing-page">
      <div style={{ maxWidth: 1140, margin: "0 auto", padding: "20px 16px 48px", color: "#e5e7eb" }}>
        <header className="marketing-header">
          <img src="/brand/logo-primary.svg" alt="WakiBet" style={{ height: 34, width: "auto" }} />
          <nav style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link className="dash-ghost-btn" to="/auth?mode=login">
              Log in
            </Link>
            <Link className="dash-main-btn" to="/auth?mode=register">
              Create account
            </Link>
          </nav>
        </header>

        <p className="marketing-disclaimer">
          <strong>Fantasy only — no real-money wagering YET!!</strong> Coming Soon!! WakiBet is for skill-based fantasy and
          community play, not sports betting.
        </p>

        {/* Hero — visual energy + motion */}
        <section className="landing-hero">
          <div className="landing-hero__mesh" aria-hidden />
          <div className="landing-hero__grid">
            <div className="landing-hero__copy">
              <div style={badgeStyle}>Sports media + fantasy ecosystem</div>
              <p style={{ margin: "0 0 6px", color: "#86efac", fontSize: 14, fontWeight: 600 }}>
                100% free to play — no entry fees, no deposits required.
              </p>
              <h1 className="landing-hero__title">Where Sports Fans Compete Beyond the Scoreboard</h1>
              <p className="landing-hero__lede">
                Rankings, debates, hot takes, and fantasy — built for fans who live in the comments section as much as the
                scoreboard.
              </p>

              {/* Primary CTA = Explore Rankings (community / viral hook) */}
              <div className="landing-hero__cta-primary">
                <Link className="dash-main-btn landing-cta-rankings" to="/week-picks">
                  Explore Rankings &amp; Picks Hub
                </Link>
              </div>
              <div className="landing-hero__cta-row">
                <Link className="dash-ghost-btn" to="/auth?mode=register">
                  Join Early Access
                </Link>
                <Link className="dash-ghost-btn" to="/auth?mode=register">
                  Enter Fantasy Contest
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", marginBottom: 16 }}>
          {[
            ["Fantasy Contests", "Predict performances and compete with friends."],
            ["Community Rankings", "Debate overrated and underrated players."],
            ["Sports Intelligence", "Stats, matchups, trends, and hot takes."],
          ].map(([title, body]) => (
            <article key={title} style={sectionCard}>
              <h3 style={{ margin: "0 0 8px", color: "#f8fafc" }}>{title}</h3>
              <p style={{ margin: 0, color: "#cbd5e1" }}>{body}</p>
            </article>
          ))}
        </section>

        {/* Hot Takes — scroll feed + votes */}
        <section className="marketing-section marketing-section--hot">
          <div className="marketing-section__head">
            <h2 className="marketing-section__title">Hot Takes</h2>
            <span className="marketing-section__subtitle">Agree, disagree, argue — the feed that drives the community.</span>
          </div>
          <div className="hot-take-scroller">
            {HOT_TAKES_SEED.map((t) => (
              <HotTakeCard key={t.id} text={t.text} agreeStart={t.agree} disagreeStart={t.disagree} />
            ))}
          </div>
        </section>

        <section style={{ ...sectionCard, marginBottom: 16 }}>
          <h2 style={{ marginTop: 0, color: "#f8fafc" }}>Trending Content</h2>
          <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
            {(spotlightItems.length
              ? spotlightItems.map((item) => `${item.label_short} — ${item.venue}`)
              : [
                  "Most overrated 5.0 pickleball player?",
                  "Hardest position in lacrosse?",
                  "Would old-school volleyball teams survive today?",
                  "Best sleeper picks this week",
                  "Players trending upward right now",
                  "Who wins this matchup?",
                ]
            ).map((item) => (
              <div key={item} style={{ ...sectionCard, padding: 12 }}>
                {item}
              </div>
            ))}
          </div>
        </section>

        <section style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", marginBottom: 16 }}>
          {[
            [
              "🔥 Trending Debates",
              liveSpotlight
                ? `${liveSpotlight.label_full} (${liveSpotlight.status.toUpperCase()})`
                : "Most heated conversations in the last 24h.",
            ],
            [
              "📈 Fastest Rising Players",
              pbGap != null ? `Pickleball rating gap: ${pbGap}` : "Names climbing fast in community rankings.",
            ],
            [
              "🏆 Weekly Fantasy Leaders",
              lacrosseQuery.data ? `${lacrosseQuery.data.name} (${lacrosseLines.length} active lines)` : "Top fantasy performers across active contests.",
            ],
            [
              "🎯 Most Picked Sleeper",
              lacrosseLines[0] ? `${lacrosseLines[0].team_a} vs ${lacrosseLines[0].team_b}` : "Most-backed underdog selections this week.",
            ],
          ].map(([title, body]) => (
            <article key={title} style={sectionCard}>
              <h3 style={{ margin: "0 0 8px" }}>{title}</h3>
              <p style={{ margin: 0, color: "#cbd5e1" }}>{body}</p>
            </article>
          ))}
        </section>

        <section style={{ ...sectionCard, marginBottom: 16 }}>
          <h2 style={{ marginTop: 0 }}>Sport Hubs</h2>
          <p className="dash-sub" style={{ marginTop: 0, marginBottom: 12 }}>
            Hover for fantasy rules · activity is illustrative until full community launch.
          </p>
          <div className="sport-hub-grid">
            {SPORT_HUBS.map((hub) => {
              const cardInner = (
                <>
                  <div className="sport-hub-card__icon">{hub.icon}</div>
                  <div className="sport-hub-card__label">{hub.label}</div>
                  <div className="sport-hub-card__stats">
                    {hub.debates > 0 ? (
                      <>
                        <span className="sport-hub-card__heat">🔥 {hub.debates} active debates</span>
                        <span className="sport-hub-card__pulse">{hub.pulse}</span>
                      </>
                    ) : (
                      <span className="sport-hub-card__pulse">{hub.pulse}</span>
                    )}
                  </div>
                </>
              );
              return hub.to ? (
                <Link key={hub.label} to={hub.to} title={hub.hover} className="sport-hub-card">
                  {cardInner}
                </Link>
              ) : (
                <div key={hub.label} title={hub.hover} className="sport-hub-card">
                  {cardInner}
                </div>
              );
            })}
          </div>
        </section>

        {/* Featured articles — card layout */}
        <section className="marketing-section">
          <h2 style={{ marginTop: 0, color: "#f8fafc", marginBottom: 4 }}>Start the debate</h2>
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

        <section style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", marginBottom: 16 }}>
          {[
            ["1", "Pick a sport"],
            ["2", "Enter contests or predictions"],
            ["3", "Climb leaderboards and win rewards"],
          ].map(([step, text]) => (
            <article key={step} style={sectionCard}>
              <div style={{ color: "#fcd34d", fontWeight: 700, marginBottom: 6 }}>Step {step}</div>
              <div>{text}</div>
            </article>
          ))}
        </section>

        <section style={{ ...sectionCard, textAlign: "center" }}>
          <h2 style={{ marginTop: 0, color: "#f8fafc" }}>Join Before Public Launch</h2>
          <p style={{ color: "#cbd5e1" }}>
            Early users get exclusive contests, rankings access, and beta features.
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap" }}>
            <Link className="dash-main-btn" to="/auth?mode=register">
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
