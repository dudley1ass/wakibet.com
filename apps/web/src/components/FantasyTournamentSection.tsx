import { useCallback, useEffect, useMemo, useState } from "react";
import { playerWakiCashCost, WINTER_FANTASY_ROSTER_SIZE } from "@wakibet/shared";
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
  { tournament_key: "atlanta_weekend", label: "PPA Atlanta Weekend" },
];

function emptyPicks(): string[] {
  return Array.from({ length: ROSTER_SIZE }, () => "");
}

function normPlayerName(n: string): string {
  return n.trim().toLowerCase().replace(/\s+/g, " ");
}

function hypeLineForPick(name: string): string {
  const n = name.trim();
  if (!n) return "";
  const i = Math.abs(n.split("").reduce((a, c) => a + c.charCodeAt(0), 0)) % 3;
  const lines = [
    `Great pick — ${n} is hot right now.`,
    `Nice — ${n} gives this event real upside.`,
    `${n}? Solid choice for this bracket.`,
  ];
  return lines[i] ?? lines[0]!;
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
  const [tournamentKey, setTournamentKey] = useState("atlanta_weekend");
  const [eventsMeta, setEventsMeta] = useState<EventsResponse | null>(null);
  const [lineup, setLineup] = useState<LineupResponse | null>(null);
  const [metaErr, setMetaErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [slots, setSlots] = useState<(SlotDraft | null)[]>([null, null, null, null, null]);
  const [busy, setBusy] = useState(false);
  const [actionErr, setActionErr] = useState<string | null>(null);
  const [actionOk, setActionOk] = useState<string | null>(null);

  /** Eligible divisions the user can still attach to a slot (not past first-match lock). */
  const pickableEvents = useMemo(
    () => (eventsMeta?.events ?? []).filter((e) => e.is_selectable && !e.is_locked),
    [eventsMeta],
  );
  /** Eligible on paper, but first match is in the past — show in dropdown disabled so the hub is not empty. */
  const lockedSelectableEvents = useMemo(
    () => (eventsMeta?.events ?? []).filter((e) => e.is_selectable && e.is_locked),
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

  const budgetPerEvent = lineup?.wakicash_budget ?? 100;
  const hasEventOverBudget = useMemo(() => {
    return slots.some((sl) => {
      if (!sl) return false;
      const slotSpend = sl.picks.reduce((sum, name) => {
        const n = name.trim();
        if (!n) return sum;
        return sum + Math.ceil(playerWakiCashCost(sl.skill_level, n) * sl.wakicash_multiplier);
      }, 0);
      return slotSpend > budgetPerEvent;
    });
  }, [slots, budgetPerEvent]);

  const coach = useMemo(() => {
    if (metaErr) return { tone: "error" as const, title: "Heads up", lines: [metaErr] };
    if (!loading && eventsMeta && pickableEvents.length === 0 && lockedSelectableEvents.length > 0) {
      return {
        tone: "warn" as const,
        title: "Lineups closed for this schedule",
        lines: [
          `Every fantasy-eligible event for ${eventsMeta.tournament_name} is past its lineup lock (first match already started or finished).`,
          "Expand “Choose event” below to see those divisions grayed out, or switch to a tournament whose dates are still in the future.",
        ],
      };
    }
    if (!loading && eventsMeta && pickableEvents.length === 0 && lockedSelectableEvents.length === 0) {
      const offered = eventsMeta.events.filter((e) => e.is_selectable).length;
      const total = eventsMeta.events.length;
      if (total > 0 && offered === 0) {
        return {
          tone: "warn" as const,
          title: "No events offered for fantasy",
          lines: [
            "This schedule loaded, but no divisions passed the fantasy gates (enough distinct players plus a valid 100 WakiCash five-player roster at tier multipliers). Try another tournament.",
          ],
        };
      }
    }
    if (actionErr) return { tone: "error" as const, title: "Fix this first", lines: [actionErr] };
    if (hasEventOverBudget) {
      return {
        tone: "error" as const,
        title: "WakiCash",
        lines: ["One of your events is over 100 WakiCash. Trim a pick or swap for a cheaper player."],
      };
    }
    for (let s = 0; s < 5; s++) {
      const sl = slots[s];
      if (!sl) continue;
      const trimmed = sl.picks.map((x) => x.trim());
      const filled = trimmed.filter(Boolean);
      if (filled.length === 0) continue;
      const keys = filled.map(normPlayerName);
      if (new Set(keys).size < keys.length) {
        const seen = new Set<string>();
        let dup = "";
        for (const n of filled) {
          const k = normPlayerName(n);
          if (seen.has(k)) {
            dup = n;
            break;
          }
          seen.add(k);
        }
        return {
          tone: "error" as const,
          title: "Same event",
          lines: [
            dup
              ? `You have ${dup} twice in event slot ${s + 1}. That player is hidden in other slots here — pick someone else in one of those spots.`
              : `You have a duplicate player in event slot ${s + 1}.`,
          ],
        };
      }
      if (trimmed.every((x) => x) && sl.captainSlot === null) {
        return {
          tone: "warn" as const,
          title: "Almost there",
          lines: [`Event slot ${s + 1} needs a captain — pick exactly one checkbox.`],
        };
      }
    }
    if (actionOk) return { tone: "success" as const, title: "All set", lines: [actionOk] };
    let lastPick = "";
    for (let s = 4; s >= 0; s--) {
      const sl = slots[s];
      if (!sl) continue;
      for (let i = ROSTER_SIZE - 1; i >= 0; i--) {
        const n = sl.picks[i]?.trim();
        if (n) {
          lastPick = n;
          break;
        }
      }
      if (lastPick) break;
    }
    if (lastPick) {
      return { tone: "good" as const, title: "Coach", lines: [hypeLineForPick(lastPick)] };
    }
    return {
      tone: "info" as const,
      title: "Build your lineup",
      lines: [
        "Choose up to five events. Each event needs five different players and one captain. Same player can play multiple events — just not twice in the same event.",
      ],
    };
  }, [
    metaErr,
    actionErr,
    hasEventOverBudget,
    actionOk,
    slots,
    loading,
    eventsMeta,
    pickableEvents.length,
    lockedSelectableEvents.length,
  ]);

  async function attachEventToSlot(slotIndex: number, event_key: string) {
    const ev = pickableEvents.find((e) => e.event_key === event_key);
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
    setActionOk(null);
    const budget = lineup?.wakicash_budget ?? 100;
    const payloadEvents: {
      slot_index: number;
      event_key: string;
      picks: { player_name: string; is_captain: boolean }[];
    }[] = [];

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
      const eventSpend = filled.reduce(
        (sum, player_name) =>
          sum + Math.ceil(playerWakiCashCost(sl.skill_level, player_name) * sl.wakicash_multiplier),
        0,
      );
      if (eventSpend > budget) {
        setActionErr(`Event slot ${s + 1} exceeds ${budget} WakiCash.`);
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

    if (payloadEvents.length === 0) {
      setActionErr("Add at least one event with 5 picks before saving.");
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
      setActionOk(
        `Saved Tournament Lineup with ${saved.events.length} event${saved.events.length === 1 ? "" : "s"}.`,
      );
      await onRosterSaved?.();
    } catch (e) {
      setActionErr(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setBusy(false);
    }
  }

  const sectionClass = pageLayout ? "dash-card wf-section wf-section--page" : "dash-card wf-section";

  const builderMain = (
    <>
      {!pageLayout ? (
        <>
          {metaErr ? <p className="dash-error">{metaErr}</p> : null}
          {actionErr ? <p className="dash-error">{actionErr}</p> : null}
          {hasEventOverBudget ? (
            <p className="dash-error">An event is over budget. You cannot exceed 100 WakiCash for an event.</p>
          ) : null}
          {actionOk ? <p style={{ color: "#166534", marginTop: 8 }}>{actionOk}</p> : null}
        </>
      ) : null}

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
            const budget = lineup?.wakicash_budget ?? 100;
            const slotSpend =
              sl?.picks.reduce((sum, name) => {
                const n = name.trim();
                if (!n) return sum;
                return sum + Math.ceil(playerWakiCashCost(sl.skill_level, n) * sl.wakicash_multiplier);
              }, 0) ?? 0;
            const slotAvailable = Math.max(0, budget - slotSpend);
            const slotOverBudget = slotSpend > budget;
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
                <div
                  className="dash-sub wf-meta"
                  style={{
                    marginTop: 8,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    gap: 12,
                  }}
                >
                  <span>WakiCash left in this event</span>
                  <strong style={{ fontSize: "1.1rem", fontWeight: 800 }}>
                    {slotAvailable} WC
                  </strong>
                  {sl ? <span>used: {slotSpend} WC</span> : null}
                </div>
                {slotOverBudget && !pageLayout ? (
                  <p className="dash-error" style={{ marginTop: 6 }}>
                    Event slot {slotIndex + 1} is over budget ({slotSpend} / {budget} WakiCash).
                  </p>
                ) : null}
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
                      {pickableEvents.map((e) => (
                        <option key={e.event_key} value={e.event_key}>
                          {e.label} (tier {e.tier_code})
                        </option>
                      ))}
                      {lockedSelectableEvents.length > 0 ? (
                        <optgroup label="Locked (new picks closed — first match in the past)">
                          {lockedSelectableEvents.map((e) => (
                            <option key={e.event_key} value="" disabled>
                              {e.label} (tier {e.tier_code})
                            </option>
                          ))}
                        </optgroup>
                      ) : null}
                    </select>
                  </div>
                ) : (
                  <>
                    <p className="dash-sub wf-lead" style={{ marginTop: 8 }}>
                      <strong>{sl.label}</strong> · tier WakiCash ×{sl.wakicash_multiplier}
                    </p>
                    <div className="wf-picks" style={{ marginTop: 8 }}>
                      {Array.from({ length: ROSTER_SIZE }, (_, i) => {
                        const currentPick = sl.picks[i] ?? "";
                        const takenInEvent = new Set(
                          sl.picks
                            .map((n, j) => (j !== i && n.trim() ? normPlayerName(n) : null))
                            .filter((x): x is string => Boolean(x)),
                        );
                        const playerOptions = sl.players.filter(
                          (p) =>
                            !takenInEvent.has(normPlayerName(p.player_name)) || p.player_name === currentPick,
                        );
                        return (
                          <div key={i} className="wf-pick-row">
                            <span className="wf-slot">Slot {i + 1}</span>
                            <select
                              className="wf-select wf-select-grow"
                              value={sl.picks[i] ?? ""}
                              disabled={busy}
                              onChange={(e) => setPick(slotIndex, i, e.target.value)}
                            >
                              <option value="">Choose player…</option>
                              {playerOptions.map((p) => {
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
                        );
                      })}
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
          <button
            type="button"
            className="dash-main-btn wf-btn"
            disabled={busy || hasEventOverBudget}
            onClick={() => void handleSave()}
          >
            {busy ? "Working…" : "Save Tournament Lineup"}
          </button>
        </div>
      ) : null}
    </>
  );

  const coachPanel = pageLayout ? (
    <aside className={`ft-coach-panel ft-coach-panel--${coach.tone}`} aria-live="polite">
      <div className="ft-coach-panel-kicker">Coach</div>
      <h3 className="ft-coach-panel-title">{coach.title}</h3>
      {coach.lines.map((line, idx) => (
        <p key={idx} className="ft-coach-panel-line">
          {line}
        </p>
      ))}
    </aside>
  ) : null;

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

      {pageLayout ? (
        <div className="ft-builder-layout">
          <div className="ft-builder-main">{builderMain}</div>
          {coachPanel}
        </div>
      ) : (
        builderMain
      )}
    </section>
  );
}
