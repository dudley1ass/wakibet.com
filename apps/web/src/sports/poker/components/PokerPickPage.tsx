import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  WSOP_FANTASY_CAPTAIN_MULTIPLIER,
  WSOP_FANTASY_ROSTER_SLOTS,
  WSOP_FANTASY_SOFT_LOCK_DAYS,
  WSOP_FANTASY_SOFT_LOCK_MAX_SWAPS,
  computeLineupFreezeStatus,
  countLineupSwapsAgainstBaseline,
  type LineupFreezePhase,
  type LineupFreezeStatus,
  type PokerWorldRankingRow,
} from "@wakibet/shared";
import { apiGet } from "../../../api";
import type { SessionUser } from "../../../App";
import "../../../components/dashboard.css";

const DRAFTS_KEY = "wakibet_poker_lineup_drafts_v2";
const LAST_SLATE_KEY = "wakibet_poker_lineup_last_slate_v2";
const CAPTAINS_KEY = "wakibet_poker_lineup_captains_v1";
const BASELINE_KEY = "wakibet_poker_lineup_softlock_baseline_v1";
const ACTIVITY_KEY = "wakibet_poker_lineup_activity_v1";
const ACTIVITY_MAX_PER_SLATE = 30;

type WsopCfg = {
  roster_slots: number;
  salary_cap_wakicash: number;
  featured_player_pool_max: number;
  soft_lock_days: number;
  soft_lock_max_swaps: number;
  captain_multiplier: number;
  tier1_slates: WsopSlateView[];
};

type WsopSlateView = {
  slate_key: string;
  title: string;
  start_date: string | null;
  end_date: string | null;
  start_time_pt: string | null;
};

const MONTHS_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function formatSlateDateRange(start: string | null, end: string | null): string | null {
  if (!start || !end) return null;
  const [ys, ms, ds] = start.split("-").map((n) => Number(n));
  const [ye, me, de] = end.split("-").map((n) => Number(n));
  if (!ys || !ms || !ds || !ye || !me || !de) return null;
  if (ms === me && ys === ye) return `${MONTHS_SHORT[ms - 1]} ${ds}–${de}`;
  const left = `${MONTHS_SHORT[ms - 1]} ${ds}`;
  const right = `${MONTHS_SHORT[me - 1]} ${de}`;
  return `${left} – ${right}`;
}

function formatIsoUtcAsPt(iso: string | null): string | null {
  if (!iso) return null;
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return null;
  // PDT only (May–Jul 2026). Subtract 7 hours for wall clock.
  const pt = new Date(dt.getTime() - 7 * 3_600_000);
  const month = MONTHS_SHORT[pt.getUTCMonth()];
  const day = pt.getUTCDate();
  let hh = pt.getUTCHours();
  const mm = String(pt.getUTCMinutes()).padStart(2, "0");
  const ampm = hh >= 12 ? "PM" : "AM";
  hh = hh % 12 === 0 ? 12 : hh % 12;
  return `${month} ${day} · ${hh}:${mm} ${ampm} PT`;
}

type RankingsPayload = {
  players: PokerWorldRankingRow[];
};

type DraftsMap = Record<string, string[]>;
type CaptainMap = Record<string, number>;
type BaselineMap = Record<string, string[]>;

type ActivityEvent = {
  ts: number;
  kind: "phase_open_to_soft" | "phase_soft_to_hard" | "save" | "captain_change" | "info";
  message: string;
};
type ActivityMap = Record<string, ActivityEvent[]>;

export function wakicashForRank(rank: number, poolSize: number): number {
  if (poolSize <= 1) return 18;
  const x = (rank - 1) / (poolSize - 1);
  return Math.min(30, Math.max(5, Math.round(30 - x * 25)));
}

