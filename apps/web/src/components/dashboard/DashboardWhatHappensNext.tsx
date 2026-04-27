import { useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { apiGet } from "../../api";
import type { DashboardData } from "../Dashboard";
import { formatRankJump, whatIfScoringBlurb, whatIfTitle } from "./whatIfPickleball";
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
  const seasonYear = new Date().getUTCFullYear();
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

  const nascarWeekLabel = focusWeek ? `${focusWeek.race_name} · ${focusWeek.track}` : "This week";

  return (
    <section className="dash-section dash-section--whatif" aria-labelledby="dash-whatif-title">
      <h2 id="dash-whatif-title" className="dash-section-title">
        What happens next
      </h2>
      <p className="dash-section-lead dash-section-lead--compact">
        <strong>Pickleball:</strong> next-match slices from your roster (same engine as{" "}
        <Link to="/scoring-table">scoring table</Link>). <strong>NASCAR:</strong> one card per driver in your current
        week lineup (points preview when results post).
      </p>

      <div className="dash-whatif-split">
        <div className="dash-whatif-col dash-whatif-col--pickleball">
          <h3 className="dash-whatif-col-title">Pickleball</h3>
          {whatIf.length === 0 ? (
            <p className="dash-empty">
              No undecided next matches for rostered players — check back after schedules add upcoming rows.
            </p>
          ) : (
            <ul className="dash-whatif-list dash-whatif-list--col">
              {whatIf.map((s) => {
                const lineDelta = s.scenario_player_delta;
                const netDelta = s.roster_waki_delta;
                const showNetNote = Math.abs(lineDelta - netDelta) > 0.02;
                return (
                  <li
                    key={s.scenario_key}
                    className={`dash-whatif-card dash-whatif--${s.impact}${s.kind === "lose_next" ? " dash-whatif--downside" : ""}`}
                  >
                    <div className="dash-whatif-top">
                      <span className="dash-whatif-emoji" aria-hidden>
                        {s.impact === "high" ? "🔥" : s.impact === "risk" ? "⚠️" : "📈"}
                      </span>
                      <div className="dash-whatif-head">
                        <div className="dash-whatif-title-row">
                          <span
                            className={`dash-whatif-kind dash-whatif-kind--${s.kind === "win_next" ? "win" : "lose"}`}
                          >
                            {s.kind === "win_next" ? "Win" : "Loss"}
                          </span>
                          <div className="dash-whatif-title">{whatIfTitle(s.kind, s.player_name)}</div>
                        </div>
                        <div className="dash-whatif-meta">
                          {s.tournament_name} · {s.division_label}
                          <br />
                          vs {s.opponent} ·{" "}
                          {s.event_date
                            ? new Date(s.event_date).toLocaleString(undefined, {
                                dateStyle: "medium",
                                timeStyle: "short",
                              })
                            : s.event_date}
                        </div>
                      </div>
                      <div className="dash-whatif-delta">
                        <span className={lineDelta >= 0 ? "dash-whatif-pts-pos" : "dash-whatif-pts-neg"}>
                          {lineDelta >= 0 ? "+" : ""}
                          {lineDelta} pts
                        </span>
                        <span className="dash-whatif-delta-sub">{s.player_name} in this lineup</span>
                        {showNetNote ? (
                          <span className="dash-whatif-net-roster">
                            Full lineup (this match): {netDelta >= 0 ? "+" : ""}
                            {netDelta}
                          </span>
                        ) : null}
                        <span className="dash-whatif-rankline">{formatRankJump(s.rank_before, s.rank_after)}</span>
                      </div>
                    </div>
                    <p className="dash-whatif-caption">{whatIfScoringBlurb(s.kind, lineDelta, netDelta)}</p>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="dash-whatif-col dash-whatif-col--nascar">
          <h3 className="dash-whatif-col-title">NASCAR</h3>
          {!statusQ.data?.enabled ? (
            <p className="dash-empty">
              {statusQ.isLoading || weeksQ.isLoading
                ? "Loading NASCAR…"
                : statusQ.data?.message ?? "NASCAR picks unlock once weeks and drivers are loaded."}
            </p>
          ) : nascarPicks.length === 0 ? (
            <p className="dash-empty">
              No drivers in <strong>{nascarWeekLabel}</strong> yet.{" "}
              <Link to={focusWeek ? `/nascar?week_key=${encodeURIComponent(focusWeek.week_key)}` : "/nascar"}>
                Build your lineup
              </Link>{" "}
              to see per-driver previews here.
            </p>
          ) : (
            <ul className="dash-whatif-list dash-whatif-list--col">
              {nascarPicks.map((p) => (
                <li key={p.driver_key} className="dash-whatif-card dash-whatif-card--nascar">
                  <div className="dash-whatif-top">
                    <span className="dash-whatif-emoji" aria-hidden>
                      🏁
                    </span>
                    <div className="dash-whatif-head">
                      <div className="dash-whatif-title-row">
                        <span className="dash-whatif-kind dash-whatif-kind--win">Driver</span>
                        <div className="dash-whatif-title">If {p.driver_name} scores in the points</div>
                      </div>
                      <div className="dash-whatif-meta">
                        {nascarWeekLabel}
                        <br />
                        Slot {p.slot_index + 1}
                        {p.is_captain ? " · Captain (×1.5 on race total)" : ""}
                      </div>
                    </div>
                    <div className="dash-whatif-delta">
                      <span className="dash-whatif-pts-pos">—</span>
                      <span className="dash-whatif-delta-sub">Pts after results</span>
                    </div>
                  </div>
                  <p className="dash-whatif-caption">
                    Finish band, position movement, laps led (+0.1/lap), fastest lap, and DNF rules apply per the
                    WakiBet NASCAR table below once results are in. Captain multiplies that driver&apos;s race total by
                    1.5×.
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
