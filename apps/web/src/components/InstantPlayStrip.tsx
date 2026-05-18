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
    title: "Weekly slates",
    body: "Pick players under a WakiCash cap and climb the board when results land.",
    href: "/auth?mode=register&from=feature_slates",
    cta: "Create free account",
    track: "feature_register",
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
    body: "Try the guest demo, then save your lineup with a free account to enter for real.",
    href: "/play",
    cta: "Try guest demo",
    track: "feature_guest",
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
    <section className="instant-play-strip" aria-label="Enter a league">
      <div className="instant-play-strip__intro">
        <h2 className="instant-play-strip__title">Enter a league this week</h2>
        <p className="instant-play-strip__lede">
          Free fantasy for pickleball, lacrosse, volleyball, and WSOP-style poker. Create your account to save lineups
          and compete on the leaderboard.
        </p>
      </div>

      <div className="instant-play-strip__features">
        {FEATURES.map((f) => (
          <article key={f.track} className="instant-play-strip__card">
            <h3>{f.title}</h3>
            <p>{f.body}</p>
            <Link
              className={f.track === "feature_register" ? "dash-main-btn" : "dash-ghost-btn"}
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
                    to={`/auth?mode=register&from=contest_${c.sport}`}
                    onClick={() => trackPlayInstantClick(`contest_${c.sport}`)}
                  >
                    Enter league
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
