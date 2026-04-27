import { Link } from "react-router-dom";
import { NASCAR_SCORING_BLOCKS } from "../../sports/nascar/lib/nascarScoringRules";

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

/** Dashboard-only: point tables + link to full NASCAR scoring page (no long copy). */
export default function DashboardNascarPointsTeaser() {
  return (
    <section className="dash-section dash-section--nascar-scoring" aria-labelledby="dash-nascar-points-title">
      <h2 id="dash-nascar-points-title" className="dash-section-title">
        NASCAR points (summary)
      </h2>
      <p className="dash-section-lead dash-section-lead--compact">
        Full example + lineup rules:{" "}
        <Link to="/nascar/scoring">
          <strong>NASCAR scoring table</strong>
        </Link>
        . Pickleball: <Link to="/scoring-table">WakiPoints table</Link>.
      </p>
      <div className="scoring-board scoring-board--dash scoring-board--dash-compact">
        {NASCAR_SCORING_BLOCKS.map((b) => (
          <ScoringBlock key={b.title} title={b.title} rows={b.rows} footnote={b.footnote} />
        ))}
      </div>
    </section>
  );
}
