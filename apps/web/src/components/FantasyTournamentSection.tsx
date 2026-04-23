import { useCallback, useEffect, useMemo, useState } from "react";
import { playerWakiCashCost, validateWakiCashLineup, WINTER_FANTASY_ROSTER_SIZE } from "@wakibet/shared";
import { apiGet, apiPut } from "../api";
import "./dashboard.css";

type CatalogEvent = {
  event_key: string;
  schedule_division_key: string;
  label: string;
  format: string;
  tier_code: string;
  wakicash_multiplier: number;
  wakipoints_multiplier: number;
  is_selectable: boolean;
  match_count: number;
  player_count: number;
  first_match_starts_at: string | null;
  is_locked: boolean;
};

type EventsResponse = {
  tournament_key: string;
  tournament_name: string;
  events: CatalogEvent[];
};

type DivisionPlayer = { player_name: string; waki_cash: number };

type PlayersResponse = {
  tournament_key: string;
  division_key: string;
  skill_level: string;
  waki_cash_budget: number;
  players: DivisionPlayer[];
};

type LineupEvent = {
  slot_index: number;
  event_key: string;
  schedule_division_key: string;
  label: string;
  tier_code_at_save: string | null;
  is_locked: boolean;
  picks: { slot_index: number; player_name: string; is_captain: boolean; waki_cash: number }[];
};

type LineupResponse = {
  tournament_key: string;
  season_key: string;
  wakicash_budget: number;
  wakicash_spent: number;
  events: LineupEvent[];
};

const ROSTER_SIZE = WINTER_FANTASY_ROSTER_SIZE;
const TOURNAMENT_OPTIONS: { tournament_key: string; label: string }[] = [
  { tournament_key: "winter_springs", label: "Winter Springs" },
  { tournament_key: "pictona", label: "Pictona" },
  { tournament_key: "jacksonville", label: "Jacksonville" },
  { tournament_key: "bradenton", label: "Bradenton" },
];

function emptyPicks(): string[] {
  return Array.from({ length: ROSTER_SIZE }, () => "");
}

type SlotDraft = {
  event_key: string;
  schedule_division_key: string;
  label: string;
  skill_level: string;
  wakicash_multiplier: number;
  players: DivisionPlayer[];
  picks: string[];
  captainSlot: number | null;
};

type FantasyTournamentProps = {
  onRosterSaved?: () => void | Promise<void>;
  pageLayout?: boolean;
};

