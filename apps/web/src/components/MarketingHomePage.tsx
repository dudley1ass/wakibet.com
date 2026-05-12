import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { apiGet } from "../api";
import DashboardSeasonPrizesStrip from "./dashboard/DashboardSeasonPrizesStrip";
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

const FEATURED_ARTICLES: {
  slug: string;
  title: string;
  category: string;
  comments: number;
  trending: boolean;
  thumbMod: string;
}[] = [
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

type DemoContestPlayer = {
  player_name: string;
  display_name: string;
  projected_points: number;
  waki_cash: number;
  last_event_label: string;
};

type DemoSport = "pickleball" | "lacrosse" | "volleyball" | "poker";

type DemoContestResponse = {
  sport: DemoSport;
  tournament_key: string;
  tournament_name: string;
  roster_size: number;
  salary_cap: number;
  players: DemoContestPlayer[];
};

const DEMO_SPORT_OPTIONS: { value: DemoSport; label: string }[] = [
  { value: "pickleball", label: "Pickleball" },
  { value: "lacrosse", label: "Lacrosse" },
  { value: "volleyball", label: "Volleyball" },
  { value: "poker", label: "Poker" },
];

function DemoContestBuilder() {
  const [selectedSport, setSelectedSport] = useState<DemoSport>("pickleball");
  const [selectedNames, setSelectedNames] = useState<string[]>([]);
  const demoQuery = useQuery({
    queryKey: ["landing", "fantasy-demo-contest", selectedSport] as const,
    queryFn: () =>
      apiGet<DemoContestResponse>(
        `/api/v1/fantasy-tournament/demo?sport=${encodeURIComponent(selectedSport)}`,
        { timeoutMs: 20_000 },
      ),
    staleTime: 5 * 60_000,
    retry: 1,
  });
  const players = demoQuery.data?.players ?? [];
  const rosterSize = demoQuery.data?.roster_size ?? 5;
  const salaryCap = demoQuery.data?.salary_cap ?? 100;
  const selectedPlayers = selectedNames
    .map((name) => players.find((p) => p.player_name === name))
    .filter((p): p is DemoContestPlayer => Boolean(p));
  const projectedScore = Math.round(selectedPlayers.reduce((sum, p) => sum + p.projected_points, 0) * 100) / 100;
  const wakiCashSpent = selectedPlayers.reduce((sum, p) => sum + p.waki_cash, 0);
  const wakiCashRemaining = salaryCap - wakiCashSpent;
  const isFull = selectedPlayers.length === rosterSize;
  const isBuilt = isFull && wakiCashRemaining >= 0;

  function togglePlayer(player: DemoContestPlayer) {
    setSelectedNames((prev) => {
      if (prev.includes(player.player_name)) return prev.filter((name) => name !== player.player_name);
      if (prev.length >= rosterSize) return prev;
      if (wakiCashRemaining - player.waki_cash < 0) return prev;
      return [...prev, player.player_name];
    });
  }

  function handleSportChange(next: DemoSport) {
    if (next === selectedSport) return;
    setSelectedSport(next);
    setSelectedNames([]);
  }

  return (
    <section id="demo-contest" className="landing-demo-contest">
      <div className="landing-demo-contest__head">
        <div>
          <div className="landing-demo-contest__kicker">Demo contest</div>
          <h2 className="landing-demo-contest__title">
            Pick 5 players. See your projected score{" "}
            <span className="landing-demo-contest__sport-pick">
              <select
                aria-label="Choose a sport to demo"
                className="landing-demo-contest__sport-select"
                value={selectedSport}
                onChange={(e) => handleSportChange(e.target.value as DemoSport)}
              >
                {DEMO_SPORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </span>
            .
          </h2>
          <p className="landing-demo-contest__lede">
            No login required. You get {salaryCap} WakiCash — every player has a price, and your projected score uses
            each player’s last tournament result. Create an account after the lineup is built.
          </p>
        </div>
        <div className="landing-demo-contest__score-card">
          <div className="landing-demo-contest__score-row">
            <span>WakiCash left</span>
            <strong className={wakiCashRemaining < 0 ? "landing-demo-contest__over" : undefined}>
              {wakiCashRemaining}
            </strong>
            <small>of {salaryCap}</small>
          </div>
          <div className="landing-demo-contest__score-row landing-demo-contest__score-row--alt">
            <span>Projected score</span>
            <strong>{projectedScore}</strong>
            <small>
              {selectedPlayers.length}/{rosterSize} players picked
            </small>
          </div>
        </div>
      </div>

      {demoQuery.isLoading ? <p className="dash-empty">Loading demo players…</p> : null}
      {demoQuery.isError ? (
        <p className="dash-error">Demo contest data is not available right now.</p>
      ) : null}

      {players.length > 0 ? (
        <>
          <div className="landing-demo-contest__players" aria-label="Demo contest player pool">
            {players.map((player) => {
              const selected = selectedNames.includes(player.player_name);
              const wouldOverspend = !selected && wakiCashRemaining - player.waki_cash < 0;
              const rosterFull = !selected && selectedNames.length >= rosterSize;
              const disabled = rosterFull || wouldOverspend;
              return (
                <button
                  key={player.player_name}
                  type="button"
                  className={`landing-demo-player${selected ? " landing-demo-player--selected" : ""}${
                    wouldOverspend ? " landing-demo-player--over" : ""
                  }`}
                  disabled={disabled}
                  onClick={() => togglePlayer(player)}
                  aria-label={`${player.display_name}, costs ${player.waki_cash} WakiCash, projects ${player.projected_points} points`}
                >
                  <span className="landing-demo-player__row">
                    <span className="landing-demo-player__name">{player.display_name}</span>
                    <span className="landing-demo-player__price">{player.waki_cash} WC</span>
                  </span>
                  <span className="landing-demo-player__meta">
                    {player.projected_points} pts · {player.last_event_label}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="landing-demo-contest__footer">
            {isBuilt ? (
              <>
                <p>
                  Lineup built — spent {wakiCashSpent}/{salaryCap} WakiCash for {projectedScore} projected points.
                  Create a free account to save real lineups, join contests, and track results.
                </p>
                <Link className="dash-main-btn landing-demo-contest__signup" to="/auth?mode=register">
                  Create free account
                </Link>
              </>
            ) : isFull && wakiCashRemaining < 0 ? (
              <p>
                Over budget by {Math.abs(wakiCashRemaining)} WakiCash. Swap an expensive player for a cheaper one to
                finish the demo lineup.
              </p>
            ) : (
              <p>
                Choose {rosterSize - selectedPlayers.length} more player
                {rosterSize - selectedPlayers.length === 1 ? "" : "s"} — {wakiCashRemaining} WakiCash left.
              </p>
            )}
          </div>
        </>
      ) : null}
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
              <div className="landing-hero__sport-banner landing-hero__sport-banner--inline landing-hero__sport-banner--hero-top">
                <span className="landing-hero__sport-banner-kicker">Fantasy sports for</span>
                <span className="landing-hero__sport-banner-list">
                  <span>Pickleball</span>
                  <span className="landing-hero__sport-banner-dot" aria-hidden>
                    •
                  </span>
                  <span>Volleyball</span>
                  <span className="landing-hero__sport-banner-dot" aria-hidden>
                    •
                  </span>
                  <span>Lacrosse</span>
                  <span className="landing-hero__sport-banner-dot" aria-hidden>
                    •
                  </span>
                  <span>Poker</span>
                  <span className="landing-hero__sport-banner-dot" aria-hidden>
                    •
                  </span>
                  <span>Invest</span>
                </span>
              </div>
              <p style={{ margin: "0 0 6px", color: "#86efac", fontSize: 14, fontWeight: 600 }}>
                100% free to play — no entry fees, no deposits required.
              </p>
              <h1 className="landing-hero__title">Where Sports Fans Compete Beyond the Scoreboard</h1>
              <p className="landing-hero__lede">
                Rankings, debates, hot takes, and fantasy — built for fans who live in the comments section as much as the
                scoreboard.
              </p>
              <div className="landing-hero__cta-primary">
                <a className="dash-main-btn landing-cta-lineup" href="#demo-contest">
                  <span className="landing-cta-lineup__title">
                    Build Lineups. Predict Winners. Climb the Leaderboard.
                  </span>
                  <span className="landing-cta-lineup__sub">
                    Free fantasy sports contests powered by strategy.
                  </span>
                </a>
              </div>
            </div>

            <div className="landing-hero__actions-row">
              <div className="landing-hero__season-prizes">
                <DashboardSeasonPrizesStrip twoLineCaption />
              </div>
              <div className="landing-hero__cta-stack">
                <div
                  className="landing-hero__cta-row landing-hero__cta-row--four-across"
                  aria-label="Sport info pages"
                >
                  <Link className="dash-ghost-btn" to="/info/pickleball">
                    Pickleball info
                  </Link>
                  <Link className="dash-ghost-btn" to="/info/volleyball">
                    Volleyball info
                  </Link>
                  <Link className="dash-ghost-btn" to="/info/lacrosse">
                    Lacrosse info
                  </Link>
                  <Link className="dash-ghost-btn" to="/info/poker">
                    Poker info
                  </Link>
                  <Link className="dash-ghost-btn" to="/info/invest">
                    Invest info
                  </Link>
                </div>
                <div
                  className="landing-hero__cta-row landing-hero__cta-row--four-across"
                  aria-label="Join our Reddit communities"
                >
                  <a
                    className="dash-ghost-btn"
                    href="https://www.reddit.com/r/Fantasy_Pickleball/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    r/Fantasy_Pickleball
                  </a>
                  <a
                    className="dash-ghost-btn"
                    href="https://www.reddit.com/r/Fantasy_Volleyball/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    r/Fantasy_Volleyball
                  </a>
                  <a
                    className="dash-ghost-btn"
                    href="https://www.reddit.com/r/Fantasy_Lacrosse/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    r/Fantasy_Lacrosse
                  </a>
                  <a
                    className="dash-ghost-btn"
                    href="https://www.reddit.com/r/Fantasy_Poker/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    r/Fantasy_Poker
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        <DemoContestBuilder />

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
