import { Link } from "react-router-dom";

type Props = {
  pickleballRank: number | null;
  pickleballPts: number;
  nascarRank: number | null;
  nascarPts: number;
  nascarLoading: boolean;
  lacrosseSeasonYear: number | null;
  lacrosseLoading: boolean;
};

export default function DashboardSeasonStandingsHero({
  pickleballRank,
  pickleballPts,
  nascarRank,
  nascarPts,
  nascarLoading,
  lacrosseSeasonYear,
  lacrosseLoading,
}: Props) {
  const pbVal =
    pickleballRank != null ? `#${pickleballRank} · ${Math.round(pickleballPts)} pts` : `— · ${Math.round(pickleballPts)} pts`;
  const nascarVal = nascarLoading
    ? "…"
    : nascarRank != null
      ? `#${nascarRank} · ${Math.round(nascarPts)} pts`
      : `— · ${Math.round(nascarPts)} pts`;
  const laxVal = lacrosseLoading ? "…" : lacrosseSeasonYear != null ? `PLL ${lacrosseSeasonYear}` : "PLL";

  return (
    <section className="dash-standings-hero" aria-labelledby="dash-standings-hero-title">
      <h2 id="dash-standings-hero-title" className="dash-standings-hero-kicker">
        Season standings
      </h2>
      <ul className="dash-standings-hero-list">
        <li className="dash-standings-hero-row dash-standings-hero-row--pickleball">
          <span className="dash-standings-hero-ico" aria-hidden>
            🏓
          </span>
          <span className="dash-standings-hero-sport">Pickleball</span>
          <span className="dash-standings-hero-val">{pbVal}</span>
        </li>
        <li className="dash-standings-hero-row dash-standings-hero-row--nascar">
          <span className="dash-standings-hero-ico" aria-hidden>
            🏁
          </span>
          <span className="dash-standings-hero-sport">NASCAR</span>
          <span className="dash-standings-hero-val">{nascarVal}</span>
        </li>
        <li className="dash-standings-hero-row dash-standings-hero-row--lacrosse">
          <span className="dash-standings-hero-ico" aria-hidden>
            🥍
          </span>
          <span className="dash-standings-hero-sport">Lacrosse</span>
          <span className="dash-standings-hero-val">{laxVal}</span>
        </li>
      </ul>
      <p className="dash-standings-hero-links">
        <Link className="dash-ms-inline-link" to="/pick-teams/leaderboard">
          PB board
        </Link>
        {" · "}
        <Link className="dash-ms-inline-link" to="/nascar/leaderboard">
          NASCAR board
        </Link>
        {" · "}
        <Link className="dash-ms-inline-link" to="/lacrosse">
          Lacrosse hub
        </Link>
      </p>
    </section>
  );
}