export default function FantasyTournamentSection({ onRosterSaved, pageLayout }: FantasyTournamentProps) {
  const [tournamentKey, setTournamentKey] = useState("winter_springs");
  const [eventsMeta, setEventsMeta] = useState<EventsResponse | null>(null);
  const [lineup, setLineup] = useState<LineupResponse | null>(null);
  const [metaErr, setMetaErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [slots, setSlots] = useState<(SlotDraft | null)[]>([null, null, null, null, null]);
  const [busy, setBusy] = useState(false);
  const [actionErr, setActionErr] = useState<string | null>(null);

  const selectableEvents = useMemo(
    () => (eventsMeta?.events ?? []).filter((e) => e.is_selectable && !e.is_locked),
    [eventsMeta],
  );

  const loadAll = useCallback(async (tk: string) => {
    setMetaErr(null);
    setLoading(true);
    try {
      const enc = encodeURIComponent(tk);
      const [ev, lu] = await Promise.all([
        apiGet<EventsResponse>(`/api/v1/fantasy-tournament/${enc}/events`),
        apiGet<LineupResponse>(`/api/v1/fantasy-tournament/${enc}/lineup`),
      ]);
      setEventsMeta(ev);
      setLineup(lu);
      const next: (SlotDraft | null)[] = [null, null, null, null, null];
      for (const row of lu.events) {
        const i = row.slot_index;
        if (i < 0 || i > 4) continue;
        const cat = ev.events.find((c) => c.event_key === row.event_key);
        const mult = cat?.wakicash_multiplier ?? 1;
        const pl = await apiGet<PlayersResponse>(
          `/api/v1/winter-fantasy/division-players?tournament_key=${encodeURIComponent(tk)}&division_key=${encodeURIComponent(row.schedule_division_key)}`,
        );
        const players = pl.players ?? [];
        const picks = emptyPicks();
        let cap: number | null = null;
        for (const p of row.picks) {
          if (p.slot_index >= 0 && p.slot_index < picks.length) {
            picks[p.slot_index] = p.player_name;
            if (p.is_captain) cap = p.slot_index;
          }
        }
        next[i] = {
          event_key: row.event_key,
          schedule_division_key: row.schedule_division_key,
          label: row.label,
          skill_level: pl.skill_level,
          wakicash_multiplier: mult,
          players,
          picks,
          captainSlot: cap,
        };
      }
      setSlots(next);
    } catch (e) {
      setMetaErr(e instanceof Error ? e.message : "Could not load fantasy tournament.");
      setEventsMeta(null);
      setLineup(null);
      setSlots([null, null, null, null, null]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAll(tournamentKey);
  }, [tournamentKey, loadAll]);

  const totalSpendPreview = useMemo(() => {
    let s = 0;
    for (const sl of slots) {
      if (!sl) continue;
      for (let i = 0; i < ROSTER_SIZE; i++) {
        const n = sl.picks[i]?.trim();
        if (!n) continue;
        s += Math.ceil(playerWakiCashCost(sl.skill_level, n) * sl.wakicash_multiplier);
      }
    }
    return s;
  }, [slots]);

  async function attachEventToSlot(slotIndex: number, event_key: string) {
    const ev = selectableEvents.find((e) => e.event_key === event_key);
    if (!ev) return;
    setActionErr(null);
    setBusy(true);
    try {
      const encDiv = encodeURIComponent(ev.schedule_division_key);
      const tk = encodeURIComponent(tournamentKey);
      const pl = await apiGet<PlayersResponse>(
        `/api/v1/winter-fantasy/division-players?tournament_key=${tk}&division_key=${encDiv}`,
      );
      setSlots((prev) => {
        const next = [...prev];
        next[slotIndex] = {
          event_key: ev.event_key,
          schedule_division_key: ev.schedule_division_key,
          label: ev.label,
          skill_level: pl.skill_level,
          wakicash_multiplier: ev.wakicash_multiplier,
          players: pl.players ?? [],
          picks: emptyPicks(),
          captainSlot: null,
        };
        return next;
      });
    } catch (e) {
      setActionErr(e instanceof Error ? e.message : "Failed to load players.");
    } finally {
      setBusy(false);
    }
  }

  function clearSlot(slotIndex: number) {
    setSlots((prev) => {
      const next = [...prev];
      next[slotIndex] = null;
      return next;
    });
  }

  function setPick(slotIndex: number, pickIdx: number, name: string) {
    setSlots((prev) => {
      const next = [...prev];
      const sl = next[slotIndex];
      if (!sl) return prev;
      const picks = [...sl.picks];
      picks[pickIdx] = name;
      next[slotIndex] = { ...sl, picks };
      return next;
    });
  }

  function toggleCaptain(slotIndex: number, pickIdx: number) {
    setSlots((prev) => {
      const next = [...prev];
      const sl = next[slotIndex];
      if (!sl) return prev;
      next[slotIndex] = {
        ...sl,
        captainSlot: sl.captainSlot === pickIdx ? null : pickIdx,
      };
      return next;
    });
  }

  async function handleSave() {
    setActionErr(null);
    const budget = lineup?.wakicash_budget ?? 100;
    const payloadEvents: {
      slot_index: number;
      event_key: string;
      picks: { player_name: string; is_captain: boolean }[];
    }[] = [];

    const usedNames = new Set<string>();
    for (let s = 0; s < 5; s++) {
      const sl = slots[s];
      if (!sl) continue;
      const filled = sl.picks.map((p) => p.trim());
      if (filled.some((p) => !p)) {
        setActionErr(`Event slot ${s + 1}: fill all ${ROSTER_SIZE} players.`);
        return;
      }
      if (new Set(filled).size !== filled.length) {
        setActionErr(`Event slot ${s + 1}: players must be distinct.`);
        return;
      }
      if (sl.captainSlot === null) {
        setActionErr(`Event slot ${s + 1}: choose a captain.`);
        return;
      }
      for (const n of filled) {
        const k = n.toLowerCase();
        if (usedNames.has(k)) {
          setActionErr("The same player cannot appear in two events in one tournament lineup.");
          return;
        }
        usedNames.add(k);
      }
      const wakiRows = filled.map((player_name, slot_index) => ({
        player_name,
        is_captain: sl.captainSlot === slot_index,
        waki_cash: Math.ceil(playerWakiCashCost(sl.skill_level, player_name) * sl.wakicash_multiplier),
      }));
      const v = validateWakiCashLineup(wakiRows);
      if (!v.ok) {
        setActionErr(`Slot ${s + 1}: ${v.message}`);
        return;
      }
      payloadEvents.push({
        slot_index: s,
        event_key: sl.event_key,
        picks: filled.map((player_name, slot_index) => ({
          player_name,
          is_captain: sl.captainSlot === slot_index,
        })),
      });
    }

    let spend = 0;
    for (const pe of payloadEvents) {
      const sl = slots[pe.slot_index];
      if (!sl) continue;
      for (const p of pe.picks) {
        spend += Math.ceil(playerWakiCashCost(sl.skill_level, p.player_name) * sl.wakicash_multiplier);
      }
    }
    if (spend > budget) {
      setActionErr(`Total WakiCash ${spend} exceeds tournament budget ${budget}.`);
      return;
    }

    setBusy(true);
    try {
      const enc = encodeURIComponent(tournamentKey);
      const saved = await apiPut<LineupResponse>(`/api/v1/fantasy-tournament/${enc}/lineup`, {
        season_key: lineup?.season_key ?? "",
        events: payloadEvents,
      });
      setLineup(saved);
      await onRosterSaved?.();
    } catch (e) {
      setActionErr(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setBusy(false);
    }
  }

  const sectionClass = pageLayout ? "dash-card wf-section wf-section--page" : "dash-card wf-section";

  return (
    <section className={sectionClass}>
      {pageLayout ? (
        <div className="wf-page-hero">
          <div className="wf-page-hero-kicker">Multi-event lineup</div>
          <h2 className="wf-page-title">Tournament fantasy</h2>
          <p className="wf-page-lead">
            Up to five events per tournament, one fresh <strong>100 WakiCash</strong> pool per tournament, per-event
            locks. Same scoring engine as division fantasy; tier A/B/C adjusts prices and WakiPoints.{" "}
            <a href="/fantasy-rules">How fantasy works (rules)</a>
          </p>
        </div>
      ) : (
        <div className="dash-label">Tournament fantasy — multi-event</div>
      )}

      {metaErr ? <p className="dash-error">{metaErr}</p> : null}
      {actionErr ? <p className="dash-error">{actionErr}</p> : null}

      <div className="wf-row" style={{ marginTop: pageLayout ? 12 : 8 }}>
        <label className="wf-label" htmlFor="ft-tournament">
          Tournament
        </label>
        <select
          id="ft-tournament"
          className="wf-select"
          value={tournamentKey}
          disabled={loading || busy}
          onChange={(e) => setTournamentKey(e.target.value)}
        >
          {TOURNAMENT_OPTIONS.map((t) => (
            <option key={t.tournament_key} value={t.tournament_key}>
              {t.label}
            </option>
          ))}
        </select>
      </div>
      {lineup ? (
        <p className="dash-sub wf-meta" style={{ marginTop: 8 }}>
          Saved WakiCash <strong>{lineup.wakicash_spent}</strong> / {lineup.wakicash_budget} · unsaved preview{" "}
          <strong>{totalSpendPreview}</strong>
        </p>
      ) : null}

      {loading ? <p className="dash-empty">Loading…</p> : null}

      {!loading && eventsMeta ? (
        <div className="wf-cascade" style={{ marginTop: 12 }}>
          {[0, 1, 2, 3, 4].map((slotIndex) => {
            const sl = slots[slotIndex];
            return (
              <div key={slotIndex} className="dash-card" style={{ marginBottom: 12, padding: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                  <h3 className="dash-sub" style={{ margin: 0, fontWeight: 700 }}>
                    Event slot {slotIndex + 1}
                  </h3>
                  {sl ? (
                    <button type="button" className="dash-ghost-btn" disabled={busy} onClick={() => clearSlot(slotIndex)}>
                      Clear
                    </button>
                  ) : null}
                </div>
                {!sl ? (
                  <div className="wf-row" style={{ marginTop: 8 }}>
                    <label className="wf-label" htmlFor={`ft-ev-${slotIndex}`}>
                      Choose event
                    </label>
                    <select
                      id={`ft-ev-${slotIndex}`}
                      className="wf-select"
                      value=""
                      disabled={busy}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (v) void attachEventToSlot(slotIndex, v);
                      }}
                    >
                      <option value="">—</option>
                      {selectableEvents.map((e) => (
                        <option key={e.event_key} value={e.event_key}>
                          {e.label} (tier {e.tier_code})
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <>
                    <p className="dash-sub wf-lead" style={{ marginTop: 8 }}>
                      <strong>{sl.label}</strong> · tier WakiCash ×{sl.wakicash_multiplier}
                    </p>
                    <div className="wf-picks" style={{ marginTop: 8 }}>
                      {Array.from({ length: ROSTER_SIZE }, (_, i) => (
                        <div key={i} className="wf-pick-row">
                          <span className="wf-slot">Slot {i + 1}</span>
                          <select
                            className="wf-select wf-select-grow"
                            value={sl.picks[i] ?? ""}
                            disabled={busy}
                            onChange={(e) => setPick(slotIndex, i, e.target.value)}
                          >
                            <option value="">Choose player…</option>
                            {sl.players.map((p) => {
                              const cost = Math.ceil(
                                playerWakiCashCost(sl.skill_level, p.player_name) * sl.wakicash_multiplier,
                              );
                              return (
                                <option key={p.player_name} value={p.player_name}>
                                  {p.player_name} — {cost} WC
                                </option>
                              );
                            })}
                          </select>
                          <label className="wf-cap">
                            <input
                              type="checkbox"
                              checked={sl.captainSlot === i}
                              onChange={() => toggleCaptain(slotIndex, i)}
                              disabled={busy}
                            />{" "}
                            Captain (1.5×)
                          </label>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      ) : null}

      {!loading && eventsMeta ? (
        <div className="wf-actions">
          <button type="button" className="dash-main-btn wf-btn" disabled={busy} onClick={() => void handleSave()}>
            {busy ? "Working…" : "Save tournament lineup"}
          </button>
        </div>
      ) : null}
    </section>
  );
}
