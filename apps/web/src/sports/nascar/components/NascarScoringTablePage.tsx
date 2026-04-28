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
          <Link className="dash-ghost-btn" to="/">
            Back to Dashboard
          </Link>
        </div>

        <div className="static-page-body">
          <p className="scoring-lede">
            Weekly fantasy points come from finish position, positions gained or lost, laps led, fastest lap, and DNF.
            All of these add up to a driver&apos;s total score.
            <br />
            <br />
            You can also choose one Captain for your lineup-
            <br />
            that driver earns 1.5× their race points.
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
