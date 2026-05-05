import { useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { apiGet } from "../../api";
import type { DashboardData } from "../Dashboard";
import DashboardSeasonPrizesStrip from "./DashboardSeasonPrizesStrip";
import DashboardSeasonStandingsHero from "./DashboardSeasonStandingsHero";
import SportCard from "./SportCard";
import ThisWeekPicksHomeSection from "../ThisWeekPicksHomeSection";

type FantasyPulseLite = NonNullable<DashboardData["fantasy_pulse"]>;

type LacrosseCurrentPayload = {
  slate_key: string;
  name: string;
  season_year: number;
};

function pickleballStatusLabel(incompleteDivisions: number, rosterCount: number): string {
  if (rosterCount === 0) return "Set";
  if (incompleteDivisions > 0) return "Edit";
  return "";
}

type Props = {
  preview: DashboardData;
  pulse: FantasyPulseLite;
};

export default function DashboardMultiSportLayout({ preview, pulse }: Props) {
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

  type VolleyballStatusPayload = {
    season_year: number;
    event_count: number;
    fantasy_enabled: boolean;
    message: string;
  };

  const [lacrosseQ, volleyballQ] = useQueries({
    queries: [
      {
        queryKey: ["lacrosse", "current"] as const,
        queryFn: () => apiGet<LacrosseCurrentPayload>("/api/v1/lacrosse/current"),
      },
      {
        queryKey: ["volleyball", "status"] as const,
        queryFn: () => apiGet<VolleyballStatusPayload>("/api/v1/volleyball/status"),
      },
    ],
  });

  const pbCta = incomplete > 0 ? "Enter picks" : "Edit picks";
  const pbSub = "Next tournament is MLP Dallas";

  const laxName = lacrosseQ.data?.name ?? "Utah Open";

  return (
    <>
      <div className="dash-top-picks-prizes-row">
        <ThisWeekPicksHomeSection compact />
        <DashboardSeasonPrizesStrip />
      </div>

      <section className="dash-ms-section dash-ms-section--sports-top" aria-labelledby="dash-ms-hero-title">
        <h2 id="dash-ms-hero-title" className="dash-ms-section-title">
          Your Sports
        </h2>
        <p className="dash-ms-section-lead dash-ms-section-lead--tight">
          Same layout per sport — separate scores and leaderboards.{" "}
          <Link className="dash-ms-inline-link" to="/pick-teams/leaderboard">
            Pickleball top 100
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
            variant="lacrosse"
            icon="🥍"
            sportLabel="Lacrosse"
            eventName={lacrosseQ.isLoading && !lacrosseQ.data ? "PLL" : laxName}
            subline="100 WakiCash per slate — max 40 on a line"
            statusLabel="PLL"
            ctaLabel="Open lacrosse"
            ctaTo="/lacrosse"
          />
          <SportCard
            variant="volleyball"
            icon="🏐"
            sportLabel="Beach volleyball"
            eventName={
              volleyballQ.isLoading && !volleyballQ.data
                ? "AVP"
                : `AVP ${volleyballQ.data?.season_year ?? ""}`.trim()
            }
            subline="2026 tour schedule is up — fantasy picks and scoring land next (pickleball-style WakiCash + captains)."
            statusLabel="AVP"
            ctaLabel="Open volleyball"
            ctaTo="/volleyball"
          />
        </div>
        {(lacrosseQ.isError || volleyballQ.isError) && (
          <p className="dash-ms-error" role="status">
            Some season data could not load. Open each sport for full details.
          </p>
        )}
      </section>

      <div className="dash-prize-contests-split">
        <div className="dash-prize-contests-split__standings">
          <DashboardSeasonStandingsHero
            pickleballRank={pulse.my_rank}
            pickleballPts={preview.fantasy_season.total_fantasy_points}
            lacrosseSeasonYear={lacrosseQ.data?.season_year ?? null}
            lacrosseLoading={lacrosseQ.isLoading}
            volleyballSeasonYear={volleyballQ.data?.season_year ?? null}
            volleyballLoading={volleyballQ.isLoading}
          />
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
            <li className="dash-contest-card dash-contest-card--lacrosse dash-contest-card--compact">
              <div className="dash-contest-card__icon" aria-hidden>
                🥍
              </div>
              <div className="dash-contest-card__body">
                <div className="dash-contest-card__sport">Lacrosse</div>
                <div className="dash-contest-card__event">{laxName}</div>
                <div className="dash-contest-card__detail">
                  PLL team ratings and WakiCash lines
                  <Link className="dash-contest-card__sub-link" to="/lacrosse/rosters">
                    My lacrosse rosters
                  </Link>
                </div>
              </div>
              <div className="dash-contest-card__stats">
                <div>
                  <span className="dash-contest-card__stat-label">Season</span>
                  <span className="dash-contest-card__stat-val">
                    {lacrosseQ.isLoading ? "…" : lacrosseQ.data?.season_year ?? "—"}
                  </span>
                </div>
                <div>
                  <span className="dash-contest-card__stat-label">Bank</span>
                  <span className="dash-contest-card__stat-val">100</span>
                </div>
              </div>
              <Link className="dash-contest-card__link" to="/lacrosse">
                Open
              </Link>
            </li>
            <li className="dash-contest-card dash-contest-card--volleyball dash-contest-card--compact">
              <div className="dash-contest-card__icon" aria-hidden>
                🏐
              </div>
              <div className="dash-contest-card__body">
                <div className="dash-contest-card__sport">Volleyball</div>
                <div className="dash-contest-card__event">
                  AVP {volleyballQ.data?.season_year ?? "2026"} — {volleyballQ.data?.event_count ?? "—"} stops
                </div>
                <div className="dash-contest-card__detail">
                  {volleyballQ.data?.fantasy_enabled
                    ? "Fantasy is live — build lineups from the hub."
                    : "Schedule hub live; player pool + WakiPoints table coming soon."}
                </div>
              </div>
              <div className="dash-contest-card__stats">
                <div>
                  <span className="dash-contest-card__stat-label">Stops</span>
                  <span className="dash-contest-card__stat-val">
                    {volleyballQ.isLoading ? "…" : volleyballQ.data?.event_count ?? "—"}
                  </span>
                </div>
                <div>
                  <span className="dash-contest-card__stat-label">Fantasy</span>
                  <span className="dash-contest-card__stat-val">
                    {volleyballQ.isLoading ? "…" : volleyballQ.data?.fantasy_enabled ? "On" : "Soon"}
                  </span>
                </div>
              </div>
              <Link className="dash-contest-card__link" to="/volleyball">
                Open
              </Link>
            </li>
          </ul>
        </section>
      </div>
    </>
  );
}
