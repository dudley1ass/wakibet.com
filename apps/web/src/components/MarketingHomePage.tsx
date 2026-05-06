import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
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
  marginBottom: 10,
};

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

  return (
    <div style={{ maxWidth: 1140, margin: "0 auto", padding: "20px 16px 48px", color: "#e5e7eb" }}>
      <header style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap", marginBottom: 24 }}>
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

      <section
        style={{
          ...sectionCard,
          display: "grid",
          gap: 18,
          gridTemplateColumns: "minmax(280px, 1.2fr) minmax(280px, 1fr)",
          marginBottom: 16,
        }}
      >
        <div>
          <div style={badgeStyle}>Sports media + fantasy ecosystem</div>
          <h1 style={{ margin: "0 0 10px", fontSize: 36, lineHeight: 1.1, color: "#f8fafc" }}>
            Where Sports Fans Compete Beyond the Scoreboard
          </h1>
          <p style={{ margin: "0 0 14px", color: "#cbd5e1" }}>
            Fantasy games, rankings, hot takes, player debates, and community-driven competition for emerging sports.
          </p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link className="dash-main-btn" to="/auth?mode=register">
              Join Early Access
            </Link>
            <Link className="dash-ghost-btn" to="/auth?mode=login">
              Explore Rankings
            </Link>
            <Link className="dash-ghost-btn" to="/auth?mode=register">
              Enter Fantasy Contest
            </Link>
          </div>
        </div>
        <div style={{ ...sectionCard, background: "rgba(15, 23, 42, 0.65)", borderColor: "rgba(56, 189, 248, 0.35)" }}>
          <div style={{ color: "#93c5fd", fontWeight: 700, marginBottom: 8 }}>Live Hubs</div>
          <p style={{ margin: "0 0 12px", color: "#dbeafe" }}>
            Pickleball, lacrosse, volleyball, poker, leaderboards, and fantasy strategy in one home feed.
          </p>
          <ul style={{ margin: 0, paddingLeft: 18, color: "#d1d5db", lineHeight: 1.6 }}>
            <li>Daily hot takes and debates</li>
            <li>Rising players and community rankings</li>
            <li>Fantasy lineup strategy and matchup picks</li>
            <li>Sport-specific pages that feel alive</li>
          </ul>
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
            oddsQuery.data
              ? `Pickleball rating gap: ${Math.abs(oddsQuery.data.markets.pickleball.team_a.rating - oddsQuery.data.markets.pickleball.team_b.rating)}`
              : "Names climbing fast in community rankings.",
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
        <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
          {[
            liveSpotlight ? `Pickleball: ${liveSpotlight.label_short}` : "Pickleball",
            "Volleyball",
            lacrosseQuery.data ? `Lacrosse: ${lacrosseQuery.data.slate_key}` : "Lacrosse",
            "Poker",
            "More Coming Soon",
          ].map((sport) => (
            <div key={sport} style={{ ...sectionCard, padding: 12, textAlign: "center" }}>
              {sport}
            </div>
          ))}
        </div>
      </section>

      <section style={{ ...sectionCard, marginBottom: 16 }}>
        <h2 style={{ marginTop: 0 }}>Featured Articles</h2>
        <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
          <li>10 Pickleball Players Everyone Overrates</li>
          <li>Why Defense Wins Championships Again in Lacrosse</li>
          <li>Most Underrated Skill in Volleyball</li>
          <li>WSOP Fantasy Strategy Explained</li>
        </ul>
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

      <section style={{ ...sectionCard, marginBottom: 16 }}>
        <h2 style={{ marginTop: 0 }}>Social Proof</h2>
        <p style={{ margin: 0, color: "#cbd5e1" }}>
          1,200+ debates created · 10,000+ community votes · 500+ fantasy lineups submitted
        </p>
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
  );
}
