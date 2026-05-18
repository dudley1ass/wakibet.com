import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../api";
import { trackPlayInstantClick } from "../lib/analytics";

type SampleContest = {
  sport: "pickleball" | "lacrosse" | "volleyball" | "poker";
  label: string;
  venue: string;
  status: "live" | "upcoming" | "ended";
  play_href: string;
  leaderboard_href: string;
};

const FEATURES = [
  {
    title: "Play instantly",
    body: "Build a guest lineup in under a minute — no account, no deposit.",
    href: "/play",
    cta: "Create free lineup",
    track: "feature_play",
  },
  {
    title: "Public leaderboards",
    body: "See who is winning before you join — updated from real saved lineups.",
    href: "/leaderboard/pickleball",
    cta: "View leaderboard",
    track: "feature_leaderboard",
  },
  {
    title: "Beat the experts",
    body: "Every demo contest includes a WakiBet expert benchmark lineup to beat.",
    href: "/play",
    cta: "Challenge experts",
    track: "feature_experts",
  },
] as const;

export default function InstantPlayStrip() {
  const contestsQuery = useQuery({
    queryKey: ["public", "sample-contests"] as const,
    queryFn: () =>
      apiGet<{ generated_at: string; contests: SampleContest[] }>("/api/v1/public/sample-contests"),
    staleTime: 60_000,
  });
  const contests = contestsQuery.data?.contests ?? [];

  return (
    <section className="instant-play-strip" aria-label="Play without an account">
      <div className="instant-play-strip__intro">
        <h2 className="instant-play-strip__title">Play now — keep your lineup, join contests later</h2>
        <p className="instant-play-strip__lede">
          Fantasy platforms win when users build lineups first and sign up second. Try guest play, sample contests, and
          public leaderboards — then create a free account to save for real.
        </p>
      </div>

      <div className="instant-play-strip__features">
        {FEATURES.map((f) => (
          <article key={f.track} className="instant-play-strip__card">
            <h3>{f.title}</h3>
            <p>{f.body}</p>
            <Link
              className="dash-ghost-btn"
              to={f.href}
              onClick={() => trackPlayInstantClick(f.track)}
            >
              {f.cta}
            </Link>
          </article>
        ))}
      </div>

      {contests.length > 0 ? (
        <div className="instant-play-strip__contests">
          <h3 className="instant-play-strip__contests-title">Sample contests this week</h3>
          <div className="instant-play-strip__contest-grid">
            {contests.map((c) => (
              <article key={c.sport} className="instant-play-strip__contest-card">
                <span className={`instant-play-strip__status instant-play-strip__status--${c.status}`}>
                  {c.status === "live" ? "Live" : c.status === "upcoming" ? "Upcoming" : "Recent"}
                </span>
                <strong>{c.label}</strong>
                <span>{c.venue}</span>
                <div className="instant-play-strip__contest-actions">
                  <Link
                    className="dash-main-btn"
                    to={c.play_href}
                    onClick={() => trackPlayInstantClick(`contest_${c.sport}`)}
                  >
                    Play
                  </Link>
                  <Link className="dash-ghost-btn" to={c.leaderboard_href}>
                    Leaderboard
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
