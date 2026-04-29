import { useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import { NASCAR_CUP_SCHEDULE_SEASON_YEAR } from "@wakibet/shared";
import { Link } from "react-router-dom";
import { apiGet } from "../../api";
import type { DashboardData } from "../Dashboard";
import {
  nascarFocusWeek,
  nascarLineupComplete,
  type NascarLineupPayload,
  type NascarWeekRow,
} from "../../sports/nascar/lib/dashboardNascar";
import DashboardPrizeHero from "./DashboardPrizeHero";
import SportCard from "./SportCard";
import ThisWeekPicksHomeSection from "../ThisWeekPicksHomeSection";

type FantasyPulseLite = NonNullable<DashboardData["fantasy_pulse"]>;

type NascarStatus = {
  sport: "nascar";
  enabled: boolean;
  total_weeks: number;
  total_drivers: number;
  message: string;
};

type NascarWeeksPayload = { season: string; weeks: NascarWeekRow[] };

type NascarSeasonSummary = {
  season_year: number;
  total_points: number;
  rank: number | null;
  weeks_played: number;
};

function pickleballStatusLabel(incompleteDivisions: number, rosterCount: number): string {
  if (rosterCount === 0) return "Set";
  if (incompleteDivisions > 0) return "Edit";
  return "";
}

function nascarStatusLabel(w: NascarWeekRow | null): string {
  if (!w) return "";
  if (w.status === "closed") return "Closed";
  if (w.status === "locked") return "Live";
  return "";
}

type Props = {
  preview: DashboardData;
  pulse: FantasyPulseLite;
};

export default function DashboardMultiSportLayout({ preview, pulse }: Props) {
  const seasonYear = NASCAR_CUP_SCHEDULE_SEASON_YEAR;
  const incomplete = useMemo(
    () => preview.winter_fantasy_rosters.filter((r) => !r.waki_lineup_complete).length,
    [preview.winter_fantasy_rosters],
  );
  const rosterCount = preview.winter_fantasy_rosters.length;
  const pbEventRaw =
    preview.open_contests[0]?.name ??
    preview.tournament_schedules[0]?.tournament_name ??
    "Winter Fantasy";
  const pbEvent = pbEventRaw.replace(/\s*[-–—]?\s*test run\s*/i, "").replace(/[()_]/g, "").trim();

  const [statusQ, weeksQ, seasonQ] = useQueries({
    queries: [
      {
        queryKey: ["nascar", "status"] as const,
        queryFn: () => apiGet<NascarStatus>("/api/v1/nascar/status"),
      },
      {
        queryKey: ["nascar", "weeks", seasonYear] as const,
        queryFn: () => apiGet<NascarWeeksPayload>(`/api/v1/nascar/weeks?season_year=${seasonYear}`),
      },
      {
        queryKey: ["nascar", "season-summary", seasonYear] as const,
        queryFn: () => apiGet<NascarSeasonSummary>(`/api/v1/nascar/season-summary?season_year=${seasonYear}`),
      },
    ],
  });

  const nascarWeeks = weeksQ.data?.weeks ?? [];
  const focusWeek = useMemo(() => nascarFocusWeek(weeksQ.data?.weeks ?? []), [weeksQ.data?.weeks]);
  const nextNascarWeek = useMemo(() => {
    if (nascarWeeks.length === 0) return null;
    if (!focusWeek) return nascarWeeks[1] ?? nascarWeeks[0] ?? null;
    const currentIdx = nascarWeeks.findIndex((w) => w.week_key === focusWeek.week_key);
    if (currentIdx >= 0 && currentIdx + 1 < nascarWeeks.length) return nascarWeeks[currentIdx + 1];
    return nascarWeeks.find((w) => w.status === "upcoming" && w.week_key !== focusWeek.week_key) ?? null;
  }, [nascarWeeks, focusWeek]);
  const [lineupQ] = useQueries({
    queries: [
      {
        queryKey: ["nascar", "lineup", focusWeek?.week_key ?? ""] as const,
        queryFn: () =>
          apiGet<NascarLineupPayload>(`/api/v1/nascar/lineup?week_key=${encodeURIComponent(focusWeek!.week_key)}`),
        enabled: Boolean(statusQ.data?.enabled && focusWeek?.week_key),
      },
    ],
  });

  const nascarEnabled = statusQ.data?.enabled ?? false;
  const nascarLineup = lineupQ.data;
  const nascarSize = nascarLineup?.lineup_size ?? 5;
  const nascarComplete = nascarLineupComplete(nascarLineup, nascarSize);
  const nascarSub = nextNascarWeek
    ? `Next race is ${nextNascarWeek.race_name}`
    : statusQ.data?.message ?? "Loading NASCAR…";
  const nascarEvent = focusWeek?.race_name ?? "NASCAR weekly picks";
  const nascarCta = !nascarEnabled ? "View hub" : nascarComplete ? "View lineup" : "Build lineup";
  const nascarTo = focusWeek ? `/nascar?week_key=${encodeURIComponent(focusWeek.week_key)}` : "/nascar";

  const pbCta = incomplete > 0 ? "Enter picks" : "Edit picks";
  const pbSub = "Next tournament is MLP Dallas";

  const nascarRank = seasonQ.data?.rank;
  const nascarPts = seasonQ.data?.total_points ?? 0;

  return (
    <>
      <ThisWeekPicksHomeSection />

      <section className="dash-ms-section dash-ms-section--sports-top" aria-labelledby="dash-ms-hero-title">
        <h2 id="dash-ms-hero-title" className="dash-ms-section-title">
          Your Sports
        </h2>
        <p className="dash-ms-section-lead dash-ms-section-lead--tight">
          Same layout per sport — separate scores and leaderboards.{" "}
          <Link className="dash-ms-inline-link" to="/pick-teams/leaderboard">
            Pickleball top 100
          </Link>
          {" · "}
          <Link className="dash-ms-inline-link" to="/nascar/leaderboard">
            NASCAR top 100
          </Link>
        </p>
        <div className="dash-sport-hero-row">
          <SportCard
            variant="pickleball"
            icon="🏓"
            sportLabel="Pickleball"
            eventName={pbEvent}
            subline={pbSub}
            statusLabel={pickleballStatusLabel(incomplete, rosterCount)}
            ctaLabel={pbCta}
            ctaTo="/pick-teams"
          />
          <SportCard
            variant="nascar"
            icon="🏁"
            sportLabel="NASCAR"
            eventName={nascarEvent}
            subline={weeksQ.isLoading || statusQ.isLoading ? "Loading…" : nascarSub}
            statusLabel={nascarStatusLabel(focusWeek)}
            ctaLabel={nascarCta}
            ctaTo={nascarTo}
          />
        </div>
        {(statusQ.isError || weeksQ.isError || seasonQ.isError || lineupQ.isError) && (
          <p className="dash-ms-error" role="status">
            Some NASCAR data could not load. The pickleball dashboard is still available.
          </p>
        )}
      </section>

      <div className="dash-prize-contests-split">
        <div className="dash-prize-contests-split__prize">
          <DashboardPrizeHero />
        </div>
        <section className="dash-ms-section dash-ms-section--contests-compact" aria-labelledby="dash-ms-contests-title">
          <h2 id="dash-ms-contests-title" className="dash-ms-section-title dash-ms-section-title--sm">
            Your Active Contests
          </h2>
          <ul className="dash-contest-list dash-contest-list--compact">
            <li className="dash-contest-card dash-contest-card--pickleball dash-contest-card--compact">
              <div className="dash-contest-card__icon" aria-hidden>
                🏓
              </div>
              <div className="dash-contest-card__body">
                <div className="dash-contest-card__sport">Pickleball</div>
                <div className="dash-contest-card__event">{pbEvent}</div>
                <div className="dash-contest-card__detail">
                  {incomplete > 0
                    ? `${incomplete} division${incomplete === 1 ? "" : "s"} need picks`
                    : "All divisions loaded"}
                </div>
              </div>
              <div className="dash-contest-card__stats">
                <div>
                  <span className="dash-contest-card__stat-label">Rank</span>
                  <span className="dash-contest-card__stat-val">{pulse.my_rank != null ? `#${pulse.my_rank}` : "—"}</span>
                </div>
                <div>
                  <span className="dash-contest-card__stat-label">Pts</span>
                  <span className="dash-contest-card__stat-val">{Math.round(preview.fantasy_season.total_fantasy_points)}</span>
                </div>
              </div>
              <Link className="dash-contest-card__link" to="/pick-teams">
                Open
              </Link>
            </li>
            <li className="dash-contest-card dash-contest-card--nascar dash-contest-card--compact">
              <div className="dash-contest-card__icon" aria-hidden>
                🏁
              </div>
              <div className="dash-contest-card__body">
                <div className="dash-contest-card__sport">NASCAR</div>
                <div className="dash-contest-card__event">{focusWeek ? focusWeek.race_name : "Weekly picks"}</div>
                <div className="dash-contest-card__detail">
                  {!nascarEnabled
                    ? "Add weeks + drivers in admin to enable"
                    : nascarComplete
                      ? "Lineup submitted for this week"
                      : "Build your 5-driver lineup (1 captain)"}
                  {nascarEnabled ? (
                    <Link className="dash-contest-card__sub-link" to="/nascar/rosters">
                      View all race lineups
                    </Link>
                  ) : null}
                </div>
              </div>
              <div className="dash-contest-card__stats">
                <div>
                  <span className="dash-contest-card__stat-label">Rank</span>
                  <span className="dash-contest-card__stat-val">
                    {seasonQ.isLoading ? "…" : nascarRank != null ? `#${nascarRank}` : "—"}
                  </span>
                </div>
                <div>
                  <span className="dash-contest-card__stat-label">Pts</span>
                  <span className="dash-contest-card__stat-val">{seasonQ.isLoading ? "…" : Math.round(nascarPts)}</span>
                </div>
              </div>
              <Link className="dash-contest-card__link" to={nascarTo}>
                Open
              </Link>
            </li>
          </ul>
        </section>
      </div>

      <section className="dash-ms-section dash-ms-section--rank" aria-labelledby="dash-ms-rank-title">
        <h2 id="dash-ms-rank-title" className="dash-ms-section-title">
          Season Standings
        </h2>
        <p className="dash-ms-section-lead">
          Never mixed across sports — each line is its own game.{" "}
          <Link className="dash-ms-inline-link" to="/pick-teams/leaderboard">
            Full pickleball leaderboard
          </Link>
          {" · "}
          <Link className="dash-ms-inline-link" to="/nascar/leaderboard">
            Full NASCAR leaderboard
          </Link>
        </p>
        <ul className="dash-season-rank-list">
          <li className="dash-season-rank-row dash-season-rank-row--pickleball">
            <span className="dash-season-rank-ico" aria-hidden>
              🏓
            </span>
            <span className="dash-season-rank-sport">Pickleball</span>
            <span className="dash-season-rank-val">
              {pulse.my_rank != null ? `#${pulse.my_rank}` : "—"} · {Math.round(preview.fantasy_season.total_fantasy_points)} pts
            </span>
          </li>
          <li className="dash-season-rank-row dash-season-rank-row--nascar">
            <span className="dash-season-rank-ico" aria-hidden>
              🏁
            </span>
            <span className="dash-season-rank-sport">NASCAR</span>
            <span className="dash-season-rank-val">
              {seasonQ.isLoading ? "…" : nascarRank != null ? `#${nascarRank}` : "—"} · {Math.round(nascarPts)} pts
            </span>
          </li>
        </ul>
      </section>
    </>
  );
}
