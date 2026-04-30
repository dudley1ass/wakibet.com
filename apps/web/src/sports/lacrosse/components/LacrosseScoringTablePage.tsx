import { Link } from "react-router-dom";

export default function LacrosseScoringTablePage() {
  return (
    <div className="static-page-wrap">
      <div className="static-page-card">
        <div className="dash-head" style={{ marginBottom: 8 }}>
          <h1 style={{ margin: 0 }}>
            <span aria-hidden>🥍 </span>WakiBet Lacrosse Rating + WakiCash
          </h1>
          <Link className="dash-ghost-btn" to="/lacrosse">
            Back to Lacrosse
          </Link>
        </div>
        <div className="static-page-body">
          <p className="scoring-lede">
            Team power rating formula:
            <br />
            <strong>R = 0.30O + 0.25D + 0.15G + 0.10F + 0.10P + 0.05S + 0.05H</strong>
          </p>
          <div className="scoring-board">
            <section className="scoring-block">
              <h3 className="scoring-block-title">Weights</h3>
              <div className="scoring-rows">
                <div className="scoring-row"><span className="scoring-label">Offense (O)</span><span className="scoring-pts">30%</span></div>
                <div className="scoring-row"><span className="scoring-label">Defense (D)</span><span className="scoring-pts">25%</span></div>
                <div className="scoring-row"><span className="scoring-label">Goalie (G)</span><span className="scoring-pts">15%</span></div>
                <div className="scoring-row"><span className="scoring-label">Recent form (F)</span><span className="scoring-pts">10%</span></div>
                <div className="scoring-row"><span className="scoring-label">Possession/FO (P)</span><span className="scoring-pts">10%</span></div>
                <div className="scoring-row"><span className="scoring-label">Strength of schedule (S)</span><span className="scoring-pts">5%</span></div>
                <div className="scoring-row"><span className="scoring-label">Home/venue (H)</span><span className="scoring-pts">5%</span></div>
              </div>
            </section>
            <section className="scoring-block">
              <h3 className="scoring-block-title">Component Inputs</h3>
              <div className="scoring-rows">
                <div className="scoring-row"><span className="scoring-label">O</span><span className="scoring-pts">Goals/G (50%), Shooting% (30%), Assists/G (20%)</span></div>
                <div className="scoring-row"><span className="scoring-label">D</span><span className="scoring-pts">Inverse GA/G (60%), Caused TO (25%), Penalty discipline (15%)</span></div>
                <div className="scoring-row"><span className="scoring-label">G</span><span className="scoring-pts">Save% (70%), Goals allowed avg (30%)</span></div>
                <div className="scoring-row"><span className="scoring-label">F</span><span className="scoring-pts">Recent production trend proxy</span></div>
                <div className="scoring-row"><span className="scoring-label">P</span><span className="scoring-pts">Faceoff% (70%), Ground balls (30%)</span></div>
              </div>
            </section>
            <section className="scoring-block">
              <h3 className="scoring-block-title">WakiCash Slate Rules</h3>
              <div className="scoring-rows">
                <div className="scoring-row"><span className="scoring-label">Starting bankroll</span><span className="scoring-pts">100 WakiCash per slate</span></div>
                <div className="scoring-row"><span className="scoring-label">Max per pick</span><span className="scoring-pts">40 WakiCash</span></div>
                <div className="scoring-row"><span className="scoring-label">Payout model</span><span className="scoring-pts">True odds-based return from American odds</span></div>
                <div className="scoring-row"><span className="scoring-label">Leaderboard metrics</span><span className="scoring-pts">Total WakiCash, ROI, SharpScore</span></div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
