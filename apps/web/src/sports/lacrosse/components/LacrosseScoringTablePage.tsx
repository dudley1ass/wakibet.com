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
          <div className="scoring-board">
            <section className="scoring-block">
              <h3 className="scoring-block-title">Lineup format</h3>
              <div className="scoring-rows">
                <div className="scoring-row"><span className="scoring-label">Roster size</span><span className="scoring-pts">4 picks</span></div>
                <div className="scoring-row"><span className="scoring-label">Slots</span><span className="scoring-pts">Winner, Spread, Total, Wild</span></div>
                <div className="scoring-row"><span className="scoring-label">Salary cap</span><span className="scoring-pts">100 WakiCash</span></div>
                <div className="scoring-row"><span className="scoring-label">Max per pick</span><span className="scoring-pts">40 WakiCash</span></div>
                <div className="scoring-row"><span className="scoring-label">Required stack</span><span className="scoring-pts">3 players from winner team</span></div>
              </div>
            </section>
            <section className="scoring-block">
              <h3 className="scoring-block-title">Pick scoring</h3>
              <div className="scoring-rows">
                <div className="scoring-row"><span className="scoring-label">Winning pick</span><span className="scoring-pts">Stake × market odds return</span></div>
                <div className="scoring-row"><span className="scoring-label">Losing pick</span><span className="scoring-pts">-Stake</span></div>
                <div className="scoring-row"><span className="scoring-label">Est return</span><span className="scoring-pts">Sum of all winning pick returns</span></div>
              </div>
            </section>
            <section className="scoring-block">
              <h3 className="scoring-block-title">Leaderboard metrics</h3>
              <div className="scoring-rows">
                <div className="scoring-row"><span className="scoring-label">Primary</span><span className="scoring-pts">Total WakiCash</span></div>
                <div className="scoring-row"><span className="scoring-label">Secondary</span><span className="scoring-pts">ROI</span></div>
                <div className="scoring-row"><span className="scoring-label">Tertiary</span><span className="scoring-pts">SharpScore</span></div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
