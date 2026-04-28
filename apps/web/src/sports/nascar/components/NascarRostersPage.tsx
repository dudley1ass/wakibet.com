import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { NASCAR_CUP_SCHEDULE_SEASON_YEAR } from "@wakibet/shared";
import { Link } from "react-router-dom";
import { apiGet } from "../../../api";
import type { SessionUser } from "../../../App";
import type { NascarSeasonLineupWeekPayload, NascarSeasonLineupsPayload } from "../lib/dashboardNascar";
import "../../../components/dashboard.css";

type Props = {
  user: SessionUser;
};

function raceDateLabel(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function statusPillClass(status: NascarSeasonLineupWeekPayload["status"]): string {
  if (status === "closed") return "rost-badge";
  if (status === "locked") return "rost-badge rost-badge--warn";
  return "rost-badge";
}

export default function NascarRostersPage({ user }: Props) {
  const seasonYear = NASCAR_CUP_SCHEDULE_SEASON_YEAR;
  const {
    data,
    isPending: loading,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: ["nascar", "lineups", seasonYear] as const,
    queryFn: () =>
      apiGet<NascarSeasonLineupsPayload>(`/api/v1/nascar/lineups?season_year=${encodeURIComponent(String(seasonYear))}`),
    staleTime: 30_000,
  });

  const error = queryError instanceof Error ? queryError.message : queryError ? "Could not load NASCAR lineups." : null;
  const weeks = data?.weeks ?? [];
  const lineupSize = data?.lineup_size ?? 5;
  const savedCount = useMemo(() => weeks.filter((w) => w.picks.length > 0).length, [weeks]);

  return (
    <div className="rost-shell">
      <header className="rost-head">
        <div>
          <h1 className="rost-title">My NASCAR Lineups</h1>
          <p className="rost-sub">
            <strong>{user.display_name || user.email}</strong> — {data?.season ?? seasonYear} Cup schedule and your picks
            per race
          </p>
        </div>
        <div className="rost-actions">
          <button type="button" className="dash-ghost-btn" onClick={() => void refetch()} disabled={loading}>
            {loading ? "Refreshing…" : "Refresh"}
          </button>
          <Link className="dash-ghost-btn" to="/nascar">
            NASCAR Hub
          </Link>
          <Link className="dash-main-btn rost-dash-link" to="/">
            Dashboard
          </Link>
        </div>
      </header>

      {error && <p className="dash-error">{error}</p>}

      {loading && !data && (
        <p className="dash-loading" role="status">
          Loading races…
        </p>
      )}

      {data && !loading && weeks.length === 0 && (
        <div className="rost-empty dash-card">
          <p className="rost-empty-title">No races on the calendar</p>
          <p className="rost-empty-body">There are no NASCAR Cup weeks loaded for this season yet.</p>
          <Link className="dash-main-btn" to="/nascar">
            Open NASCAR Hub
          </Link>
        </div>
      )}

      {data && weeks.length > 0 && savedCount === 0 && (
        <p className="dash-sub nascar-rost-season-hint" role="status">
          No saved lineups yet — pick <strong>{lineupSize} drivers</strong> (one captain) and tiebreakers on the{" "}
          <Link to="/nascar">NASCAR hub</Link> for each open race. Races below show your drivers after you save.
        </p>
      )}

      {data && weeks.length > 0 && (
        <ul className="rost-list nascar-rost-list">
          {weeks.map((w) => (
            <li key={w.week_key}>
              <NascarWeekLineupCard week={w} lineupSize={lineupSize} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function NascarWeekLineupCard({
  week,
  lineupSize,
}: {
  week: NascarSeasonLineupWeekPayload;
  lineupSize: number;
}) {
  const sorted = [...week.picks].sort((a, b) => a.slot_index - b.slot_index);
  const hubTo = `/nascar?week_key=${encodeURIComponent(week.week_key)}`;
  const statusLabel = week.status === "upcoming" ? "Open" : week.status === "locked" ? "Live" : "Closed";

  return (
    <article className="rost-card dash-card nascar-rost-card">
      <div className="rost-card-head">
        <div className="rost-card-head-main">
          <div className="rost-tournament">{week.race_name}</div>
          <div className="rost-meta">
            <span className={statusPillClass(week.status)}>{statusLabel}</span>
            {!week.lineup_complete && week.picks.length > 0 ? (
              <span className="rost-badge rost-badge--warn" title="Needs five picks, one captain, and tiebreakers">
                {week.picks.length}/{lineupSize} picks
              </span>
            ) : null}
            {!week.lineup_complete && week.picks.length === 0 ? (
              <span className="rost-badge rost-badge--warn">No lineup</span>
            ) : null}
          </div>
          <p className="nascar-rost-race-meta">
            {week.track} · {raceDateLabel(week.race_start_at)}
          </p>
        </div>
        <div className="rost-card-head-side">
          <div className="rost-pts" title="Fantasy points scored this race (if scored)">
            {Math.round(week.total_points * 10) / 10}
            <span className="rost-pts-label">Pts</span>
          </div>
        </div>
      </div>

      {week.lineup_complete || week.picks.length > 0 ? (
        <div className="rost-players">
          <span className="rost-players-label">Drivers</span>
          {sorted.length > 0 ? (
            <ol className="rost-pick-list">
              {sorted.map((p) => (
                <li key={p.slot_index} className="rost-pick-row">
                  <span className="rost-slot">#{p.slot_index + 1}</span>
                  <span className="rost-name">{p.driver_name}</span>
                  {p.car_number ? (
                    <span className="nascar-rost-car" aria-label="Car number">
                      #{p.car_number}
                    </span>
                  ) : null}
                  {p.is_captain ? <span className="rost-cap">Captain</span> : null}
                </li>
              ))}
            </ol>
          ) : (
            <p className="dash-sub nascar-rost-empty-picks">No drivers on file for this race.</p>
          )}
          {week.lineup_complete ? (
            <p className="nascar-rost-tb-summary">
              Tiebreakers: <strong>{week.tiebreaker_win_margin_seconds}s</strong> win margin ·{" "}
              <strong>{week.tiebreaker_caution_laps}</strong> caution laps
            </p>
          ) : week.picks.length > 0 ? (
            <p className="nascar-rost-tb-summary nascar-rost-tb-summary--incomplete">Finish lineup and tiebreakers on the hub.</p>
          ) : null}
        </div>
      ) : (
        <p className="dash-sub nascar-rost-empty-picks">No lineup saved for this race.</p>
      )}

      <div className="nascar-rost-card-foot">
        <Link className="dash-ghost-btn" to={hubTo}>
          {week.status === "upcoming" ? "Edit on hub" : "View on hub"}
        </Link>
      </div>
    </article>
  );
}
