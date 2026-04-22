import { useCallback, useEffect, useState } from "react";
import { apiGet, apiPut } from "../api";
import "./dashboard.css";

const ROSTER_SIZE = 3;

type DivisionsResponse = {
  selected_tournament_key: string;
  available_tournaments: { tournament_key: string; label: string }[];
  tournament_name: string;
  scoring_version: number;
  roster_size: number;
  divisions: {
    division_key: string;
    event_type: string;
    skill_level: string;
    age_bracket: string;
    match_count: number;
    player_count: number;
  }[];
};

type PlayersResponse = { tournament_key: string; division_key: string; players: string[] };

type RosterResponse = {
  tournament_key: string;
  division_key: string;
  picks: { slot_index: number; player_name: string; is_captain: boolean }[];
};

type PutRosterResponse = RosterResponse;

type ScoreResponse = {
  tournament_key: string;
  division_key: string;
  roster_total: number;
  rules_version: number;
  players: {
    player_name: string;
    is_captain: boolean;
    fantasy_points: number;
    breakdown: { label: string; points: number }[];
  }[];
  note: string;
};

function emptyPicks(n: number): string[] {
  return Array.from({ length: n }, () => "");
}

type WinterFantasyProps = {
  onRosterSaved?: () => void | Promise<void>;
};

