import { Link } from "react-router-dom";
import {
  INVEST_MIN_SHARE_PRICE_USD,
  INVEST_WEEKLY_END_TIME_ET,
  INVEST_WEEKLY_LOCK_TIME_ET,
  INVEST_WEEKLY_PICKEM_MAX_POSITION_PCT,
  INVEST_WEEKLY_PICKEM_PICKS,
  INVEST_WEEKLY_PICKEM_STARTING_CASH_USD,
} from "@wakibet/shared";
import "../../../components/dashboard.css";

export default function InvestScoringTablePage() {
  return (
    <div className="rost-shell">
      <header className="rost-head">
        <div>
          <h1 className="rost-title">Invest — Scoring table</h1>
          <p className="rost-sub">
            Rules and scoring for the Weekly Stock Pick&apos;em
          </p>
        </div>
        <div className="rost-actions">
          <Link className="dash-ghost-btn" to="/invest">
            Invest hub
          </Link>
          <Link className="dash-ghost-btn" to="/invest/pick">
            Build portfolio
          </Link>
          <Link className="dash-ghost-btn" to="/invest/portfolios">
            My portfolios
          </Link>
          <Link className="dash-ghost-btn" to="/invest/leaderboard">
            Standings
          </Link>
          <Link className="dash-main-btn rost-dash-link" to="/">
            Dashboard
          </Link>
        </div>
      </header>

      <ul className="rost-list">
        <li>
          <article className="rost-card dash-card">
            <div className="rost-card-head">
              <div className="rost-card-head-main">
                <div className="rost-tournament">Contest rules</div>
                <div className="rost-meta">
                  <span className="rost-badge">{INVEST_WEEKLY_PICKEM_PICKS} picks</span>
                  <span className="rost-badge">
                    ${INVEST_WEEKLY_PICKEM_STARTING_CASH_USD.toLocaleString()} virtual
                  </span>
                  <span className="rost-badge">≤ {INVEST_WEEKLY_PICKEM_MAX_POSITION_PCT}% / stock</span>
                  <span className="rost-badge">min ${INVEST_MIN_SHARE_PRICE_USD}/share</span>
                </div>
              </div>
            </div>
            <p className="rost-empty-body">
              Build a virtual portfolio of {INVEST_WEEKLY_PICKEM_PICKS} stocks or ETFs. Allocate up to 100% across positions
              (no single position above {INVEST_WEEKLY_PICKEM_MAX_POSITION_PCT}%). Excluded: OTC, penny stocks (under $
              {INVEST_MIN_SHARE_PRICE_USD}), leveraged ETFs, inverse ETFs.
            </p>
          </article>
        </li>

        <li>
          <article className="rost-card dash-card">
            <div className="rost-card-head">
              <div className="rost-card-head-main">
                <div className="rost-tournament">Schedule</div>
                <div className="rost-meta">
                  <span className="rost-badge">Lock {INVEST_WEEKLY_LOCK_TIME_ET}</span>
                  <span className="rost-badge">Settle {INVEST_WEEKLY_END_TIME_ET}</span>
                </div>
              </div>
            </div>
            <p className="rost-empty-body">
              Contest opens over the weekend. Portfolios lock Monday at the US equity market open (
              {INVEST_WEEKLY_LOCK_TIME_ET}). Scores update daily on official close prices. Final ranks settle at the Friday
              closing bell ({INVEST_WEEKLY_END_TIME_ET}).
            </p>
          </article>
        </li>

        <li>
          <article className="rost-card dash-card">
            <div className="rost-card-head">
              <div className="rost-card-head-main">
                <div className="rost-tournament">Portfolio return score</div>
                <div className="rost-meta">
                  <span className="rost-badge">Simple % return</span>
                </div>
              </div>
            </div>
            <p className="rost-empty-body">
              Score = ((current portfolio value − starting portfolio value) ÷ starting portfolio value) × 100. Highest
              percentage wins. Future iterations may add bonuses (best single pick, beat the S&amp;P 500, all picks positive,
              biggest comeback, top-10% daily finish).
            </p>
          </article>
        </li>
      </ul>

      <p className="dash-footnote">
        Free stock-picking contest using virtual portfolios. No real money is invested. Not investment advice.
      </p>
    </div>
  );
}
