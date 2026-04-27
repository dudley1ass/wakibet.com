import { useCallback, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import type { SessionUser } from "../../../App";
import { apiGet } from "../../../api";
import {
  NASCAR_LINEUP_MAX_PREMIUM_OVER_THRESHOLD,
  NASCAR_LINEUP_WAKICASH_BUDGET,
  NASCAR_PREMIUM_WAKICASH_THRESHOLD,
} from "../lib/nascarLineupRules";
import { nascarFocusWeek } from "../lib/dashboardNascar";
import type { NascarWeekRow } from "../lib/dashboardNascar";
import NascarHubHero from "./NascarHubHero";
import NascarHubLineupPanel, { type HubDriverRow } from "./NascarHubLineupPanel";

type DriversPayload = {
  budget_wakicash: number;
  premium_wakicash_threshold?: number;
  max_premium_drivers?: number;
  max_elite_drivers: number;
  drivers: HubDriverRow[];
};

type NascarWeeksPayload = { season: string; weeks: NascarWeekRow[] };

type Props = {
  user: SessionUser | null;
};

export default function NascarHubPage({ user }: Props) {
  const seasonYear = new Date().getUTCFullYear();
  const [params, setParams] = useSearchParams();
  const weekKeyParam = params.get("week_key");

  const driversQ = useQuery<DriversPayload>({
    queryKey: ["nascar", "drivers", "catalog"] as const,
    queryFn: () => apiGet<DriversPayload>("/api/v1/nascar/drivers"),
  });

  const weeksQ = useQuery<NascarWeeksPayload>({
    queryKey: ["nascar", "weeks", seasonYear] as const,
    queryFn: () => apiGet<NascarWeeksPayload>(`/api/v1/nascar/weeks?season_year=${seasonYear}`),
  });

  const weeks = weeksQ.data?.weeks ?? [];

  const selectedWeekKey = useMemo(() => {
    if (weekKeyParam && weeks.some((w) => w.week_key === weekKeyParam)) return weekKeyParam;
    return nascarFocusWeek(weeks)?.week_key ?? weeks[0]?.week_key ?? "";
  }, [weekKeyParam, weeks]);

  useEffect(() => {
    if (weeks.length === 0) return;
    if (!weekKeyParam || !weeks.some((w) => w.week_key === weekKeyParam)) {
      const def = nascarFocusWeek(weeks)?.week_key ?? weeks[0]!.week_key;
      setParams(
        (p) => {
          const next = new URLSearchParams(p);
          next.set("week_key", def);
          return next;
        },
        { replace: true },
      );
    }
  }, [weeks, weekKeyParam, setParams]);

  const onSelectWeek = useCallback(
    (weekKey: string) => {
      setParams(
        (p) => {
          const next = new URLSearchParams(p);
          next.set("week_key", weekKey);
          return next;
        },
        { replace: true },
      );
    },
    [setParams],
  );

  const activeWeek = weeks.find((w) => w.week_key === selectedWeekKey) ?? null;
  const drivers = driversQ.data?.drivers ?? [];

  return (
    <div className="dash-shell">
      <div className="dash-head">
        <div>
          <h1>
            NASCAR <span className="brand-jp">WakiBet</span>
          </h1>
          <p>
            Pick <strong>5 drivers</strong> under <strong>{NASCAR_LINEUP_WAKICASH_BUDGET} WakiCash</strong>, at most{" "}
            <strong>{NASCAR_LINEUP_MAX_PREMIUM_OVER_THRESHOLD}</strong> with salary over{" "}
            <strong>{NASCAR_PREMIUM_WAKICASH_THRESHOLD}</strong>, exactly one captain.
          </p>
        </div>
        <div className="dash-head-actions">
          <Link className="dash-ghost-btn" to="/nascar/scoring">
            Scoring table
          </Link>
          <Link className="dash-ghost-btn" to="/">
            Dashboard
          </Link>
        </div>
      </div>

      <NascarHubHero
        user={user}
        weeks={weeks}
        weeksLoading={weeksQ.isLoading}
        weeksError={weeksQ.isError}
        selectedWeekKey={selectedWeekKey}
        onSelectWeek={onSelectWeek}
      />

      {user && activeWeek && drivers.length > 0 ? (
        <NascarHubLineupPanel weekKey={activeWeek.week_key} week={activeWeek} drivers={drivers} />
      ) : null}

      <section className="dash-section" aria-labelledby="nascar-drivers-title">
        <h2 id="nascar-drivers-title" className="dash-section-title">
          Driver pool (WakiCash)
        </h2>
        <p className="dash-section-lead">
          Full list for reference — use <strong>Add drivers</strong> above to build your lineup. API:{" "}
          <code className="dash-code">GET /api/v1/nascar/drivers</code>
        </p>
        {driversQ.isLoading ? (
          <p className="dash-empty">Loading drivers…</p>
        ) : driversQ.isError ? (
          <p className="dash-error">Could not load drivers.</p>
        ) : drivers.length === 0 ? (
          <p className="dash-empty">No active drivers yet — run the NASCAR seed on the API, then refresh.</p>
        ) : (
          <div className="nascar-driver-table-wrap">
            <table className="nascar-driver-table">
              <thead>
                <tr>
                  <th scope="col">Driver</th>
                  <th scope="col">#</th>
                  <th scope="col">Sponsor</th>
                  <th scope="col">Make</th>
                  <th scope="col">Team</th>
                  <th scope="col">WakiCash</th>
                  <th scope="col">{`>${NASCAR_PREMIUM_WAKICASH_THRESHOLD}`}</th>
                </tr>
              </thead>
              <tbody>
                {drivers.map((d) => (
                  <tr key={d.driver_key}>
                    <td>{d.display_name}</td>
                    <td>{d.car_number ?? "—"}</td>
                    <td>{d.sponsor ?? "—"}</td>
                    <td>{d.manufacturer ?? "—"}</td>
                    <td>{d.team_name ?? "—"}</td>
                    <td>{d.waki_cash_price}</td>
                    <td>{d.is_elite ? "Yes" : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