export default function WinterFantasySection({ onRosterSaved }: WinterFantasyProps) {
  const [meta, setMeta] = useState<DivisionsResponse | null>(null);
  const [metaErr, setMetaErr] = useState<string | null>(null);
  const [loadingMeta, setLoadingMeta] = useState(true);

  const [tournamentKey, setTournamentKey] = useState("winter_springs");
  const [divisionKey, setDivisionKey] = useState("");
  const [players, setPlayers] = useState<string[]>([]);
  const [picks, setPicks] = useState<string[]>(emptyPicks(ROSTER_SIZE));
  const [captainSlot, setCaptainSlot] = useState<number | null>(null);

  const [busy, setBusy] = useState(false);
  const [actionErr, setActionErr] = useState<string | null>(null);
  const [score, setScore] = useState<ScoreResponse | null>(null);

  const rosterSize = meta?.roster_size ?? ROSTER_SIZE;

  const loadDivisions = useCallback(async (nextTournamentKey: string) => {
    setMetaErr(null);
    setLoadingMeta(true);
    try {
      const d = await apiGet<DivisionsResponse>(
        `/api/v1/winter-fantasy/divisions?tournament_key=${encodeURIComponent(nextTournamentKey)}`,
      );
      setMeta(d);
      setPicks(emptyPicks(d.roster_size));
      setTournamentKey(d.selected_tournament_key);
    } catch (e) {
      setMetaErr(e instanceof Error ? e.message : "Could not load fantasy divisions.");
    } finally {
      setLoadingMeta(false);
    }
  }, []);

  useEffect(() => {
    void loadDivisions(tournamentKey);
  }, [loadDivisions]);

  async function loadDivisionDetail(key: string) {
    if (!key) {
      setPlayers([]);
      setPicks(emptyPicks(rosterSize));
      setCaptainSlot(null);
      setScore(null);
      return;
    }
    setActionErr(null);
    setScore(null);
    setBusy(true);
    try {
      const enc = encodeURIComponent(key);
      const t = encodeURIComponent(tournamentKey);
      const [pl, ro] = await Promise.all([
        apiGet<PlayersResponse>(`/api/v1/winter-fantasy/division-players?tournament_key=${t}&division_key=${enc}`),
        apiGet<RosterResponse>(`/api/v1/winter-fantasy/roster?tournament_key=${t}&division_key=${enc}`),
      ]);
      setPlayers(pl.players);
      const next = emptyPicks(rosterSize);
      let cap: number | null = null;
      for (const p of ro.picks) {
        if (p.slot_index >= 0 && p.slot_index < next.length) {
          next[p.slot_index] = p.player_name;
          if (p.is_captain) cap = p.slot_index;
        }
      }
      setPicks(next);
      setCaptainSlot(cap);
    } catch (e) {
      setActionErr(e instanceof Error ? e.message : "Failed to load division.");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (divisionKey) void loadDivisionDetail(divisionKey);
  }, [divisionKey, rosterSize, tournamentKey]);

  function setPickAt(slot: number, name: string) {
    setPicks((prev) => {
      const next = [...prev];
      next[slot] = name;
      return next;
    });
  }

  function toggleCaptain(slot: number) {
    setCaptainSlot((c) => (c === slot ? null : slot));
  }

  async function handleSave() {
    setActionErr(null);
    const filled = picks.slice(0, rosterSize);
    if (filled.some((p) => !p.trim())) {
      setActionErr(`Choose ${rosterSize} distinct players.`);
      return;
    }
    if (new Set(filled).size !== filled.length) {
      setActionErr("Each roster slot must be a different player.");
      return;
    }
    setBusy(true);
    try {
      const body = {
        tournament_key: tournamentKey,
        division_key: divisionKey,
        picks: filled.map((player_name, slot_index) => ({
          player_name,
          is_captain: captainSlot === slot_index,
        })),
      };
      const res = await apiPut<PutRosterResponse>("/api/v1/winter-fantasy/roster", body);
      setPicks((prev) => {
        const next = [...prev];
        for (const p of res.picks) {
          if (p.slot_index >= 0 && p.slot_index < next.length) next[p.slot_index] = p.player_name;
        }
        return next;
      });
      setCaptainSlot(res.picks.find((p) => p.is_captain)?.slot_index ?? null);
      await onRosterSaved?.();
    } catch (e) {
      setActionErr(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setBusy(false);
    }
  }

  async function handleScore() {
    if (!divisionKey) return;
    setActionErr(null);
    setBusy(true);
    try {
      const enc = encodeURIComponent(divisionKey);
      const t = encodeURIComponent(tournamentKey);
      const s = await apiGet<ScoreResponse>(`/api/v1/winter-fantasy/score?tournament_key=${t}&division_key=${enc}`);
      setScore(s);
    } catch (e) {
      setActionErr(e instanceof Error ? e.message : "Could not load score.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="dash-card wf-section">
      <div className="dash-label">Tournament fantasy — featured divisions only</div>
      <p className="dash-sub wf-lead">
        Divisions offered here have at least <strong>5 players</strong>, or <strong>4 players</strong> with{" "}
        <strong>6+</strong> generated matches so round robin gives everyone enough games. Pick {rosterSize} players per
        division.
      </p>
      <div className="wf-score-table-wrap">
        <div className="dash-sub" style={{ marginBottom: 6 }}>
          Scoring table (MVP)
        </div>
        <table className="dash-table">
          <thead>
            <tr>
              <th>Event</th>
              <th>Points</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Match win</td>
              <td>+5</td>
            </tr>
            <tr>
              <td>Qualify for playoffs</td>
              <td>+10</td>
            </tr>
            <tr>
              <td>Gold medal</td>
              <td>+25</td>
            </tr>
            <tr>
              <td>Upset win</td>
              <td>+8</td>
            </tr>
            <tr>
              <td>Undefeated pool run</td>
              <td>+10</td>
            </tr>
          </tbody>
        </table>
      </div>

      {loadingMeta && <p className="dash-empty">Loading divisions…</p>}
      {metaErr && <p className="dash-error">{metaErr}</p>}

      {meta && !loadingMeta && (
        <>
          <div className="dash-sub wf-meta">
            {meta.tournament_name} · rules v{meta.scoring_version}
          </div>
          <div className="wf-row">
            <label className="wf-label" htmlFor="wf-tournament">
              Tournament
            </label>
            <select
              id="wf-tournament"
              className="wf-select"
              value={tournamentKey}
              onChange={(e) => {
                const nextKey = e.target.value;
                setTournamentKey(nextKey);
                setDivisionKey("");
                setPlayers([]);
                setScore(null);
                setCaptainSlot(null);
                setPicks(emptyPicks(rosterSize));
                void loadDivisions(nextKey);
              }}
              disabled={busy || loadingMeta}
            >
              {meta.available_tournaments.map((t) => (
                <option key={t.tournament_key} value={t.tournament_key}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div className="wf-row">
            <label className="wf-label" htmlFor="wf-division">
              Division
            </label>
            <select
              id="wf-division"
              className="wf-select"
              value={divisionKey}
              onChange={(e) => setDivisionKey(e.target.value)}
              disabled={busy}
            >
              <option value="">Select…</option>
              {meta.divisions.map((d) => (
                <option key={d.division_key} value={d.division_key}>
                  {d.event_type} — {d.skill_level} / {d.age_bracket} ({d.player_count} players, {d.match_count}{" "}
                  matches)
                </option>
              ))}
            </select>
          </div>

          {divisionKey && (
            <>
              <div className="wf-picks">
                {Array.from({ length: rosterSize }, (_, slot) => (
                  <div key={slot} className="wf-pick-row">
                    <span className="wf-slot">Slot {slot + 1}</span>
                    <select
                      className="wf-select wf-select-grow"
                      value={picks[slot] ?? ""}
                      onChange={(e) => setPickAt(slot, e.target.value)}
                      disabled={busy || players.length === 0}
                    >
                      <option value="">Choose player…</option>
                      {players.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                    <label className="wf-cap">
                      <input
                        type="checkbox"
                        checked={captainSlot === slot}
                        onChange={() => toggleCaptain(slot)}
                        disabled={busy}
                      />{" "}
                      Captain (1.5×)
                    </label>
                  </div>
                ))}
              </div>

              <div className="wf-actions">
                <button type="button" className="dash-main-btn wf-btn" disabled={busy} onClick={() => void handleSave()}>
                  {busy ? "Working…" : "Save roster"}
                </button>
                <button
                  type="button"
                  className="dash-ghost-btn wf-btn"
                  disabled={busy || !divisionKey}
                  onClick={() => void handleScore()}
                >
                  Fantasy score
                </button>
              </div>
            </>
          )}

          {actionErr && <p className="dash-error">{actionErr}</p>}

          {score && (
            <div className="wf-score">
              <div className="wf-score-total">
                Roster total: <strong>{score.roster_total}</strong> WakiPoints
              </div>
              <table className="dash-table">
                <thead>
                  <tr>
                    <th>Player</th>
                    <th>Cap</th>
                    <th>WakiPoints</th>
                    <th>Breakdown</th>
                  </tr>
                </thead>
                <tbody>
                  {score.players.map((row) => (
                    <tr key={row.player_name}>
                      <td>{row.player_name}</td>
                      <td>{row.is_captain ? "Yes" : "—"}</td>
                      <td>{row.fantasy_points}</td>
                      <td className="wf-bd">
                        {row.breakdown.map((b) => `${b.label}: ${b.points}`).join(" · ")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="dash-footnote">{score.note}</p>
            </div>
          )}
        </>
      )}
    </section>
  );
}
