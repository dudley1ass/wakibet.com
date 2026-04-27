import { Link } from "react-router-dom";
import {
  NASCAR_EXAMPLE_SCORE,
  NASCAR_LINEUP_RULES_ROWS,
  NASCAR_SCORING_BLOCKS,
  NASCAR_SCORING_VERSION,
} from "../lib/nascarScoringRules";

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

export default function NascarScoringTablePage() {
  const ex = NASCAR_EXAMPLE_SCORE;

  return (
    <div className="static-page-wrap">
      <div className="static-page-card">
        <div className="dash-head" style={{ marginBottom: 8 }}>
          <h1 style={{ margin: 0 }}>
            <span aria-hidden>🏁 </span>WakiBet NASCAR scoring
          </h1>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            <Link className="dash-ghost-btn" to="/">
              Home
            </Link>
            <Link className="dash-ghost-btn" to="/scoring-table">
              Pickleball table
            </Link>
            <Link className="dash-ghost-btn" to="/nascar">
              NASCAR hub
            </Link>
          </div>
        </div>

        <div className="static-page-body">
          <p className="scoring-lede">
            Weekly fantasy points stack <strong>finish position</strong>, <strong>position gained/lost</strong>,{" "}
            <strong>laps led</strong>, <strong>fastest lap</strong>, and <strong>DNF</strong>. One captain per lineup
            earns <strong>1.5×</strong> that driver&apos;s race total.
          </p>

          <div className="scoring-board">
            {NASCAR_SCORING_BLOCKS.map((b) => (
              <ScoringBlock key={b.title} title={b.title} rows={b.rows} footnote={b.footnote} />
            ))}
          </div>

          <div className="scoring-example" role="note">
            <div className="scoring-example-kicker">Example score (one driver)</div>
            <ul className="dash-nascar-example-list">
              {ex.narrative.map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
            <p className="scoring-example-body">
              <strong>Total:</strong> {ex.sumExpression} ={" "}
              <strong className="scoring-example-total">{ex.rawTotal}</strong> points
            </p>
            <p className="scoring-example-body">
              <strong>If captain:</strong> {ex.rawTotal} × 1.5 ={" "}
              <strong className="scoring-example-total">{ex.captainTotal}</strong> points
            </p>
          </div>

          <section className="scoring-block" style={{ marginTop: 18 }}>
            <h3 className="scoring-block-title">Lineup rules</h3>
            <div className="scoring-rows">
              {NASCAR_LINEUP_RULES_ROWS.map((row) => (
                <div key={row.label} className="scoring-row">
                  <span className="scoring-label">{row.label}</span>
                  <span className="scoring-pts">{row.pts}</span>
                </div>
              ))}
            </div>
          </section>

          <p className="scoring-foot">
            Rules version <strong>{NASCAR_SCORING_VERSION}</strong>. Driver <strong>WakiCash</strong> salaries are set
            in admin; lineups must stay within budget and the cap on drivers priced over 30 WakiCash.
          </p>
        </div>
      </div>
    </div>
  );
}
