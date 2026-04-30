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

type SlotKey = "winner" | "spread" | "total" | "wild";

type SlotDef = {
  key: SlotKey;
  title: string;
  subtitle: string;
  lineId: string;
  optionA: string;
  optionB: string;
  oddsA: number;
  oddsB: number;
};

export default function LacrosseHubPage({ user }: { user: SessionUser | null }) {
  const [stakes, setStakes] = useState<Record<SlotKey, number>>({
    winner: 30,
    spread: 40,
    total: 20,
    wild: 10,
  });
  const [sides, setSides] = useState<Record<SlotKey, "A" | "B">>({
    winner: "A",
    spread: "A",
    total: "A",
    wild: "A",
  });
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

  const lines = slateQ.data?.lines ?? [];
  const l1 = lines[0];
  const l2 = lines[1] ?? l1;
  const l3 = lines[2] ?? l1;
  const slots: SlotDef[] =
    l1 && l2 && l3
      ? [
          {
            key: "winner",
            title: "Winner Pick",
            subtitle: `${l1.team_a} vs ${l1.team_b}`,
            lineId: l1.line_id,
            optionA: l1.team_a,
            optionB: l1.team_b,
            oddsA: l1.odds_a,
            oddsB: l1.odds_b,
          },
          {
            key: "spread",
            title: "Spread Pick",
            subtitle: `${l2.team_a} vs ${l2.team_b}`,
            lineId: l2.line_id,
            optionA: `${l2.team_a} ${l2.spread_a > 0 ? `-${l2.spread_a}` : `+${Math.abs(l2.spread_a)}`}`,
            optionB: `${l2.team_b} ${l2.spread_a > 0 ? `+${l2.spread_a}` : `-${Math.abs(l2.spread_a)}`}`,
            oddsA: l2.odds_a,
            oddsB: l2.odds_b,
          },
          {
            key: "total",
            title: "Total Pick",
            subtitle: `${l3.team_a} vs ${l3.team_b} · O/U 22.5`,
            lineId: l3.line_id,
            optionA: "Over 22.5",
            optionB: "Under 22.5",
            oddsA: l3.odds_a,
            oddsB: l3.odds_b,
          },
          {
            key: "wild",
            title: "Wild Card Pick",
            subtitle: `${l1.team_a} vs ${l1.team_b}`,
            lineId: l1.line_id,
            optionA: `${l1.team_a} by 3+`,
            optionB: `${l1.team_b} upset`,
            oddsA: l1.odds_a,
            oddsB: l1.odds_b,
          },
        ]
      : [];

  useEffect(() => {
    const picks = lineupQ.data?.picks ?? [];
    if (picks.length === 0 || slots.length === 0) return;
    const nextSides = { ...sides };
    const nextStakes = { ...stakes };
    for (const slot of slots) {
      const p = picks.find((x) => x.line_id === slot.lineId);
      if (!p) continue;
      nextSides[slot.key] = p.side === "B" ? "B" : "A";
      nextStakes[slot.key] = p.stake;
    }
    setSides(nextSides);
    setStakes(nextStakes);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lineupQ.data, slots.length]);

  const totalStake = Object.values(stakes).reduce((s, n) => s + n, 0);

  async function saveLineup(): Promise<void> {
    if (!slateQ.data || slots.length === 0) return;
    setSaving(true);
    setSaveMsg(null);
    setSaveErr(null);
    try {
      await apiPut("/api/v1/lacrosse/lineup", {
        slate_key: slateQ.data.slate_key,
        picks: slots.map((slot) => ({
          line_id: slot.lineId,
          side: sides[slot.key] ?? "A",
          stake: Math.max(0, Math.min(40, stakes[slot.key] ?? 0)),
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
          {slateQ.data ? (
            <p className="dash-section-lead" style={{ marginTop: 6, marginBottom: 8 }}>
              Featured slate: <strong>{slateQ.data.name}</strong>
              <span style={{ opacity: 0.85 }}> · PLL {slateQ.data.season_year}</span>
            </p>
          ) : null}
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
        <h2 className="dash-section-title">Build / Edit Lacrosse Picks</h2>
        <p className="dash-section-lead">Set your 4-slot lineup: Winner, Spread, Total, and Wild Card. Allocate exactly 100 WakiCash.</p>
        {slots.length === 0 ? (
          <p className="dash-empty">Need team ratings to build featured matchups.</p>
        ) : (
          <div className="scoring-board">
            {slots.map((slot) => {
              const stake = stakes[slot.key] ?? 0;
              const maxStake = 40;
              const clamped = Math.min(maxStake, Math.max(0, stake));
              const side = sides[slot.key] ?? "A";
              const odds = side === "A" ? slot.oddsA : slot.oddsB;
              const implied = odds < 0 ? 1 + 100 / Math.abs(odds) : 1 + Math.abs(odds) / 100;
              const returnIfWin = clamped * implied;
              return (
                <section className="scoring-block" key={slot.key}>
                  <h3 className="scoring-block-title">{slot.title}</h3>
                  <p className="dash-sub" style={{ marginTop: 0, marginBottom: 8 }}>{slot.subtitle}</p>
                  <div className="scoring-rows">
                    <div className="scoring-row">
                      <span className="scoring-label">{slot.optionA} odds</span>
                      <span className="scoring-pts">{fmtOdds(slot.oddsA)}</span>
                    </div>
                    <div className="scoring-row">
                      <span className="scoring-label">{slot.optionB} odds</span>
                      <span className="scoring-pts">{fmtOdds(slot.oddsB)}</span>
                    </div>
                    <div className="scoring-row">
                      <span className="scoring-label">Pick team</span>
                      <span className="scoring-pts" style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
                        <button
                          type="button"
                          className={side === "A" ? "dash-main-btn" : "dash-ghost-btn"}
                          style={{ minHeight: 30, padding: "4px 10px", fontSize: 12 }}
                          onClick={() => {
                            const next = { ...sides };
                            next[slot.key] = "A";
                            setSides(next);
                          }}
                        >
                          {slot.optionA}
                        </button>
                        <button
                          type="button"
                          className={side === "B" ? "dash-main-btn" : "dash-ghost-btn"}
                          style={{ minHeight: 30, padding: "4px 10px", fontSize: 12 }}
                          onClick={() => {
                            const next = { ...sides };
                            next[slot.key] = "B";
                            setSides(next);
                          }}
                        >
                          {slot.optionB}
                        </button>
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
                            const next = { ...stakes };
                            next[slot.key] = Number(e.target.value) || 0;
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
