import { Link } from "react-router-dom";
import { usePicksSpotlight } from "../hooks/usePicksSpotlight";

const EMOJI: Record<string, string> = {
  volleyball: "🏐",
  pickleball: "🏓",
  lacrosse: "🥍",
};

/**
 * Homepage-style teaser — reads week/tournament spotlight windows from the API so
 * venues advance automatically when each window's dates pass.
 */
export default function ThisWeekPicksHomeSection({
  variant = "dashboard",
  compact = false,
}: {
  variant?: "dashboard" | "login";
  /** Tighter layout for top dashboard row beside tournament prizes */
  compact?: boolean;
}) {
  const { items } = usePicksSpotlight();

  const blockClass = [
    variant === "login" ? "dash-week-picks-home dash-week-picks-home--login" : "dash-week-picks-home",
    compact ? "dash-week-picks-home--compact" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const title = compact ? "🔥 Week picks" : "🔥 This Week's Picks";

  return (
    <section className={blockClass} aria-labelledby="dash-week-picks-home-title">
      <h2 id="dash-week-picks-home-title" className="dash-week-picks-home__title">
        {variant === "login" ? "🔥 This Week's Picks" : title}
      </h2>
      <ul className="dash-week-picks-home__list">
        {items.map((row) => (
          <li key={row.sport_key}>
            <Link className="dash-week-picks-home__link" to={row.href}>
              <span className="dash-week-picks-home__emoji" aria-hidden>
                {EMOJI[row.sport_key] ?? "•"}
              </span>
              <span className="dash-week-picks-home__label">
                {compact ? row.label_short : row.label_full}
              </span>
              {!compact ? <span className="dash-week-picks-home__arrow">→</span> : null}
              <span className="dash-week-picks-home__venue">{row.venue}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
