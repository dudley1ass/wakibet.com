import { Link } from "react-router-dom";
import type { SessionUser } from "../../../App";
import type { NascarWeekRow } from "../lib/dashboardNascar";
import { NASCAR_LINEUP_WAKICASH_BUDGET, NASCAR_LINEUP_MAX_PREMIUM_OVER_THRESHOLD, NASCAR_PREMIUM_WAKICASH_THRESHOLD } from "../lib/nascarLineupRules";

type Props = {
  user: SessionUser | null;
  weeks: NascarWeekRow[];
  weeksLoading: boolean;
  weeksError: boolean;
  selectedWeekKey: string;
  onSelectWeek: (weekKey: string) => void;
};

function lockLabel(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export default function NascarHubHero({
  user,
  weeks,
  weeksLoading,
  weeksError,
  selectedWeekKey,
  onSelectWeek,
}: Props) {
  const active = weeks.find((w) => w.week_key === selectedWeekKey) ?? null;

  return (
    <section className="nascar-hub-hero" aria-labelledby="nascar-hub-hero-title">
      <div className="nascar-hub-hero__row">
        <span className="nascar-hub-hero__icon" aria-hidden>
          🏁
        </span>
        <div className="nascar-hub-hero__body">
          <p className="nascar-hub-hero__kicker">NASCAR Cup</p>
          <h2 id="nascar-hub-hero-title" className="nascar-hub-hero__title">
            Race weekend picks
          </h2>
          <p className="nascar-hub-hero__lead">
            Build a <strong>5-driver</strong> lineup under <strong>{NASCAR_LINEUP_WAKICASH_BUDGET} WakiCash</strong>, max{" "}
            <strong>{NASCAR_LINEUP_MAX_PREMIUM_OVER_THRESHOLD}</strong> over <strong>{NASCAR_PREMIUM_WAKICASH_THRESHOLD}</strong>,
            one captain — same shape as pickleball, different sport.
          </p>

          {weeksLoading ? (
            <p className="nascar-hub-hero__status">Loading schedule…</p>
          ) : weeksError ? (
            <p className="nascar-hub-hero__status nascar-hub-hero__status--error">Could not load the race schedule.</p>
          ) : weeks.length === 0 ? (
            <p className="nascar-hub-hero__status">No Cup weeks in the database yet.</p>
          ) : (
            <>
              <label className="nascar-hub-hero__race-label">
                <span className="nascar-hub-hero__race-label-text">Select race</span>
                <select
                  className="nascar-hub-hero__select"
                  value={selectedWeekKey}
                  onChange={(e) => onSelectWeek(e.target.value)}
                  aria-label="NASCAR Cup race weekend"
                >
                  {weeks.map((w) => (
                    <option key={w.week_key} value={w.week_key}>
                      {w.race_name} — {w.track}
                    </option>
                  ))}
                </select>
              </label>
              {active ? (
                <div className="nascar-hub-hero__meta">
                  <span className={`nascar-hub-hero__pill nascar-hub-hero__pill--${active.status}`}>
                    {active.status === "upcoming" ? "Picks open" : active.status === "locked" ? "Locked" : "Closed"}
                  </span>
                  <span className="nascar-hub-hero__meta-line">
                    Lineup lock: <strong>{lockLabel(active.lock_at)}</strong> · Green:{" "}
                    <strong>{lockLabel(active.race_start_at)}</strong>
                  </span>
                </div>
              ) : null}
              {!user ? (
                <p className="nascar-hub-hero__signin">
                  <Link className="dash-main-btn" to="/">
                    Sign in from the dashboard
                  </Link>{" "}
                  <span className="nascar-hub-hero__signin-note">to save a lineup for this race.</span>
                </p>
              ) : (
                <p className="nascar-hub-hero__cta-hint">
                  <a href="#nascar-lineup-builder" className="nascar-hub-hero__anchor">
                    Choose drivers below
                  </a>
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
