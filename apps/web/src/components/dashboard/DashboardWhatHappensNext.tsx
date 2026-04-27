import { useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import { NASCAR_CUP_SCHEDULE_SEASON_YEAR } from "@wakibet/shared";
import { Link } from "react-router-dom";
import { apiGet } from "../../api";
import type { DashboardData } from "../Dashboard";
import {
  nascarFocusWeek,
  type NascarLineupPayload,
  type NascarWeekRow,
} from "../../sports/nascar/lib/dashboardNascar";

type NascarStatus = {
  sport: "nascar";
  enabled: boolean;
  total_weeks: number;
  total_drivers: number;
  message: string;
};

type NascarWeeksPayload = { season: string; weeks: NascarWeekRow[] };

type Props = {
  preview: DashboardData;
};

export default function DashboardWhatHappensNext({ preview }: Props) {
  const seasonYear = NASCAR_CUP_SCHEDULE_SEASON_YEAR;
  const whatIf = preview.fantasy_what_if ?? [];

  const [statusQ, weeksQ] = useQueries({
    queries: [
      {
        queryKey: ["nascar", "status"] as const,
        queryFn: () => apiGet<NascarStatus>("/api/v1/nascar/status"),
      },
      {
        queryKey: ["nascar", "weeks", seasonYear] as const,
        queryFn: () => apiGet<NascarWeeksPayload>(`/api/v1/nascar/weeks?season_year=${seasonYear}`),
      },
    ],
  });

  const focusWeek = useMemo(() => nascarFocusWeek(weeksQ.data?.weeks ?? []), [weeksQ.data?.weeks]);

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

  const nascarPicks = useMemo(() => {
    const raw = lineupQ.data?.picks ?? [];
    return [...raw].sort((a, b) => a.slot_index - b.slot_index);
  }, [lineupQ.data?.picks]);

  return (
    <section className="dash-section dash-section--whatif dash-section--whatif-micro" aria-labelledby="dash-whatif-title">
      <h2 id="dash-whatif-title" className="dash-section-title">
        What happens next
      </h2>
      <p className="dash-section-lead dash-section-lead--compact">
        Short read — full pickleball math on the{" "}
        <Link to="/scoring-table">scoring table</Link>; NASCAR race points on{" "}
        <Link to="/nascar/scoring">NASCAR table</Link>.
      </p>

      <div className="dash-whatif-split dash-whatif-split--micro">
        <div className="dash-whatif-col dash-whatif-col--pickleball">
          <h3 className="dash-whatif-col-title">Pickleball</h3>
          {whatIf.length === 0 ? (
            <p className="dash-empty dash-empty--micro">No next-match previews yet.</p>
          ) : (
            <ul className="dash-whatif-micro-list">
              {whatIf.map((s) => {
                const d = s.scenario_player_delta;
                const sign = d >= 0 ? "+" : "";
                const verb = s.kind === "win_next" ? "wins" : "loses";
                return (
                  <li key={s.scenario_key} className="dash-whatif-micro-line">
                    If <strong>{s.player_name}</strong> {verb} next:{" "}
                    <span className={d >= 0 ? "dash-whatif-micro-pts-pos" : "dash-whatif-micro-pts-neg"}>
                      {sign}
                      {d} pts
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="dash-whatif-col dash-whatif-col--nascar">
          <h3 className="dash-whatif-col-title">NASCAR</h3>
          {!statusQ.data?.enabled ? (
            <p className="dash-empty dash-empty--micro">
              {statusQ.isLoading || weeksQ.isLoading ? "Loading…" : "Picks open when weeks + drivers are live."}
            </p>
          ) : nascarPicks.length === 0 ? (
            <p className="dash-empty dash-empty--micro">
              <Link to={focusWeek ? `/nascar?week_key=${encodeURIComponent(focusWeek.week_key)}` : "/nascar"}>
                Add drivers
              </Link>{" "}
              to see previews.
            </p>
          ) : (
            <ul className="dash-whatif-micro-list">
              {nascarPicks.map((p) => (
                <li key={p.driver_key} className="dash-whatif-micro-line">
                  <strong>{p.driver_name}</strong>
                  {p.is_captain ? " · C" : ""}: race pts after results{" "}
                  <span className="dash-whatif-micro-pts-muted">(TBD)</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
