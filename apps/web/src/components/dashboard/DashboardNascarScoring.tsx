import { Link } from "react-router-dom";
import {
  NASCAR_EXAMPLE_SCORE,
  NASCAR_LINEUP_RULES_ROWS,
  NASCAR_SCORING_BLOCKS,
  NASCAR_SCORING_VERSION,
  NASCAR_WHY_IT_WORKS,
} from "../../sports/nascar/lib/nascarScoringRules";

function ScoringBlock({
  title,
  rows,
  footnote,
}: {
  title: string;
  rows: { label: string; pts: string }[];
  footnote?: string;
}) {
  return (
    <section className="scoring-block">
      <h3 className="scoring-block-title">{title}</h3>
      <div className="scoring-rows">
        {rows.map((row) => (
          <div key={row.label} className="scoring-row">
            <span className="scoring-label">{row.label}</span>
            <span className="scoring-pts">{row.pts}</span>
          </div>
        ))}
      </div>
      {footnote ? <p className="dash-nascar-block-foot">{footnote}</p> : null}
    </section>
  );
}

export default function DashboardNascarScoring() {
  const ex = NASCAR_EXAMPLE_SCORE;

  return (
    <section className="dash-section dash-section--nascar-scoring" aria-labelledby="dash-nascar-scoring-title">
      <h2 id="dash-nascar-scoring-title" className="dash-section-title">
        <span aria-hidden>🏁 </span>WakiBet NASCAR scoring table
      </h2>
      <p className="dash-section-lead dash-section-lead--compact">
        Official pilot table for weekly NASCAR fantasy — ties break on decimals and movement. Pickleball uses the{" "}
        <Link to="/scoring-table">WakiPoints table</Link>. Lineups:{" "}
        <Link to="/nascar">NASCAR hub</Link>.
      </p>

      <div className="scoring-board scoring-board--dash">
        {NASCAR_SCORING_BLOCKS.map((b) => (
          <ScoringBlock key={b.title} title={b.title} rows={b.rows} footnote={b.footnote} />
        ))}
      </div>

      <div className="scoring-example dash-nascar-example" role="note">
        <div className="scoring-example-kicker">Example score (one driver)</div>
        <ul className="dash-nascar-example-list">
          {ex.narrative.map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ul>
        <p className="scoring-example-body dash-nascar-example-total">
          <strong>Total:</strong> {ex.sumExpression} ={" "}
          <strong className="scoring-example-total">{ex.rawTotal}</strong> points
        </p>
        <p className="scoring-example-body">
          <strong>If captain:</strong> {ex.rawTotal} × 1.5 ={" "}
          <strong className="scoring-example-total">{ex.captainTotal}</strong> points
        </p>
      </div>

      <div className="dash-nascar-why">
        <h3 className="scoring-block-title">Why this table works</h3>
        <ul className="dash-nascar-why-list">
          {NASCAR_WHY_IT_WORKS.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </div>

      <section className="scoring-block dash-nascar-lineup-block">
        <h3 className="scoring-block-title">Recommended lineup rules</h3>
        <div className="scoring-rows">
          {NASCAR_LINEUP_RULES_ROWS.map((row) => (
            <div key={row.label} className="scoring-row">
              <span className="scoring-label">{row.label}</span>
              <span className="scoring-pts">{row.pts}</span>
            </div>
          ))}
        </div>
      </section>

      <p className="scoring-foot scoring-foot--dash">
        NASCAR rules version <strong>{NASCAR_SCORING_VERSION}</strong>. Points post when official results are
        ingested; engine will match this table.
      </p>
    </section>
  );
}