function safeReadJson<T>(key: string, fallback: T, guard: (v: unknown) => v is T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as unknown;
    return guard(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function isStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every((x) => typeof x === "string");
}

function isDraftsMap(v: unknown): v is DraftsMap {
  if (!v || typeof v !== "object") return false;
  return Object.values(v as Record<string, unknown>).every(isStringArray);
}

function isCaptainMap(v: unknown): v is CaptainMap {
  if (!v || typeof v !== "object") return false;
  return Object.values(v as Record<string, unknown>).every((n) => typeof n === "number");
}

function isBaselineMap(v: unknown): v is BaselineMap {
  return isDraftsMap(v);
}

function isActivityMap(v: unknown): v is ActivityMap {
  if (!v || typeof v !== "object") return false;
  for (const list of Object.values(v as Record<string, unknown>)) {
    if (!Array.isArray(list)) return false;
    for (const entry of list) {
      if (!entry || typeof entry !== "object") return false;
      const e = entry as Record<string, unknown>;
      if (typeof e.ts !== "number") return false;
      if (typeof e.kind !== "string") return false;
      if (typeof e.message !== "string") return false;
    }
  }
  return true;
}

export function loadAllPokerDrafts(): DraftsMap {
  return safeReadJson<DraftsMap>(DRAFTS_KEY, {}, isDraftsMap);
}

function saveAllPokerDrafts(d: DraftsMap) {
  try {
    localStorage.setItem(DRAFTS_KEY, JSON.stringify(d));
  } catch {
    /* ignore */
  }
}

function setSlatePicks(slateKey: string, picks: string[]) {
  const all = loadAllPokerDrafts();
  all[slateKey] = picks;
  saveAllPokerDrafts(all);
}

function loadLastSlate(): string | null {
  try {
    return localStorage.getItem(LAST_SLATE_KEY);
  } catch {
    return null;
  }
}

function saveLastSlate(slateKey: string) {
  try {
    localStorage.setItem(LAST_SLATE_KEY, slateKey);
  } catch {
    /* ignore */
  }
}

export function loadAllCaptains(): CaptainMap {
  return safeReadJson<CaptainMap>(CAPTAINS_KEY, {}, isCaptainMap);
}

function saveAllCaptains(c: CaptainMap) {
  try {
    localStorage.setItem(CAPTAINS_KEY, JSON.stringify(c));
  } catch {
    /* ignore */
  }
}

function loadAllBaselines(): BaselineMap {
  return safeReadJson<BaselineMap>(BASELINE_KEY, {}, isBaselineMap);
}

function saveAllBaselines(b: BaselineMap) {
  try {
    localStorage.setItem(BASELINE_KEY, JSON.stringify(b));
  } catch {
    /* ignore */
  }
}

function loadAllActivity(): ActivityMap {
  return safeReadJson<ActivityMap>(ACTIVITY_KEY, {}, isActivityMap);
}

function saveAllActivity(a: ActivityMap) {
  try {
    localStorage.setItem(ACTIVITY_KEY, JSON.stringify(a));
  } catch {
    /* ignore */
  }
}

function pushActivity(slateKey: string, event: ActivityEvent) {
  const all = loadAllActivity();
  const list = all[slateKey] ?? [];
  list.unshift(event);
  if (list.length > ACTIVITY_MAX_PER_SLATE) list.length = ACTIVITY_MAX_PER_SLATE;
  all[slateKey] = list;
  saveAllActivity(all);
}

function phaseLabel(phase: LineupFreezePhase): string {
  if (phase === "open") return "Open — unlimited edits";
  if (phase === "soft_lock") return "Soft lock — Days 1–3";
  return "Lineup Freeze — locked";
}

function phaseModifier(phase: LineupFreezePhase): string {
  if (phase === "open") return "freeze-banner--open";
  if (phase === "soft_lock") return "freeze-banner--soft";
  return "freeze-banner--hard";
}

type Props = {
  user: SessionUser;
};

export default function PokerPickPage({ user }: Props) {
  const wsopQ = useQuery({
    queryKey: ["poker", "wsop-2026"] as const,
    queryFn: () => apiGet<WsopCfg>("/api/v1/poker/wsop-2026"),
    staleTime: 300_000,
  });

  const rankQ = useQuery({
    queryKey: ["poker", "world-rankings"] as const,
    queryFn: () => apiGet<RankingsPayload>("/api/v1/poker/world-rankings"),
    staleTime: 300_000,
  });

  const cfg = wsopQ.data;
  const cap = cfg?.salary_cap_wakicash ?? 100;
  const rosterSlots = cfg?.roster_slots ?? WSOP_FANTASY_ROSTER_SLOTS;
  const poolMax = cfg?.featured_player_pool_max ?? 150;
  const maxSwaps = cfg?.soft_lock_max_swaps ?? WSOP_FANTASY_SOFT_LOCK_MAX_SWAPS;
  const captainMultiplier = cfg?.captain_multiplier ?? WSOP_FANTASY_CAPTAIN_MULTIPLIER;

  const pool = useMemo(() => {
    const rows = rankQ.data?.players ?? [];
    return rows.slice(0, Math.min(poolMax, rows.length));
  }, [rankQ.data?.players, poolMax]);

  const wcByName = useMemo(() => {
    const m = new Map<string, number>();
    const n = pool.length;
    for (const p of pool) {
      m.set(p.player_name, wakicashForRank(p.rank, n));
    }
    return m;
  }, [pool]);

  const hydratedRef = useRef(false);
  const [slateKey, setSlateKey] = useState("");
  const [picks, setPicks] = useState<string[]>(() =>
    Array.from({ length: WSOP_FANTASY_ROSTER_SLOTS }, () => ""),
  );
  const [captainIndex, setCaptainIndex] = useState<number | null>(null);
  const [baseline, setBaseline] = useState<string[] | null>(null);
  const [activity, setActivity] = useState<ActivityEvent[]>([]);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const [now, setNow] = useState<Date>(() => new Date());
  useEffect(() => {
    const t = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(t);
  }, []);

  const activeSlate = useMemo<WsopSlateView | null>(
    () => cfg?.tier1_slates.find((s) => s.slate_key === slateKey) ?? null,
    [cfg, slateKey],
  );

  const freeze: LineupFreezeStatus | null = useMemo(() => {
    if (!activeSlate) return null;
    return computeLineupFreezeStatus(activeSlate, now);
  }, [activeSlate, now]);

  useEffect(() => {
    if (!cfg?.tier1_slates.length || hydratedRef.current) return;
    hydratedRef.current = true;
    const all = loadAllPokerDrafts();
    const allCaps = loadAllCaptains();
    const allBase = loadAllBaselines();
    const allAct = loadAllActivity();
    const last = loadLastSlate();
    const sk =
      last && cfg.tier1_slates.some((s) => s.slate_key === last)
        ? last
        : cfg.tier1_slates[0]!.slate_key;
    setSlateKey(sk);
    const existing = all[sk] ?? [];
    setPicks(
      existing.length === rosterSlots
        ? existing.map((x) => (typeof x === "string" ? x : ""))
        : Array.from({ length: rosterSlots }, () => ""),
    );
    setCaptainIndex(typeof allCaps[sk] === "number" ? allCaps[sk]! : null);
    setBaseline(Array.isArray(allBase[sk]) ? allBase[sk]! : null);
    setActivity(Array.isArray(allAct[sk]) ? allAct[sk]! : []);
  }, [cfg, rosterSlots]);

  useEffect(() => {
    if (!hydratedRef.current || !slateKey) return;
    setSlatePicks(slateKey, picks);
    saveLastSlate(slateKey);
  }, [slateKey, picks]);

  useEffect(() => {
    if (!hydratedRef.current || !slateKey) return;
    const all = loadAllCaptains();
    if (captainIndex === null) {
      delete all[slateKey];
    } else {
      all[slateKey] = captainIndex;
    }
    saveAllCaptains(all);
  }, [slateKey, captainIndex]);

  // Snapshot the baseline at the moment the slate transitions from open → soft_lock.
  useEffect(() => {
    if (!hydratedRef.current || !slateKey || !freeze) return;
    if (freeze.phase === "soft_lock" && baseline === null) {
      const snapshot = picks.slice();
      setBaseline(snapshot);
      const all = loadAllBaselines();
      all[slateKey] = snapshot;
      saveAllBaselines(all);
      const range = formatIsoUtcAsPt(freeze.hard_lock_at_iso);
      const evt: ActivityEvent = {
        ts: Date.now(),
        kind: "phase_open_to_soft",
        message: range
          ? `Soft lock begins — Lineup Freeze on ${range}. You have ${maxSwaps} swap${maxSwaps === 1 ? "" : "s"} + captain changes remaining.`
          : `Soft lock begins — you have ${maxSwaps} swap${maxSwaps === 1 ? "" : "s"} + captain changes remaining.`,
      };
      pushActivity(slateKey, evt);
      setActivity((prev) => [evt, ...prev].slice(0, ACTIVITY_MAX_PER_SLATE));
    }
  }, [freeze, slateKey, baseline, picks, maxSwaps]);

  // Log the hard-lock transition once.
  const hardLockLoggedRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!slateKey || !freeze) return;
    if (freeze.phase !== "hard_lock") return;
    const key = slateKey;
    if (hardLockLoggedRef.current.has(key)) return;
    const list = loadAllActivity()[key] ?? [];
    if (list.some((e) => e.kind === "phase_soft_to_hard")) {
      hardLockLoggedRef.current.add(key);
      return;
    }
    const evt: ActivityEvent = {
      ts: Date.now(),
      kind: "phase_soft_to_hard",
      message: `Lineup Freeze — ${activeSlate?.title ?? "this event"} lineup is now locked. Standings become final-only.`,
    };
    pushActivity(slateKey, evt);
    setActivity((prev) => [evt, ...prev].slice(0, ACTIVITY_MAX_PER_SLATE));
    hardLockLoggedRef.current.add(key);
  }, [freeze, slateKey, activeSlate]);

  const swapsUsed = useMemo(() => {
    if (!baseline) return 0;
    return countLineupSwapsAgainstBaseline(picks, baseline);
  }, [picks, baseline]);

  const swapsRemaining = Math.max(0, maxSwaps - swapsUsed);

  const phase: LineupFreezePhase = freeze?.phase ?? "open";
  const canEditPlayers =
    phase === "open" || (phase === "soft_lock" && swapsRemaining > 0);
  const canChangeCaptain = phase !== "hard_lock";
  const canClear = phase === "open";

  const handleSlateChange = useCallback(
    (nextSlate: string) => {
      if (nextSlate === slateKey) return;
      const allDrafts = loadAllPokerDrafts();
      const existing = allDrafts[nextSlate] ?? [];
      const allCaps = loadAllCaptains();
      const allBase = loadAllBaselines();
      const allAct = loadAllActivity();
      setSlateKey(nextSlate);
      setPicks(
        existing.length === rosterSlots
          ? existing.map((x) => (typeof x === "string" ? x : ""))
          : Array.from({ length: rosterSlots }, () => ""),
      );
      setCaptainIndex(typeof allCaps[nextSlate] === "number" ? allCaps[nextSlate]! : null);
      setBaseline(Array.isArray(allBase[nextSlate]) ? allBase[nextSlate]! : null);
      setActivity(Array.isArray(allAct[nextSlate]) ? allAct[nextSlate]! : []);
      setSavedAt(null);
    },
    [rosterSlots, slateKey],
  );

  const saveLineup = useCallback(() => {
    if (!slateKey) return;
    setSlatePicks(slateKey, picks);
    saveLastSlate(slateKey);
    setSavedAt(Date.now());
    const remainingSwaps = baseline
      ? Math.max(0, maxSwaps - countLineupSwapsAgainstBaseline(picks, baseline))
      : null;
    const msg =
      phase === "soft_lock" && remainingSwaps !== null
        ? `Lineup saved — you have ${remainingSwaps} lineup move${remainingSwaps === 1 ? "" : "s"} remaining.`
        : "Lineup saved.";
    const evt: ActivityEvent = { ts: Date.now(), kind: "save", message: msg };
    pushActivity(slateKey, evt);
    setActivity((prev) => [evt, ...prev].slice(0, ACTIVITY_MAX_PER_SLATE));
  }, [slateKey, picks, baseline, maxSwaps, phase]);

  const spent = useMemo(
    () => picks.reduce((sum, name) => sum + (name ? wcByName.get(name) ?? 0 : 0), 0),
    [picks, wcByName],
  );

  const remaining = Math.max(0, cap - spent);
  const overCap = spent > cap;
  const dup = useMemo(() => {
    const filled = picks.filter(Boolean);
    return filled.length !== new Set(filled).size;
  }, [picks]);

  const setSlot = useCallback(
    (idx: number, name: string) => {
      if (!canEditPlayers) return;
      setPicks((prev) => {
        const next = [...prev];
        next[idx] = name;
        return next;
      });
    },
    [canEditPlayers],
  );

  const clearLineup = useCallback(() => {
    if (!canClear) return;
    setPicks(Array.from({ length: rosterSlots }, () => ""));
    setCaptainIndex(null);
  }, [rosterSlots, canClear]);

  const setCaptain = useCallback(
    (idx: number) => {
      if (!canChangeCaptain) return;
      if (!picks[idx]) return;
      if (captainIndex === idx) return;
      setCaptainIndex(idx);
      const evt: ActivityEvent = {
        ts: Date.now(),
        kind: "captain_change",
        message: `Captain set to ${picks[idx]} (${captainMultiplier}x multiplier).`,
      };
      pushActivity(slateKey, evt);
      setActivity((prev) => [evt, ...prev].slice(0, ACTIVITY_MAX_PER_SLATE));
    },
    [canChangeCaptain, captainIndex, picks, slateKey, captainMultiplier],
  );

  // If the captained slot is now empty, drop captain (kept in sync without an activity event).
  useEffect(() => {
    if (captainIndex !== null && !picks[captainIndex]) {
      setCaptainIndex(null);
    }
  }, [picks, captainIndex]);

  const filledCount = picks.filter(Boolean).length;

  const hardLockWhen = formatIsoUtcAsPt(freeze?.hard_lock_at_iso ?? null);
  const softLockWhen = formatIsoUtcAsPt(freeze?.soft_lock_starts_at_iso ?? null);

  return (
    <div className="pick-teams-shell">
      <header className="pick-teams-head">
        <div>
          <h1 className="pick-teams-title">WSOP fantasy — pick your lineup</h1>
          <p className="pick-teams-sub">
            The <strong>5 main WSOP events</strong>, <strong>6 players per event</strong>,{" "}
            <strong>100 WakiCash each</strong> — signed in as <strong>{user.display_name || user.email}</strong>
          </p>
        </div>
        <div className="dash-head-actions">
          <Link className="dash-ghost-btn" to="/poker/rosters">
            My rosters
          </Link>
          <Link className="dash-ghost-btn" to="/poker/leaderboard">
            Standings
          </Link>
          <Link className="dash-ghost-btn" to="/poker/scoring">
            Scoring table
          </Link>
          <Link className="dash-ghost-btn" to="/">
            Back to dashboard
          </Link>
        </div>
      </header>

      {wsopQ.isLoading || rankQ.isLoading ? (
        <p className="dash-loading">Loading player pool…</p>
      ) : wsopQ.isError || !cfg ? (
        <p className="dash-error">Could not load WSOP fantasy configuration.</p>
      ) : rankQ.isError ? (
        <p className="dash-error">Could not load player rankings.</p>
      ) : (
        <div className="dash-card wf-section wf-section--page">
          <div className="wf-page-hero">
            <div className="wf-page-hero-kicker">WSOP Las Vegas 2026 — 5 flagship events</div>
            <p className="wf-page-lead">
              Pick <strong>one six-player lineup per event</strong> (five events total). Each lineup uses exactly{" "}
              <strong>100 WakiCash</strong>; pick a <strong>captain</strong> for a {captainMultiplier}× points bonus.
              Lineups remain editable through <strong>Day {WSOP_FANTASY_SOFT_LOCK_DAYS}</strong> — adapt to chip counts and survive the field.
            </p>
          </div>

          <div className="poker-wakicash-hero dash-card">
            <div className="poker-wakicash-hero__label">WakiCash left</div>
            <div className="poker-wakicash-hero__value" style={{ color: overCap ? "#fca5a5" : undefined }}>
              {remaining}
            </div>
            <div className="poker-wakicash-hero__meta">
              <span>
                of <strong>{cap}</strong> cap
              </span>
              <span>
                spent <strong>{spent}</strong>
              </span>
              <span>
                picks <strong>{filledCount}</strong> / {rosterSlots}
              </span>
            </div>
          </div>

          {overCap ? (
            <p className="dash-error">Total salary exceeds {cap} WakiCash — trim a star or swap for value.</p>
          ) : null}
          {dup ? <p className="dash-error">Duplicate players — each seat needs a different name.</p> : null}

          <div className="wf-row">
            <label className="wf-label" htmlFor="poker-slate">
              Main event — pick which of the 5 to build next
            </label>
            <select
              id="poker-slate"
              className="wf-select"
              value={slateKey}
              onChange={(e) => handleSlateChange(e.target.value)}
            >
              {cfg.tier1_slates.map((s) => {
                const range = formatSlateDateRange(s.start_date, s.end_date);
                const suffix = range ? ` — ${range}, 2026` : "";
                return (
                  <option key={s.slate_key} value={s.slate_key}>
                    {s.title}
                    {suffix}
                  </option>
                );
              })}
            </select>
            {activeSlate ? (
              <p className="dash-footnote" style={{ marginTop: 6 }}>
                {formatSlateDateRange(activeSlate.start_date, activeSlate.end_date)
                  ? `${formatSlateDateRange(activeSlate.start_date, activeSlate.end_date)}, 2026`
                  : null}
                {formatSlateDateRange(activeSlate.start_date, activeSlate.end_date) && activeSlate.start_time_pt
                  ? " · "
                  : null}
                {activeSlate.start_time_pt ? `Day 1 ${activeSlate.start_time_pt}` : null}
              </p>
            ) : null}
          </div>

          {freeze ? (
            <div className={`freeze-banner ${phaseModifier(freeze.phase)}`}>
              <div className="freeze-banner__head">
                <span className="freeze-banner__badge">{phaseLabel(freeze.phase)}</span>
                {freeze.phase === "open" && softLockWhen ? (
                  <span className="freeze-banner__when">Soft lock begins {softLockWhen}</span>
                ) : null}
                {freeze.phase === "soft_lock" && hardLockWhen ? (
                  <span className="freeze-banner__when">Lineup Freeze {hardLockWhen}</span>
                ) : null}
                {freeze.phase === "hard_lock" ? (
                  <span className="freeze-banner__when">Locked since {hardLockWhen ?? "Day 3"}</span>
                ) : null}
              </div>
              <p className="freeze-banner__body">
                {freeze.phase === "open" ? (
                  <>
                    Lineups are <strong>unlimited-edit</strong> until Day 1 first flight. Build, swap, change captain — anything
                    goes. Once Day 1 begins you enter <strong>soft lock</strong>.
                  </>
                ) : null}
                {freeze.phase === "soft_lock" ? (
                  <>
                    Soft-lock window — you have <strong>{swapsRemaining}</strong> of <strong>{maxSwaps}</strong> player
                    swap{maxSwaps === 1 ? "" : "s"} remaining. Captain changes are still allowed. Manage your roster through the
                    opening phase: chip leaders crash, sleepers explode, late regs change everything.
                  </>
                ) : null}
                {freeze.phase === "hard_lock" ? (
                  <>
                    Lineup Freeze has passed — no further edits. Final standings will be determined by your locked roster and
                    captain pick.
                  </>
                ) : null}
              </p>
            </div>
          ) : null}

          <div className="wf-picks">
            {Array.from({ length: rosterSlots }, (_, i) => {
              const selectedElsewhere = new Set(picks.filter((_, j) => j !== i && picks[j]));
              const slotName = picks[i] ?? "";
              const isCaptain = captainIndex === i && !!slotName;
              return (
                <div key={i} className={`wf-pick-row${isCaptain ? " wf-pick-row--captain" : ""}`}>
                  <span className="wf-slot">
                    Pick {i + 1}
                    {isCaptain ? <span className="wf-captain-star" title="Captain">★</span> : null}
                  </span>
                  <select
                    className="wf-select wf-select-grow"
                    value={slotName}
                    onChange={(e) => setSlot(i, e.target.value)}
                    disabled={!canEditPlayers}
                  >
                    <option value="">— Select player —</option>
                    {pool.map((p) => {
                      const wc = wcByName.get(p.player_name) ?? 0;
                      const disabled = selectedElsewhere.has(p.player_name);
                      return (
                        <option key={p.player_name} value={p.player_name} disabled={disabled}>
                          #{p.rank} {p.player_name} ({wc} WC)
                        </option>
                      );
                    })}
                  </select>
                  <span className="wf-cap">{slotName ? `${wcByName.get(slotName) ?? 0} WC` : "—"}</span>
                  <button
                    type="button"
                    className={`dash-ghost-btn wf-captain-btn${isCaptain ? " wf-captain-btn--active" : ""}`}
                    onClick={() => setCaptain(i)}
                    disabled={!canChangeCaptain || !slotName}
                    title={
                      isCaptain
                        ? `Captain (${captainMultiplier}× multiplier)`
                        : `Make captain (${captainMultiplier}× multiplier)`
                    }
                  >
                    {isCaptain ? "★ Captain" : "Make captain"}
                  </button>
                </div>
              );
            })}
          </div>

          <div className="wf-actions">
            <button
              type="button"
              className="dash-main-btn"
              onClick={saveLineup}
              disabled={overCap || dup || filledCount === 0 || (phase === "soft_lock" && swapsRemaining < 0)}
            >
              Save lineup
            </button>
            <button
              type="button"
              className="dash-ghost-btn"
              onClick={clearLineup}
              disabled={!canClear}
              title={canClear ? "Clear all picks" : "Cannot clear after soft lock begins"}
            >
              Clear lineup
            </button>
            <Link className="dash-ghost-btn" to="/poker/rosters">
              My rosters
            </Link>
            {savedAt ? <span className="dash-footnote">Saved.</span> : null}
          </div>

          {activity.length > 0 ? (
            <div className="freeze-activity dash-card">
              <div className="freeze-activity__title">Lineup activity</div>
              <ol className="freeze-activity__list">
                {activity.slice(0, 10).map((evt, idx) => (
                  <li key={`${evt.ts}-${idx}`} className={`freeze-activity__item freeze-activity__item--${evt.kind}`}>
                    <span className="freeze-activity__ts">
                      {new Date(evt.ts).toLocaleString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </span>
                    <span className="freeze-activity__msg">{evt.message}</span>
                  </li>
                ))}
              </ol>
              <p className="dash-footnote">
                In-app feed only for now. Day-by-day push notifications (“busts”, “captain doubled up”, freeze reminders) will
                wire up when the live-scoring backend ships.
              </p>
            </div>
          ) : null}

          <p className="dash-footnote">
            Structure: <strong>5</strong> main-event slates × <strong>6</strong> picks × <strong>100</strong> WakiCash per
            slate, with a <strong>{captainMultiplier}× captain</strong> bonus. Pool size here:{" "}
            <strong>{pool.length}</strong> players (featured slice of rankings). Tiered locking: open → soft lock at Day 1 →
            Lineup Freeze at Day {WSOP_FANTASY_SOFT_LOCK_DAYS}.
          </p>
        </div>
      )}
    </div>
  );
}
