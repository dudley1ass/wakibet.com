import { Link } from "react-router-dom";

/**
 * Homepage-style teaser — links to editorial picks pages (dashboard + logged-out home).
 */
export default function ThisWeekPicksHomeSection({
  variant = "dashboard",
  compact = false,
}: {
  variant?: "dashboard" | "login";
  /** Tighter layout for top dashboard row beside season prizes */
  compact?: boolean;
}) {
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
        <li>
          <Link className="dash-week-picks-home__link" to="/nascar-texas-picks">
            <span className="dash-week-picks-home__emoji" aria-hidden>
              🏁
            </span>
            <span className="dash-week-picks-home__label">{compact ? "NASCAR" : "NASCAR Picks"}</span>
            {!compact ? <span className="dash-week-picks-home__arrow">→</span> : null}
            <span className="dash-week-picks-home__venue">{compact ? "Texas" : "Texas Motor Speedway"}</span>
          </Link>
        </li>
        <li>
          <Link className="dash-week-picks-home__link" to="/ppa-atlanta-picks">
            <span className="dash-week-picks-home__emoji" aria-hidden>
              🏓
            </span>
            <span className="dash-week-picks-home__label">{compact ? "Pickleball" : "Pickleball Picks"}</span>
            {!compact ? <span className="dash-week-picks-home__arrow">→</span> : null}
            <span className="dash-week-picks-home__venue">PPA Atlanta</span>
          </Link>
        </li>
        <li>
          <Link className="dash-week-picks-home__link" to="/lacrosse">
            <span className="dash-week-picks-home__emoji" aria-hidden>
              🥍
            </span>
            <span className="dash-week-picks-home__label">{compact ? "Lacrosse" : "Lacrosse Slate"}</span>
            {!compact ? <span className="dash-week-picks-home__arrow">→</span> : null}
            <span className="dash-week-picks-home__venue">{compact ? "Utah Open" : "Utah Open · PLL"}</span>
          </Link>
        </li>
      </ul>
    </section>
  );
}
