import { Link } from "react-router-dom";

export default function VolleyballScoringTablePage() {
  return (
    <div className="static-page-wrap">
      <div className="static-page-card">
        <div className="dash-head" style={{ marginBottom: 8 }}>
          <h1 style={{ margin: 0 }}>
            <span aria-hidden>🏐 </span>WakiBet Volleyball Scoring
          </h1>
          <Link className="dash-ghost-btn" to="/volleyball">
            Back to Volleyball
          </Link>
        </div>
        <div className="static-page-body">
          <div className="scoring-board">
            <section className="scoring-block">
              <h3 className="scoring-block-title">Core scoring</h3>
              <div className="scoring-rows">
                <div className="scoring-row"><span className="scoring-label">Kill</span><span className="scoring-pts">+3</span></div>
                <div className="scoring-row"><span className="scoring-label">Assist</span><span className="scoring-pts">+1</span></div>
                <div className="scoring-row"><span className="scoring-label">Dig</span><span className="scoring-pts">+1</span></div>
                <div className="scoring-row"><span className="scoring-label">Block (solo)</span><span className="scoring-pts">+4</span></div>
                <div className="scoring-row"><span className="scoring-label">Block (assist)</span><span className="scoring-pts">+2</span></div>
                <div className="scoring-row"><span className="scoring-label">Ace</span><span className="scoring-pts">+5</span></div>
              </div>
            </section>
            <section className="scoring-block">
              <h3 className="scoring-block-title">Penalties</h3>
              <div className="scoring-rows">
                <div className="scoring-row"><span className="scoring-label">Service error</span><span className="scoring-pts">-2</span></div>
                <div className="scoring-row"><span className="scoring-label">Attack error</span><span className="scoring-pts">-2</span></div>
                <div className="scoring-row"><span className="scoring-label">Reception error</span><span className="scoring-pts">-2</span></div>
              </div>
            </section>
            <section className="scoring-block">
              <h3 className="scoring-block-title">Bonuses</h3>
              <div className="scoring-rows">
                <div className="scoring-row"><span className="scoring-label">Double-double (10+ in 2 stats)</span><span className="scoring-pts">+5</span></div>
                <div className="scoring-row"><span className="scoring-label">Triple-double</span><span className="scoring-pts">+10</span></div>
                <div className="scoring-row"><span className="scoring-label">Match win</span><span className="scoring-pts">+5</span></div>
                <div className="scoring-row"><span className="scoring-label">Straight sets win</span><span className="scoring-pts">+3</span></div>
                <div className="scoring-row"><span className="scoring-label">Captain multiplier</span><span className="scoring-pts">1.5x</span></div>
              </div>
            </section>
            <section className="scoring-block">
              <h3 className="scoring-block-title">Lineup rules</h3>
              <div className="scoring-rows">
                <div className="scoring-row"><span className="scoring-label">Roster size</span><span className="scoring-pts">5 players</span></div>
                <div className="scoring-row"><span className="scoring-label">Structure</span><span className="scoring-pts">1 captain + 4 flex</span></div>
                <div className="scoring-row"><span className="scoring-label">Salary cap</span><span className="scoring-pts">100 Waki Cash</span></div>
                <div className="scoring-row"><span className="scoring-label">Duplicates</span><span className="scoring-pts">Not allowed</span></div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
