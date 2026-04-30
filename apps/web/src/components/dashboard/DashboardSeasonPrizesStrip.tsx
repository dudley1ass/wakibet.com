/**
 * Compact season prize summary — sits beside “Week picks” on the dashboard.
 */
export default function DashboardSeasonPrizesStrip() {
  return (
    <section className="dash-season-prizes-strip" aria-labelledby="dash-season-prizes-strip-title">
      <p id="dash-season-prizes-strip-title" className="dash-season-prizes-strip-kicker">
        Season prizes
      </p>
      <ul className="dash-season-prizes-strip-list">
        <li className="dash-season-prizes-strip-row">
          <span className="dash-season-prizes-strip-ico" aria-hidden>
            🏓
          </span>
          <span className="dash-season-prizes-strip-sport">Pickleball</span>
          <span className="dash-season-prizes-strip-prize">New paddle</span>
        </li>
        <li className="dash-season-prizes-strip-row">
          <span className="dash-season-prizes-strip-ico" aria-hidden>
            🏁
          </span>
          <span className="dash-season-prizes-strip-sport">NASCAR</span>
          <span className="dash-season-prizes-strip-prize">Driver-of-choice shirt</span>
        </li>
        <li className="dash-season-prizes-strip-row">
          <span className="dash-season-prizes-strip-ico" aria-hidden>
            🥍
          </span>
          <span className="dash-season-prizes-strip-sport">Lacrosse</span>
          <span className="dash-season-prizes-strip-prize">Team-of-choice jersey</span>
        </li>
      </ul>
    </section>
  );
}
