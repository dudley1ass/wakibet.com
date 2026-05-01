import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { apiGet, apiPut } from "../../../api";
import type { SessionUser } from "../../../App";
import { parsePllCsv } from "../lib/lacrossePower";

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
  picks: Array<{ slot: SlotKey; line_id: string; side: string; stake: number; odds_at_save: number; est_return: number }>;
  stack: { winner_line_id: string; side: "A" | "B"; players: string[] } | null;
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
  const [stackPlayers, setStackPlayers] = useState<string[]>([]);
  const [slotLineIds, setSlotLineIds] = useState<Record<SlotKey, string>>({
    winner: "",
    spread: "",
    total: "",
    wild: "",
  });

  const slateQ = useQuery({
    queryKey: ["lacrosse", "current"] as const,
    queryFn: () => apiGet<CurrentSlatePayload>("/api/v1/lacrosse/current"),
    retry: 3,
    retryDelay: (attempt) => Math.min(1200 * 2 ** attempt, 10_000),
  });

  const lineupQ = useQuery({
    queryKey: ["lacrosse", "lineup", slateQ.data?.slate_key ?? ""] as const,
    queryFn: () =>
      apiGet<SavedLineupPayload>(`/api/v1/lacrosse/lineup?slate_key=${encodeURIComponent(slateQ.data!.slate_key)}`),
    enabled: Boolean(user && slateQ.data?.slate_key),
  });

  const csvQ = useQuery({
    queryKey: ["lacrosse", "pll-csv"] as const,
    queryFn: async () => {
      const r = await fetch("/data/pll-player-stats.csv");
      if (!r.ok) throw new Error("Could not load PLL player data.");
      return r.text();
    },
    staleTime: 60 * 60 * 1000,
  });
  const csvRows = useMemo(() => (csvQ.data ? parsePllCsv(csvQ.data) : []), [csvQ.data]);

  const lines = slateQ.data?.lines ?? [];
  useEffect(() => {
    if (lines.length < 4) return;
    const defaults = lines.slice(0, 4).map((x) => x.line_id);
    setSlotLineIds((prev) =>
      prev.winner && prev.spread && prev.total && prev.wild
        ? prev
        : { winner: defaults[0]!, spread: defaults[1]!, total: defaults[2]!, wild: defaults[3]! },
    );
  }, [lines]);

  const linesById = useMemo(() => new Map(lines.map((l) => [l.line_id, l])), [lines]);
  const winnerLine = linesById.get(slotLineIds.winner);
  const spreadLine = linesById.get(slotLineIds.spread);
  const totalLine = linesById.get(slotLineIds.total);
  const wildLine = linesById.get(slotLineIds.wild);
  const slots: SlotDef[] =
    winnerLine && spreadLine && totalLine && wildLine
      ? [
          {
            key: "winner",
            title: "Winner Pick",
            subtitle: `${winnerLine.team_a} vs ${winnerLine.team_b}`,
            lineId: winnerLine.line_id,
            optionA: winnerLine.team_a,
            optionB: winnerLine.team_b,
            oddsA: winnerLine.odds_a,
            oddsB: winnerLine.odds_b,
          },
          {
            key: "spread",
            title: "Spread Pick",
            subtitle: `${spreadLine.team_a} vs ${spreadLine.team_b}`,
            lineId: spreadLine.line_id,
            optionA: `${spreadLine.team_a} ${spreadLine.spread_a > 0 ? `-${spreadLine.spread_a}` : `+${Math.abs(spreadLine.spread_a)}`}`,
            optionB: `${spreadLine.team_b} ${spreadLine.spread_a > 0 ? `+${spreadLine.spread_a}` : `-${Math.abs(spreadLine.spread_a)}`}`,
            oddsA: spreadLine.odds_a,
            oddsB: spreadLine.odds_b,
          },
          {
            key: "total",
            title: "Total Pick",
            subtitle: `${totalLine.team_a} vs ${totalLine.team_b} · O/U 22.5`,
            lineId: totalLine.line_id,
            optionA: "Over 22.5",
            optionB: "Under 22.5",
            oddsA: totalLine.odds_a,
            oddsB: totalLine.odds_b,
          },
          {
            key: "wild",
            title: "Wild Card Pick",
            subtitle: `${wildLine.team_a} vs ${wildLine.team_b}`,
            lineId: wildLine.line_id,
            optionA: `${wildLine.team_a} by 3+`,
            optionB: `${wildLine.team_b} upset`,
            oddsA: wildLine.odds_a,
            oddsB: wildLine.odds_b,
          },
        ]
      : [];

  useEffect(() => {
    if (lineupQ.data === undefined || slots.length === 0) return;
    const picks = lineupQ.data.picks ?? [];
    if (picks.length > 0) {
      const nextSides = { ...sides };
      const nextStakes = { ...stakes };
      for (const slot of slots) {
        const p = picks.find((x) => x.slot === slot.key);
        if (!p) continue;
        nextSides[slot.key] = p.side === "B" ? "B" : "A";
        nextStakes[slot.key] = p.stake;
      }
      setSides(nextSides);
      setStakes(nextStakes);
      const nextLineIds = { ...slotLineIds };
      for (const p of picks) {
        nextLineIds[p.slot] = p.line_id;
      }
      setSlotLineIds(nextLineIds);
      const st = lineupQ.data.stack;
      const wLine = nextLineIds.winner;
      if (st && wLine && st.winner_line_id === wLine && st.players.length === 3) {
        setStackPlayers(st.players);
      } else {
        setStackPlayers([]);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lineupQ.data, slots.length]);

  const winnerTeam = winnerLine ? (sides.winner === "A" ? winnerLine.team_a : winnerLine.team_b) : "";
  const rosterForWinner = useMemo(() => {
    if (!winnerTeam || !csvRows.length) return [];
    return csvRows
      .filter((r) => r.team === winnerTeam && r.gamesPlayed > 0)
      .map((r) => {
        const name = `${r.firstName} ${r.lastName}`.trim();
        return { name, ppg: r.points / Math.max(1, r.gamesPlayed) };
      })
      .sort((a, b) => b.ppg - a.ppg);
  }, [csvRows, winnerTeam]);

  const totalStake = Object.values(stakes).reduce((s, n) => s + n, 0);

  async function saveLineup(): Promise<void> {
    if (!slateQ.data || slots.length === 0) return;
    setSaving(true);
    setSaveMsg(null);
    setSaveErr(null);
    try {
      if (!winnerLine || stackPlayers.length !== 3) {
        setSaveErr("Pick exactly 3 players from your winner team for the stack.");
        return;
      }
      await apiPut("/api/v1/lacrosse/lineup", {
        slate_key: slateQ.data.slate_key,
        picks: slots.map((slot) => ({
          slot: slot.key,
          line_id: slot.lineId,
          side: sides[slot.key] ?? "A",
          stake: Math.max(0, Math.min(40, stakes[slot.key] ?? 0)),
        })),
        stack: {
          winner_line_id: winnerLine.line_id,
          side: sides.winner,
          players: stackPlayers,
        },
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
        <p className="dash-section-lead">
          Set your 4-slot lineup: Winner, Spread, Total, and Wild Card. Allocate exactly 100 WakiCash. Then stack{" "}
          <strong>three players</strong> from the team you picked in the Winner slot.
        </p>
        <div className="dash-card" style={{ marginTop: 10, marginBottom: 12, padding: "10px 12px" }}>
          <p style={{ margin: 0, fontWeight: 800, color: "#fef3c7" }}>Make Your Picks</p>
          <p style={{ margin: "6px 0 0", fontSize: 13, color: "#e5e7eb" }}>Choose one option in each category:</p>
          <ul style={{ margin: "8px 0 0", paddingLeft: 18, color: "#e5e7eb", fontSize: 13, lineHeight: 1.5 }}>
            <li>🟢 Winner - Who wins the game</li>
            <li>🟡 Spread - Who covers the point spread</li>
            <li>🔵 Total - Over or Under total goals</li>
            <li>🔥 Wild Card - Bonus prediction (bigger payoff)</li>
          </ul>
        </div>
        {winnerLine && slots.length > 0 ? (
          <div className="dash-card" style={{ marginBottom: 14, padding: "12px 14px" }}>
            <p style={{ margin: 0, fontWeight: 800, color: "#fef3c7" }}>Winner stack — pick 3 players</p>
            <p style={{ margin: "8px 0 0", fontSize: 13, color: "#e5e7eb" }}>
              These players must be on <strong>{winnerTeam}</strong> (your current winner pick for {winnerLine.team_a} vs{" "}
              {winnerLine.team_b}). Saving requires exactly three.
            </p>
            {csvQ.isPending ? (
              <p className="dash-empty" style={{ marginTop: 10, marginBottom: 0 }}>
                Loading player list…
              </p>
            ) : csvQ.isError ? (
              <p className="dash-error" style={{ marginTop: 10, marginBottom: 0 }}>
                {csvQ.error instanceof Error ? csvQ.error.message : "Could not load players."}
              </p>
            ) : rosterForWinner.length === 0 ? (
              <p className="dash-empty" style={{ marginTop: 10, marginBottom: 0 }}>
                No PLL stats rows matched this team name. Check that the slate teams align with the CSV &quot;Team&quot; column.
              </p>
            ) : (
              <>
                <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                  <button
                    type="button"
                    className="dash-ghost-btn"
                    style={{ minHeight: 30, padding: "4px 10px", fontSize: 12 }}
                    onClick={() => {
                      const top = rosterForWinner.slice(0, 3).map((r) => r.name);
                      if (top.length === 3) setStackPlayers(top);
                    }}
                    disabled={rosterForWinner.length < 3}
                  >
                    Quick pick top 3 (by PPG)
                  </button>
                  <span style={{ fontSize: 12, color: "#9ca3af" }}>
                    Selected: {stackPlayers.length}/3
                    {stackPlayers.length > 0 ? ` — ${stackPlayers.join(", ")}` : ""}
                  </span>
                </div>
                <ul style={{ margin: "12px 0 0", padding: 0, listStyle: "none", maxHeight: 280, overflowY: "auto" }}>
                  {rosterForWinner.slice(0, 40).map((row) => {
                    const on = stackPlayers.includes(row.name);
                    const disabledToggle = !on && stackPlayers.length >= 3;
                    return (
                      <li
                        key={row.name}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          padding: "6px 0",
                          borderBottom: "1px solid rgba(255,255,255,0.06)",
                          fontSize: 13,
                          color: "#e5e7eb",
                        }}
                      >
                        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: disabledToggle ? "not-allowed" : "pointer", flex: 1 }}>
                          <input
                            type="checkbox"
                            checked={on}
                            disabled={disabledToggle}
                            onChange={() => {
                              setStackPlayers((prev) => {
                                if (prev.includes(row.name)) return prev.filter((x) => x !== row.name);
                                if (prev.length >= 3) return prev;
                                return [...prev, row.name];
                              });
                            }}
                          />
                          <span>{row.name}</span>
                          <span style={{ marginLeft: "auto", opacity: 0.75 }}>{row.ppg.toFixed(2)} PPG</span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
          </div>
        ) : null}
        {slots.length === 0 ? (
          <p className="dash-empty">Need at least 4 featured matchups to build this lineup format.</p>
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
                      <span className="scoring-label">Match</span>
                      <span className="scoring-pts">
                        <select
                          value={slot.lineId}
                          onChange={(e) => {
                            const nextId = e.target.value;
                            const usedByOther = Object.entries(slotLineIds).some(
                              ([k, v]) => k !== slot.key && v === nextId,
                            );
                            if (usedByOther) {
                              setSaveErr("Each slot must use a different matchup.");
                              return;
                            }
                            setSaveErr(null);
                            setSlotLineIds((prev) => ({ ...prev, [slot.key]: nextId }));
                            if (slot.key === "winner") setStackPlayers([]);
                          }}
                        >
                          {lines.map((line) => {
                            const blocked = Object.entries(slotLineIds).some(
                              ([k, v]) => k !== slot.key && v === line.line_id,
                            );
                            return (
                              <option key={line.line_id} value={line.line_id} disabled={blocked}>
                                {line.team_a} vs {line.team_b}
                              </option>
                            );
                          })}
                        </select>
                      </span>
                    </div>
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
                            const prev = sides[slot.key];
                            const next = { ...sides };
                            next[slot.key] = "A";
                            if (slot.key === "winner" && prev !== "A") setStackPlayers([]);
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
                            const prev = sides[slot.key];
                            const next = { ...sides };
                            next[slot.key] = "B";
                            if (slot.key === "winner" && prev !== "B") setStackPlayers([]);
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
            <button
              type="button"
              className="dash-main-btn"
              disabled={saving || totalStake !== 100 || stackPlayers.length !== 3 || !csvQ.isSuccess}
              onClick={() => void saveLineup()}
            >
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
