import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import "../../../components/dashboard.css";

type ComponentScores = {
  win: number;
  opponent_strength: number;
  tournament_depth: number;
  point_differential: number;
  participation: number;
};

type RankedPlayer = {
  player_id: string;
  name: string;
  matches: number;
  wins: number;
  losses: number;
  win_pct: number;
  tournaments_played: number;
  point_differential: number;
  rating: number;
  components: ComponentScores;
};

type DivisionPayload = {
  division: string;
  total_tournaments: number;
  max_division_size: number;
  best_point_differential: number;
  tournaments: string[];
  players: RankedPlayer[];
};

type RankingsPayload = {
  generated_from: string;
  weights: { win: number; opp: number; depth: number; pd: number; participation: number };
  result_modifiers: { win: number; loss: number };
  iterations: number;
  divisions: Record<string, DivisionPayload>;
};

const DIVISION_ORDER: ReadonlyArray<string> = [
  "Men's Singles Pro",
  "Women's Singles Pro",
  "Men's Doubles Pro",
  "Women's Doubles Pro",
  "Mixed Doubles Pro",
];

function fmt(n: number, digits = 2): string {
  if (!Number.isFinite(n)) return "—";
  const f = Math.pow(10, digits);
  return (Math.round(n * f) / f).toFixed(digits);
}

function fmtSigned(n: number): string {
  if (!Number.isFinite(n)) return "—";
  return n > 0 ? `+${n}` : String(n);
}

export default function PickleballRankingsPage() {
  const q = useQuery({
    queryKey: ["pickleball-rankings", "v1"] as const,
    queryFn: async (): Promise<RankingsPayload> => {
      const res = await fetch("/data/pickleball-rankings.json", { cache: "no-store" });
      if (!res.ok) throw new Error(`Could not load rankings (${res.status}).`);
      return (await res.json()) as RankingsPayload;
    },
    staleTime: 5 * 60_000,
  });

  const divisions = q.data?.divisions ?? {};
  const availableDivisions = useMemo(
    () => DIVISION_ORDER.filter((d) => divisions[d] && divisions[d]!.players.length > 0),
    [divisions],
  );

  const [activeDivision, setActiveDivision] = useState<string>(() => availableDivisions[0] ?? DIVISION_ORDER[0]!);
  const effectiveDivision =
    availableDivisions.includes(activeDivision) ? activeDivision : availableDivisions[0] ?? DIVISION_ORDER[0]!;

  const currentPayload = divisions[effectiveDivision];

  return (
    <div className="pick-teams-shell">
      <header className="pick-teams-head">
        <div>
          <p className="season-lb-kicker">Pro player rankings · PPA Tour 2026</p>
          <h1 className="pick-teams-title">Pickleball rankings</h1>
          <p className="pick-teams-sub">
            Wakibet ratings built from real tournament results across {q.data?.divisions?.["Men's Singles Pro"]?.total_tournaments ?? 0}
            {" "}
            tournaments. Updates as more events are added.
          </p>
        </div>
        <div className="dash-head-actions">
          <Link className="dash-ghost-btn" to="/scoring-table">
            Scoring table
          </Link>
          <Link className="dash-ghost-btn" to="/pick-teams/leaderboard">
            Fantasy leaderboard
          </Link>
          <Link className="dash-ghost-btn" to="/">
            Dashboard
          </Link>
        </div>
      </header>

      {q.error && <p className="dash-error">{(q.error as Error).message}</p>}
      {q.isPending && (
        <p className="dash-loading" role="status">
          Loading rankings…
        </p>
      )}

      {q.data && availableDivisions.length === 0 && (
        <p className="dash-empty">No ranked divisions yet — add tournaments to the master dataset to populate rankings.</p>
      )}

      {q.data && availableDivisions.length > 0 && currentPayload && (
        <>
          <nav className="rost-actions" aria-label="Division" style={{ marginBottom: 12, flexWrap: "wrap" }}>
            {availableDivisions.map((d) => (
              <button
                key={d}
                type="button"
                className={d === effectiveDivision ? "dash-main-btn" : "dash-ghost-btn"}
                onClick={() => setActiveDivision(d)}
              >
                {d}
              </button>
            ))}
          </nav>

          <p className="season-lb-meta">
            Showing top {Math.min(100, currentPayload.players.length)} of {currentPayload.players.length} ranked
            {currentPayload.players.length === 1 ? " player" : " players"}
            {" · "}
            {currentPayload.total_tournaments} tournaments tracked
            {" · "}
            max division size {currentPayload.max_division_size}
            {" · "}
            best PD {fmtSigned(currentPayload.best_point_differential)}
          </p>

          <details className="dash-card" style={{ marginBottom: 12 }}>
            <summary style={{ cursor: "pointer", fontWeight: 600 }}>How the Wakibet rating is computed</summary>
            <div style={{ paddingTop: 8, lineHeight: 1.6 }}>
              <p style={{ marginTop: 0 }}>
                Each player gets one score out of 100, blended from five components:
              </p>
              <ul style={{ marginTop: 0 }}>
                <li>
                  <strong>Win rate (40%)</strong> — wins / matches.
                </li>
                <li>
                  <strong>Opponent strength (25%)</strong> — average rating of opponents faced, with a win modifier of 1.00 and
                  a loss modifier of 0.40. Converges iteratively across all players.
                </li>
                <li>
                  <strong>Tournament depth (15%)</strong> — average draw size of the player&rsquo;s tournaments, normalized to
                  the largest draw tracked in the division.
                </li>
                <li>
                  <strong>Point differential (10%)</strong> — total game points scored minus allowed, normalized to the leader.
                  Walkovers and incomplete matches are excluded.
                </li>
                <li>
                  <strong>Participation (10%)</strong> — distinct tournaments played, out of {currentPayload.total_tournaments}
                  {" "}
                  tracked.
                </li>
              </ul>
              <p>
                Tournaments included: <em>{currentPayload.tournaments.join(", ")}</em>.
              </p>
            </div>
          </details>

          <div className="season-lb-table-wrap">
            <table className="season-lb-table">
              <thead>
                <tr>
                  <th scope="col">Rank</th>
                  <th scope="col">Player</th>
                  <th scope="col" className="season-lb-th-score">
                    Rating
                  </th>
                  <th scope="col">W&ndash;L</th>
                  <th scope="col">Win %</th>
                  <th scope="col">Tournaments</th>
                  <th scope="col">PD</th>
                </tr>
              </thead>
              <tbody>
                {currentPayload.players.slice(0, 100).map((p, i) => (
                  <tr key={p.player_id}>
                    <td className="season-lb-rank">{i + 1}</td>
                    <td className="season-lb-name">{p.name}</td>
                    <td className="season-lb-score">{fmt(p.rating)}</td>
                    <td>
                      {p.wins}&ndash;{p.losses}
                    </td>
                    <td>{fmt(p.win_pct * 100, 1)}%</td>
                    <td>{p.tournaments_played}</td>
                    <td>{fmtSigned(p.point_differential)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
