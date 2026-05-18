import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../api";
import { lineupEntryForSport } from "../lib/lineupEntryRoutes";
import { trackPlayInstantClick } from "../lib/analytics";

type SampleContest = {
  sport: "pickleball" | "lacrosse" | "volleyball" | "poker";
  label: string;
  venue: string;
  status: "live" | "upcoming" | "ended";
  play_href: string;
};

const SPORT_LABEL: Record<SampleContest["sport"], string> = {
  pickleball: "Pickleball",
  lacrosse: "Lacrosse",
  volleyball: "Volleyball",
  poker: "WSOP",
};

const FEATURES = [
  {
    title: "PPA rankings",
    body: "Player ratings from real tour results — win rate, strength of schedule, and more.",
    href: "/pickleball/rankings",
    cta: "View rankings",
    track: "feature_rankings",
  },
  {
    title: "Create free account",
    body: "Save your lineup and enter weekly contests for free.",
    href: "/auth?mode=register&from=instant_strip",
    cta: "Create free account",
    track: "feature_register",
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
    <section id="this-week" className="instant-play-strip" aria-label="This week's tournaments">
      <div className="instant-play-strip__intro">
        <h2 className="instant-play-strip__title">This week&apos;s slates</h2>
        <p className="instant-play-strip__lede">
          Pick players for the next live tournament in each sport — free fantasy tied to real results. No account
          needed to start building.
        </p>
      </div>

      {contests.length > 0 ? (
        <div className="instant-play-strip__contests instant-play-strip__contests--primary">
          <div className="instant-play-strip__contest-grid">
            {contests.map((c) => (
              <article key={c.sport} className="instant-play-strip__contest-card">
                <span className={`instant-play-strip__status instant-play-strip__status--${c.status}`}>
                  {c.status === "live" ? "Live" : c.status === "upcoming" ? "Upcoming" : "Recent"}
                </span>
                <strong>{SPORT_LABEL[c.sport]}</strong>
                <span className="instant-play-strip__contest-label">{c.label}</span>
                <span>{c.venue}</span>
                <div className="instant-play-strip__contest-actions">
                  <Link
                    className="dash-main-btn"
                    to={lineupEntryForSport(c.sport)}
                    onClick={() => trackPlayInstantClick(`contest_${c.sport}`)}
                  >
                    Enter {SPORT_LABEL[c.sport]} slate
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      ) : null}

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
    </section>
  );
}
