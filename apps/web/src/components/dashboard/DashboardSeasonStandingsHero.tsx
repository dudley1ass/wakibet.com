import { Link } from "react-router-dom";

type Props = {
  pickleballRank: number | null;
  pickleballPts: number;
  lacrosseSeasonYear: number | null;
  lacrosseLoading: boolean;
  volleyballSeasonYear: number | null;
  volleyballLoading: boolean;
  pokerSeasonYear: number | null;
  pokerLoading: boolean;
  investContestKey?: string | null;
  investLoading?: boolean;
};

export default function DashboardSeasonStandingsHero({
  pickleballRank,
  pickleballPts,
  lacrosseSeasonYear,
  lacrosseLoading,
  volleyballSeasonYear,
  volleyballLoading,
  pokerSeasonYear,
  pokerLoading,
  investContestKey = null,
  investLoading = false,
}: Props) {
  const pbVal =
    pickleballRank != null ? `#${pickleballRank} · ${Math.round(pickleballPts)} pts` : `— · ${Math.round(pickleballPts)} pts`;
  const laxVal = lacrosseLoading ? "…" : lacrosseSeasonYear != null ? `PLL ${lacrosseSeasonYear}` : "PLL";
  const vbVal = volleyballLoading ? "…" : volleyballSeasonYear != null ? `AVP ${volleyballSeasonYear}` : "AVP";
  const pokerVal = pokerLoading ? "…" : pokerSeasonYear != null ? `WSOP ${pokerSeasonYear}` : "WSOP";
  const investVal = investLoading ? "…" : investContestKey ?? "Weekly";

  return (
    <section className="dash-standings-hero" aria-labelledby="dash-standings-hero-title">
      <h2 id="dash-standings-hero-title" className="dash-standings-hero-kicker">
        Season standings
      </h2>
      <ul className="dash-standings-hero-list">
        <li className="dash-standings-hero-row dash-standings-hero-row--pickleball">
          <Link
            to="/pick-teams/leaderboard"
            className="dash-standings-hero-link"
            aria-label="Open the pickleball season leaderboard"
          >
            <span className="dash-standings-hero-ico" aria-hidden>
              🏓
            </span>
            <span className="dash-standings-hero-sport">Pickleball</span>
            <span className="dash-standings-hero-val">{pbVal}</span>
          </Link>
        </li>
        <li className="dash-standings-hero-row dash-standings-hero-row--lacrosse">
          <Link
            to="/lacrosse/leaderboard"
            className="dash-standings-hero-link"
            aria-label="Open the lacrosse standings"
          >
            <span className="dash-standings-hero-ico" aria-hidden>
              🥍
            </span>
            <span className="dash-standings-hero-sport">Lacrosse</span>
            <span className="dash-standings-hero-val">{laxVal}</span>
          </Link>
        </li>
        <li className="dash-standings-hero-row dash-standings-hero-row--volleyball">
          <Link
            to="/volleyball/leaderboard"
            className="dash-standings-hero-link"
            aria-label="Open the volleyball standings"
          >
            <span className="dash-standings-hero-ico" aria-hidden>
              🏐
            </span>
            <span className="dash-standings-hero-sport">Volleyball</span>
            <span className="dash-standings-hero-val">{vbVal}</span>
          </Link>
        </li>
        <li className="dash-standings-hero-row dash-standings-hero-row--poker">
          <Link
            to="/poker/leaderboard"
            className="dash-standings-hero-link"
            aria-label="Open the poker standings"
          >
            <span className="dash-standings-hero-ico" aria-hidden>
              🃏
            </span>
            <span className="dash-standings-hero-sport">Poker</span>
            <span className="dash-standings-hero-val">{pokerVal}</span>
          </Link>
        </li>
        <li className="dash-standings-hero-row dash-standings-hero-row--invest">
          <Link
            to="/invest/leaderboard"
            className="dash-standings-hero-link"
            aria-label="Open the Invest standings"
          >
            <span className="dash-standings-hero-ico" aria-hidden>
              📈
            </span>
            <span className="dash-standings-hero-sport">Invest</span>
            <span className="dash-standings-hero-val">{investVal}</span>
          </Link>
        </li>
      </ul>
      <p className="dash-standings-hero-links">
        <Link className="dash-ms-inline-link" to="/pick-teams/leaderboard">
          PB board
        </Link>
        {" · "}
        <Link className="dash-ms-inline-link" to="/pickleball/rankings">
          PB player rankings
        </Link>
        {" · "}
        <Link className="dash-ms-inline-link" to="/lacrosse/leaderboard">
          Lacrosse
        </Link>
        {" · "}
        <Link className="dash-ms-inline-link" to="/volleyball/leaderboard">
          Volleyball
        </Link>
        {" · "}
        <Link className="dash-ms-inline-link" to="/poker/leaderboard">
          Poker
        </Link>
        {" · "}
        <Link className="dash-ms-inline-link" to="/invest/leaderboard">
          Invest
        </Link>
      </p>
    </section>
  );
}
