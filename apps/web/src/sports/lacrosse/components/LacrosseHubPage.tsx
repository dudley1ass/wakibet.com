import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { apiGet, apiPut } from "../../../api";
import type { SessionUser } from "../../../App";

function fmtOdds(v: number): string {
  return v > 0 ? `+${v}` : String(v);
}

type CurrentSlatePayload = {
  slate_key: string;
  name: string;
  season_year: number;
  lock_at: string;
  lines: Array<{
    line_id: string;
    line_key: string;
    team_a: string;
    team_b: string;
    spread_a: number;
    odds_a: number;
    odds_b: number;
    confidence: number;
  }>;
};

type SavedLineupPayload = {
  slate_key: string;
  spent_wakicash: number;
  est_return: number;
  picks: Array<{ line_id: string; side: string; stake: number; odds_at_save: number; est_return: number }>;
};

export default function LacrosseHubPage({ user }: { user: SessionUser | null }) {
  const [stakes, setStakes] = useState<number[]>([40, 30, 30]);
  const [sides, setSides] = useState<Array<"A" | "B">>(["A", "A", "A"]);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [saveErr, setSaveErr] = useState<string | null>(null);

  const slateQ = useQuery({
    queryKey: ["lacrosse", "current"] as const,
    queryFn: () => apiGet<CurrentSlatePayload>("/api/v1/lacrosse/current"),
  });

  const lineupQ = useQuery({
    queryKey: ["lacrosse", "lineup", slateQ.data?.slate_key ?? ""] as const,
    queryFn: () =>
      apiGet<SavedLineupPayload>(`/api/v1/lacrosse/lineup?slate_key=${encodeURIComponent(slateQ.data!.slate_key)}`),
    enabled: Boolean(user && slateQ.data?.slate_key),
  });

  useEffect(() => {
    const picks = lineupQ.data?.picks ?? [];
    if (picks.length === 0 || !slateQ.data) return;
    const byLine = new Map(picks.map((p) => [p.line_id, p]));
    const nextStakes = [...stakes];
    const nextSides = [...sides];
    slateQ.data.lines.forEach((line, i) => {
      const p = byLine.get(line.line_id);
      if (!p) return;
      nextStakes[i] = p.stake;
      nextSides[i] = p.side === "B" ? "B" : "A";
    });
    setStakes(nextStakes);
    setSides(nextSides);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lineupQ.data, slateQ.data]);

  const lines = slateQ.data?.lines ?? [];
  const totalStake = stakes.reduce((s, n) => s + n, 0);

  async function saveLineup(): Promise<void> {
    if (!slateQ.data) return;
    setSaving(true);
    setSaveMsg(null);
    setSaveErr(null);
    try {
      await apiPut("/api/v1/lacrosse/lineup", {
        slate_key: slateQ.data.slate_key,
        picks: slateQ.data.lines.map((line, i) => ({
          line_id: line.line_id,
          side: sides[i] ?? "A",
          stake: Math.max(0, Math.min(40, stakes[i] ?? 0)),
        })),
      });
      setSaveMsg("Lacrosse lineup saved.");
      await lineupQ.refetch();
    } catch (e) {
      setSaveErr(e instanceof Error ? e.message : "Could not save lineup.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="dash-shell">
      <div className="dash-head">
        <div>
          <h1>
            Lacrosse <span className="brand-jp">WakiBet</span>
          </h1>
          <p>
            Allocate <strong>100 WakiCash</strong> across lines by confidence. Max per pick is <strong>40</strong>.
          </p>
        </div>
        <div className="dash-head-actions">
          {user ? (
            <Link className="dash-ghost-btn" to="/lacrosse/rosters">
              My lacrosse rosters
            </Link>
          ) : null}
          <Link className="dash-ghost-btn" to="/lacrosse/scoring">
            Scoring table
          </Link>
          <Link className="dash-ghost-btn" to="/">
            Dashboard
          </Link>
        </div>
      </div>

      <section className="dash-section">
        <h2 className="dash-section-title">Wakibet Lacrosse Ratings</h2>
        <p className="dash-section-lead">
          Formula: R = 0.30O + 0.25D + 0.15G + 0.10F + 0.10P + 0.05S + 0.05H
        </p>
        {slateQ.isPending ? (
          <p className="dash-empty">Loading lacrosse slate…</p>
        ) : slateQ.isError ? (
          <p className="dash-error">{slateQ.error instanceof Error ? slateQ.error.message : "Could not load data."}</p>
        ) : (
          <div className="nascar-driver-table-wrap">
            <table className="nascar-driver-table">
              <thead>
                <tr>
                  <th>Match</th>
                  <th>Spread</th>
                  <th>Odds A</th>
                  <th>Odds B</th>
                  <th>Confidence</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((line) => (
                  <tr key={line.line_id}>
                    <td>
                      {line.team_a} vs {line.team_b}
                    </td>
                    <td>
                      {line.team_a} {line.spread_a > 0 ? `-${line.spread_a}` : `+${Math.abs(line.spread_a)}`}
                    </td>
                    <td>{fmtOdds(line.odds_a)}</td>
                    <td>{fmtOdds(line.odds_b)}</td>
                    <td>{line.confidence}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="dash-section">
        <h2 className="dash-section-title">WakiCash Allocation (100-point slate)</h2>
        <p className="dash-section-lead">Confidence allocation model with true odds-based return estimate.</p>
        {lines.length === 0 ? (
          <p className="dash-empty">Need team ratings to build featured matchups.</p>
        ) : (
          <div className="scoring-board">
            {lines.map((m, i) => {
              const stake = stakes[i] ?? 0;
              const maxStake = 40;
              const clamped = Math.min(maxStake, Math.max(0, stake));
              const side = sides[i] ?? "A";
              const odds = side === "A" ? m.odds_a : m.odds_b;
              const implied = odds < 0 ? 1 + 100 / Math.abs(odds) : 1 + Math.abs(odds) / 100;
              const returnIfWin = clamped * implied;
              return (
                <section className="scoring-block" key={m.line_id}>
                  <h3 className="scoring-block-title">
                    {m.team_a} vs {m.team_b}
                  </h3>
                  <div className="scoring-rows">
                    <div className="scoring-row">
                      <span className="scoring-label">{m.team_a} odds</span>
                      <span className="scoring-pts">{fmtOdds(m.odds_a)}</span>
                    </div>
                    <div className="scoring-row">
                      <span className="scoring-label">{m.team_b} odds</span>
                      <span className="scoring-pts">{fmtOdds(m.odds_b)}</span>
                    </div>
                    <div className="scoring-row">
                      <span className="scoring-label">Line (spread)</span>
                      <span className="scoring-pts">
                        {m.team_a} {m.spread_a > 0 ? `-${m.spread_a}` : `+${Math.abs(m.spread_a)}`}
                      </span>
                    </div>
                    <div className="scoring-row">
                      <span className="scoring-label">Pick side</span>
                      <span className="scoring-pts">
                        <select
                          value={side}
                          onChange={(e) => {
                            const next = [...sides];
                            next[i] = e.target.value === "B" ? "B" : "A";
                            setSides(next);
                          }}
                        >
                          <option value="A">{m.team_a}</option>
                          <option value="B">{m.team_b}</option>
                        </select>
                      </span>
                    </div>
                    <div className="scoring-row">
                      <span className="scoring-label">Your WakiCash stake (max 40)</span>
                      <span className="scoring-pts">
                        <input
                          type="number"
                          min={0}
                          max={40}
                          value={clamped}
                          onChange={(e) => {
                            const next = [...stakes];
                            next[i] = Number(e.target.value) || 0;
                            setStakes(next);
                          }}
                          style={{ width: 68 }}
                        />
                      </span>
                    </div>
                    <div className="scoring-row">
                      <span className="scoring-label">Return if pick wins</span>
                      <span className="scoring-pts">{returnIfWin.toFixed(1)}</span>
                    </div>
                  </div>
                </section>
              );
            })}
          </div>
        )}
        <p className="scoring-foot">Allocated: {totalStake}/100 WakiCash</p>
        {user ? (
          <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 10 }}>
            <button type="button" className="dash-main-btn" disabled={saving || totalStake > 100} onClick={() => void saveLineup()}>
              {saving ? "Saving..." : "Save lineup"}
            </button>
            {saveMsg ? <span style={{ color: "#86efac", fontSize: 12 }}>{saveMsg}</span> : null}
            {saveErr ? <span style={{ color: "#fca5a5", fontSize: 12 }}>{saveErr}</span> : null}
          </div>
        ) : (
          <p className="scoring-foot">Sign in to save your lacrosse lineup.</p>
        )}
      </section>
    </div>
  );
}
