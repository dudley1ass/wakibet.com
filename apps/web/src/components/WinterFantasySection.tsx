import { useCallback, useEffect, useMemo, useState } from "react";
import { playerWakiCashCost, validateWakiCashLineup, WAKICASH_BUDGET_PER_LINEUP } from "@wakibet/shared";
import { apiGet, apiPut } from "../api";
import "./dashboard.css";

const ROSTER_SIZE = 5;

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

type DivisionPlayer = { player_name: string; waki_cash: number };
type PlayersResponse = {
  tournament_key: string;
  division_key: string;
  skill_level: string;
  waki_cash_budget: number;
  players: DivisionPlayer[];
};

type RosterResponse = {
  tournament_key: string;
  division_key: string;
  picks: { slot_index: number; player_name: string; is_captain: boolean; waki_cash: number }[];
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

function sortSkillLevels(a: string, b: string): number {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
}

type WinterFantasyProps = {
  onRosterSaved?: () => void | Promise<void>;
  /** Larger title + payout-board styling (Pick / Edit Teams screen). */
  pageLayout?: boolean;
};

export default function WinterFantasySection({ onRosterSaved, pageLayout }: WinterFantasyProps) {
  const [meta, setMeta] = useState<DivisionsResponse | null>(null);
  const [metaErr, setMetaErr] = useState<string | null>(null);
  const [loadingMeta, setLoadingMeta] = useState(true);

  const [tournamentKey, setTournamentKey] = useState("winter_springs");
  const [eventType, setEventType] = useState("");
  const [skillLevel, setSkillLevel] = useState("");
  const [ageBracket, setAgeBracket] = useState("");

  const [players, setPlayers] = useState<DivisionPlayer[]>([]);
  const [picks, setPicks] = useState<string[]>(emptyPicks(ROSTER_SIZE));
  const [captainSlot, setCaptainSlot] = useState<number | null>(null);

  const [busy, setBusy] = useState(false);
  const [actionErr, setActionErr] = useState<string | null>(null);
  const [score, setScore] = useState<ScoreResponse | null>(null);

  const rosterSize = meta?.roster_size ?? ROSTER_SIZE;

  const divisions = meta?.divisions ?? [];

  const eventTypes = useMemo(() => {
    const u = [...new Set(divisions.map((d) => d.event_type))];
    u.sort((a, b) => a.localeCompare(b));
    return u;
  }, [divisions]);

  const skillLevels = useMemo(() => {
    if (!eventType) return [];
    const u = [...new Set(divisions.filter((d) => d.event_type === eventType).map((d) => d.skill_level))];
    u.sort(sortSkillLevels);
    return u;
  }, [divisions, eventType]);

  const ageBrackets = useMemo(() => {
    if (!eventType || !skillLevel) return [];
    const rows = divisions.filter((d) => d.event_type === eventType && d.skill_level === skillLevel);
    const u = [...new Set(rows.map((d) => d.age_bracket))];
    u.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    return u;
  }, [divisions, eventType, skillLevel]);

  const resolvedDivisionKey = useMemo(() => {
    if (!eventType || !skillLevel || !ageBracket) return "";
    const row = divisions.find(
      (d) => d.event_type === eventType && d.skill_level === skillLevel && d.age_bracket === ageBracket,
    );
    return row?.division_key ?? "";
  }, [divisions, eventType, skillLevel, ageBracket]);

  const lineupWakiRows = useMemo(() => {
    const rows: { player_name: string; is_captain: boolean; waki_cash: number }[] = [];
    for (let i = 0; i < rosterSize; i++) {
      const name = picks[i]?.trim();
      if (!name) continue;
      rows.push({
        player_name: name,
        is_captain: captainSlot === i,
        waki_cash: playerWakiCashCost(skillLevel, name),
      });
    }
    return rows;
  }, [picks, rosterSize, skillLevel, captainSlot]);

  const spendPreview = useMemo(() => lineupWakiRows.reduce((s, r) => s + r.waki_cash, 0), [lineupWakiRows]);

  const wakiLint = useMemo(() => {
    if (lineupWakiRows.length !== rosterSize) return { kind: "partial" as const };
    const v = validateWakiCashLineup(lineupWakiRows);
    return v.ok ? { kind: "ok" as const } : { kind: "err" as const, message: v.message };
  }, [lineupWakiRows, rosterSize]);

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
      setEventType("");
      setSkillLevel("");
      setAgeBracket("");
      setPlayers([]);
      setScore(null);
      setCaptainSlot(null);
    } catch (e) {
      setMetaErr(e instanceof Error ? e.message : "Could not load fantasy divisions.");
    } finally {
      setLoadingMeta(false);
    }
  }, []);

  useEffect(() => {
    void loadDivisions(tournamentKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- tournament loads via onChange; mount uses initial key only
  }, [loadDivisions]);

  useEffect(() => {
    if (!meta?.divisions.length) return;
    const divs = meta.divisions;
    const evs = [...new Set(divs.map((x) => x.event_type))].sort((a, b) => a.localeCompare(b));
    const et = evs[0] ?? "";
    const sks = [...new Set(divs.filter((x) => x.event_type === et).map((x) => x.skill_level))].sort(sortSkillLevels);
    const sk = sks[0] ?? "";
    const ages = divs.filter((x) => x.event_type === et && x.skill_level === sk);
    const ag = ages[0]?.age_bracket ?? "";
    setEventType(et);
    setSkillLevel(sk);
    setAgeBracket(ag);
  }, [meta]);

  const loadDivisionDetail = useCallback(
    async (key: string) => {
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
        setPlayers(pl.players ?? []);
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
    },
    [rosterSize, tournamentKey],
  );

  useEffect(() => {
    if (resolvedDivisionKey) void loadDivisionDetail(resolvedDivisionKey);
    else void loadDivisionDetail("");
  }, [resolvedDivisionKey, loadDivisionDetail]);

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
    if (!resolvedDivisionKey) {
      setActionErr("Choose event, skill level, and age group.");
      return;
    }
    if (filled.some((p) => !p.trim())) {
      setActionErr(`Choose ${rosterSize} distinct players.`);
      return;
    }
    if (new Set(filled).size !== filled.length) {
      setActionErr("Each roster slot must be a different player.");
      return;
    }
    if (captainSlot === null) {
      setActionErr("Mark exactly one captain (1.5× WakiPoints).");
      return;
    }
    const wakiRows = filled.map((player_name, slot_index) => ({
      player_name,
      is_captain: captainSlot === slot_index,
      waki_cash: playerWakiCashCost(skillLevel, player_name),
    }));
    const wakiCheck = validateWakiCashLineup(wakiRows);
    if (!wakiCheck.ok) {
      setActionErr(wakiCheck.message);
      return;
    }
    setBusy(true);
    try {
      const body = {
        tournament_key: tournamentKey,
        division_key: resolvedDivisionKey,
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
    if (!resolvedDivisionKey) return;
    setActionErr(null);
    setBusy(true);
    try {
      const enc = encodeURIComponent(resolvedDivisionKey);
      const t = encodeURIComponent(tournamentKey);
      const s = await apiGet<ScoreResponse>(`/api/v1/winter-fantasy/score?tournament_key=${t}&division_key=${enc}`);
      setScore(s);
    } catch (e) {
      setActionErr(e instanceof Error ? e.message : "Could not load score.");
    } finally {
      setBusy(false);
    }
  }

  const sectionClass = pageLayout ? "dash-card wf-section wf-section--page" : "dash-card wf-section";

  return (
    <section className={sectionClass}>
      {pageLayout ? (
        <div className="wf-page-hero">
          <div className="wf-page-hero-kicker">Lineup builder</div>
          <h2 className="wf-page-title">Pick / Edit Teams</h2>
          <p className="wf-page-lead">
            Choose a tournament, then narrow by <strong>event</strong>, <strong>skill level</strong>, and{" "}
            <strong>age group</strong>. Only featured divisions (full enough schedules) are listed. Build with{" "}
            <strong>{WAKICASH_BUDGET_PER_LINEUP} WakiCash</strong> — five players, one captain, prices scale with
            division skill (stars cost more; sleepers stay cheap).
          </p>
        </div>
      ) : (
        <>
          <div className="dash-label">Division lineup builder</div>
          <p className="dash-sub wf-lead">
            Divisions offered here have at least <strong>5 players</strong>, or <strong>4 players</strong> with{" "}
            <strong>6+</strong> generated matches. Pick {rosterSize} players per division under{" "}
            <strong>{WAKICASH_BUDGET_PER_LINEUP} WakiCash</strong> (max two 32+ players, at least one 16 or less).
          </p>
        </>
      )}
      <p className="dash-sub wf-lead" style={{ marginTop: pageLayout ? 8 : 6 }}>
        WakiPoints rules:{" "}
        <a href="/scoring-table" className="wf-scoring-link">
          full scoring table
        </a>
        {" · "}
        <a href="/fantasy-rules" className="wf-scoring-link">
          how fantasy works
        </a>
        .
      </p>

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
                setScore(null);
                setCaptainSlot(null);
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

          <div className="wf-cascade">
            <div className="wf-row">
              <label className="wf-label" htmlFor="wf-event">
                Event / section
              </label>
              <select
                id="wf-event"
                className="wf-select"
                value={eventType}
                onChange={(e) => {
                  const v = e.target.value;
                  setEventType(v);
                  const sks = [...new Set(divisions.filter((d) => d.event_type === v).map((d) => d.skill_level))].sort(
                    sortSkillLevels,
                  );
                  const sk = sks[0] ?? "";
                  setSkillLevel(sk);
                  const ages = divisions.filter((d) => d.event_type === v && d.skill_level === sk);
                  setAgeBracket(ages[0]?.age_bracket ?? "");
                }}
                disabled={busy || !divisions.length}
              >
                {eventTypes.map((ev) => (
                  <option key={ev} value={ev}>
                    {ev}
                  </option>
                ))}
              </select>
            </div>
            <div className="wf-row">
              <label className="wf-label" htmlFor="wf-skill">
                Skill level
              </label>
              <select
                id="wf-skill"
                className="wf-select"
                value={skillLevel}
                onChange={(e) => {
                  const v = e.target.value;
                  setSkillLevel(v);
                  const ages = divisions.filter((d) => d.event_type === eventType && d.skill_level === v);
                  const ags = [...new Set(ages.map((d) => d.age_bracket))].sort((a, b) =>
                    a.localeCompare(b, undefined, { numeric: true }),
                  );
                  setAgeBracket(ags[0] ?? "");
                }}
                disabled={busy || !eventType}
              >
                {skillLevels.map((sk) => (
                  <option key={sk} value={sk}>
                    {sk}
                  </option>
                ))}
              </select>
            </div>
            <div className="wf-row">
              <label className="wf-label" htmlFor="wf-age">
                Age group
              </label>
              <select
                id="wf-age"
                className="wf-select"
                value={ageBracket}
                onChange={(e) => setAgeBracket(e.target.value)}
                disabled={busy || !skillLevel}
              >
                {ageBrackets.map((ag) => {
                  const row = divisions.find(
                    (d) => d.event_type === eventType && d.skill_level === skillLevel && d.age_bracket === ag,
                  );
                  return (
                    <option key={ag} value={ag}>
                      {ag}
                      {row ? ` (${row.player_count} players · ${row.match_count} matches)` : ""}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {resolvedDivisionKey && (
            <>
              <div className="wf-wakicash-bar">
                <div className="wf-wakicash-head">WakiCash · this event</div>
                <span className="wf-wakicash-big">
                  {spendPreview}
                  <span>/</span>
                  {WAKICASH_BUDGET_PER_LINEUP}
                </span>
                <div className="wf-wakicash-sub">Spent for this tournament / division (100 max)</div>
                {wakiLint.kind === "ok" ? (
                  <div className="wf-wakicash-ok">Lineup passes budget and roster rules.</div>
                ) : wakiLint.kind === "err" ? (
                  <div className="wf-wakicash-warn">{wakiLint.message}</div>
                ) : (
                  <div className="wf-wakicash-warn">Fill all {rosterSize} slots to validate WakiCash rules.</div>
                )}
              </div>
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
                        <option key={p.player_name} value={p.player_name}>
                          {p.player_name} — {p.waki_cash} WC
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
                  disabled={busy || !resolvedDivisionKey}
                  onClick={() => void handleScore()}
                >
                  Preview WakiPoints
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
              <div className="wf-score-cards">
                {score.players.map((row) => (
                  <div key={row.player_name} className="wf-player-card">
                    <div className="wf-player-card-head">
                      <span className="wf-player-name">{row.player_name}</span>
                      <span className="wf-player-pts">{row.fantasy_points} base</span>
                      {row.is_captain ? <span className="wf-player-cap">Captain ×1.5 on lineup</span> : null}
                    </div>
                    <ul className="wf-bd-list">
                      {row.breakdown.map((b) => (
                        <li key={b.label}>
                          <span>{b.label}</span>
                          <span className={b.points < 0 ? "wf-neg" : ""}>{b.points > 0 ? "+" : ""}{b.points}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
              <p className="dash-footnote">{score.note}</p>
            </div>
          )}
        </>
      )}
    </section>
  );
}
