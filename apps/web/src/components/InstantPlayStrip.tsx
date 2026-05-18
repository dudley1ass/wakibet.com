import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../api";
import { lineupEntryForSport } from "../lib/lineupEntryRoutes";
import { trackPlayInstantClick } from "../lib/analytics";
import BuildPickleballLineupCta, { buildPickleballLineupSubtext } from "./BuildPickleballLineupCta";

type SampleContest = {
  sport: "pickleball" | "lacrosse" | "volleyball" | "poker";
  label: string;
  venue: string;
  status: "live" | "upcoming" | "ended";
  play_href: string;
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
  const spotlightQuery = useQuery({
    queryKey: ["landing", "picks-spotlight"] as const,
    queryFn: () =>
      apiGet<{
        items: { sport_key: string; label_short: string; label_full: string; venue: string }[];
      }>("/api/v1/picks/spotlight", { timeoutMs: 20_000 }),
    staleTime: 60_000,
    retry: 1,
  });
  const pickleballSpotlight =
    spotlightQuery.data?.items?.find((x) => x.sport_key === "pickleball") ?? spotlightQuery.data?.items?.[0];

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
        <h2 className="instant-play-strip__title">Build your pickleball lineup this week</h2>
        <p className="instant-play-strip__lede">
          {pickleballSpotlight
            ? `Pick players for ${pickleballSpotlight.label_full} (${pickleballSpotlight.venue}) — free fantasy tied to live pro results.`
            : "Pick pro players for this week's tournament slate — free fantasy tied to live results."}
        </p>
        <BuildPickleballLineupCta
          className="instant-play-strip__hero-cta"
          tournamentName={pickleballSpotlight?.label_short}
          venue={pickleballSpotlight?.venue}
          onClick={() => trackPlayInstantClick("feature_build_lineup")}
        />
      </div>

      <div className="instant-play-strip__features">
        <article className="instant-play-strip__card instant-play-strip__card--lineup">
          <h3>Your pickleball lineup</h3>
          <p>{buildPickleballLineupSubtext(pickleballSpotlight?.label_short, pickleballSpotlight?.venue)}</p>
          <BuildPickleballLineupCta
            tournamentName={pickleballSpotlight?.label_short}
            venue={pickleballSpotlight?.venue}
            onClick={() => trackPlayInstantClick("instant_card_build_lineup")}
          />
        </article>
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
          <h3 className="instant-play-strip__contests-title">Tournaments this week</h3>
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
                    className={
                      c.sport === "pickleball"
                        ? "dash-main-btn landing-cta-lineup landing-cta-lineup--build landing-cta-lineup--compact"
                        : "dash-ghost-btn"
                    }
                    to={lineupEntryForSport(c.sport)}
                    onClick={() => trackPlayInstantClick(`contest_${c.sport}`)}
                  >
                    {c.sport === "pickleball" ? (
                      <>
                        <span className="landing-cta-lineup__title">Build pickleball lineup</span>
                        <span className="landing-cta-lineup__sub">This week&apos;s slate</span>
                      </>
                    ) : (
                      `Build ${c.sport} lineup`
                    )}
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
