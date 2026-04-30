import { Link } from "react-router-dom";

/**
 * Homepage-style teaser — links to editorial picks pages (dashboard + logged-out home).
 */
export default function ThisWeekPicksHomeSection({ variant = "dashboard" }: { variant?: "dashboard" | "login" }) {
  const blockClass =
    variant === "login" ? "dash-week-picks-home dash-week-picks-home--login" : "dash-week-picks-home";

  return (
    <section className={blockClass} aria-labelledby="dash-week-picks-home-title">
      <h2 id="dash-week-picks-home-title" className="dash-week-picks-home__title">
        🔥 This Week&apos;s Picks
      </h2>
      <ul className="dash-week-picks-home__list">
        <li>
          <Link className="dash-week-picks-home__link" to="/nascar-texas-picks">
            <span className="dash-week-picks-home__emoji" aria-hidden>
              🏁
            </span>
            <span className="dash-week-picks-home__label">NASCAR Picks</span>
            <span className="dash-week-picks-home__arrow">→</span>
            <span className="dash-week-picks-home__venue">Texas Motor Speedway</span>
          </Link>
        </li>
        <li>
          <Link className="dash-week-picks-home__link" to="/ppa-atlanta-picks">
            <span className="dash-week-picks-home__emoji" aria-hidden>
              🏓
            </span>
            <span className="dash-week-picks-home__label">Pickleball Picks</span>
            <span className="dash-week-picks-home__arrow">→</span>
            <span className="dash-week-picks-home__venue">PPA Atlanta</span>
          </Link>
        </li>
        <li>
          <Link className="dash-week-picks-home__link" to="/lacrosse">
            <span className="dash-week-picks-home__emoji" aria-hidden>
              🥍
            </span>
            <span className="dash-week-picks-home__label">Lacrosse Slate</span>
            <span className="dash-week-picks-home__arrow">→</span>
            <span className="dash-week-picks-home__venue">PLL Power + WakiCash</span>
          </Link>
        </li>
      </ul>
    </section>
  );
}
