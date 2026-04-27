import { Link, useSearchParams } from "react-router-dom";

export default function NascarHubPage() {
  const [params] = useSearchParams();
  const weekKey = params.get("week_key");

  return (
    <div className="dash-shell">
      <div className="dash-head">
        <div>
          <h1>
            NASCAR <span className="brand-jp">WakiBet</span>
          </h1>
          <p>Weekly picks module scaffolded. Driver pools, scoring, and leaderboard coming next.</p>
        </div>
        <div className="dash-head-actions">
          <Link className="dash-ghost-btn" to="/">
            Dashboard
          </Link>
        </div>
      </div>
      <section className="dash-section">
        <h2 className="dash-section-title">Coming soon</h2>
        <p className="dash-section-lead">
          This is the NASCAR namespace under WakiBet. Next step: week schedule ingestion + picks + scoring engine.
        </p>
        {weekKey ? (
          <p className="dash-section-lead" style={{ marginTop: 10 }}>
            Selected week: <strong>{weekKey}</strong> — lineup builder UI ships next.
          </p>
        ) : null}
      </section>
    </div>
  );
}
