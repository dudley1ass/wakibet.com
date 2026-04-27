import { useQuery } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import { apiGet } from "../../../api";
import { NASCAR_LINEUP_MAX_ELITE, NASCAR_LINEUP_WAKICASH_BUDGET } from "../lib/nascarLineupRules";

type DriversPayload = {
  budget_wakicash: number;
  max_elite_drivers: number;
  drivers: {
    driver_key: string;
    display_name: string;
    team_name: string | null;
    car_number: string | null;
    waki_cash_price: number;
    is_elite: boolean;
  }[];
};

export default function NascarHubPage() {
  const [params] = useSearchParams();
  const weekKey = params.get("week_key");

  const driversQ = useQuery<DriversPayload>({
    queryKey: ["nascar", "drivers", "catalog"] as const,
    queryFn: () => apiGet<DriversPayload>("/api/v1/nascar/drivers"),
  });

  return (
    <div className="dash-shell">
      <div className="dash-head">
        <div>
          <h1>
            NASCAR <span className="brand-jp">WakiBet</span>
          </h1>
          <p>
            Pick <strong>5 drivers</strong> under <strong>{NASCAR_LINEUP_WAKICASH_BUDGET} WakiCash</strong>, max{" "}
            <strong>{NASCAR_LINEUP_MAX_ELITE} elite</strong>, exactly one captain. Salaries below update when you load
            the driver list.
          </p>
        </div>
        <div className="dash-head-actions">
          <Link className="dash-ghost-btn" to="/nascar/scoring">
            Scoring table
          </Link>
          <Link className="dash-ghost-btn" to="/">
            Dashboard
          </Link>
        </div>
      </div>

      {weekKey ? (
        <p className="dash-section-lead" style={{ marginTop: 0 }}>
          Week: <strong>{weekKey}</strong> — lineup builder UI next.
        </p>
      ) : null}

      <section className="dash-section" aria-labelledby="nascar-drivers-title">
        <h2 id="nascar-drivers-title" className="dash-section-title">
          Driver pool (WakiCash)
        </h2>
        <p className="dash-section-lead">
          Prices start at <strong>0</strong> until your roster file is imported. API:{" "}
          <code className="dash-code">GET /api/v1/nascar/drivers</code>
        </p>
        {driversQ.isLoading ? (
          <p className="dash-empty">Loading drivers…</p>
        ) : driversQ.isError ? (
          <p className="dash-error">Could not load drivers.</p>
        ) : (driversQ.data?.drivers.length ?? 0) === 0 ? (
          <p className="dash-empty">No active drivers yet — add rows in admin, then refresh.</p>
        ) : (
          <div className="nascar-driver-table-wrap">
            <table className="nascar-driver-table">
              <thead>
                <tr>
                  <th scope="col">Driver</th>
                  <th scope="col">Team</th>
                  <th scope="col">#</th>
                  <th scope="col">WakiCash</th>
                  <th scope="col">Elite</th>
                </tr>
              </thead>
              <tbody>
                {(driversQ.data?.drivers ?? []).map((d) => (
                  <tr key={d.driver_key}>
                    <td>{d.display_name}</td>
                    <td>{d.team_name ?? "—"}</td>
                    <td>{d.car_number ?? "—"}</td>
                    <td>{d.waki_cash_price}</td>
                    <td>{d.is_elite ? "Yes" : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="dash-section">
        <h2 className="dash-section-title">Coming soon</h2>
        <p className="dash-section-lead">
          Click-to-pick lineup UI, week locks, and live scoring will consume the same salaries and rules as the API.
        </p>
      </section>
    </div>
  );
}
