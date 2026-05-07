import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { WSOP_FANTASY_ROSTER_SLOTS, type PokerWorldRankingRow } from "@wakibet/shared";
import { apiGet } from "../../../api";
import type { SessionUser } from "../../../App";
import "../../../components/dashboard.css";

const DRAFT_KEY = "wakibet_poker_lineup_draft_v1";

type WsopCfg = {
  roster_slots: number;
  salary_cap_wakicash: number;
  featured_player_pool_max: number;
  tier1_slates: { slate_key: string; title: string }[];
};

type RankingsPayload = {
  players: PokerWorldRankingRow[];
};

type DraftShape = {
  slate_key: string;
  picks: string[];
};

function wakicashForRank(rank: number, poolSize: number): number {
  if (poolSize <= 1) return 18;
  const x = (rank - 1) / (poolSize - 1);
  return Math.min(30, Math.max(5, Math.round(30 - x * 25)));
}

function loadDraft(): DraftShape | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const o = JSON.parse(raw) as DraftShape;
    if (!o || typeof o.slate_key !== "string" || !Array.isArray(o.picks)) return null;
    return o;
  } catch {
    return null;
  }
}

function saveDraft(d: DraftShape) {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(d));
  } catch {
    /* ignore */
  }
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
  const rosterSlots = cfg?.roster_slots ?? 6;
  const poolMax = cfg?.featured_player_pool_max ?? 150;

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

  useEffect(() => {
    if (!cfg?.tier1_slates.length || hydratedRef.current) return;
    hydratedRef.current = true;
    const d = loadDraft();
    const sk =
      d?.slate_key && cfg.tier1_slates.some((s) => s.slate_key === d.slate_key)
        ? d.slate_key
        : cfg.tier1_slates[0]!.slate_key;
    setSlateKey(sk);
    if (d?.picks?.length === rosterSlots) {
      setPicks(d.picks.map((x) => (typeof x === "string" ? x : "")));
    } else {
      setPicks(Array.from({ length: rosterSlots }, () => ""));
    }
  }, [cfg, rosterSlots]);

  useEffect(() => {
    if (!hydratedRef.current || !slateKey) return;
    saveDraft({ slate_key: slateKey, picks });
  }, [slateKey, picks]);

  const spent = useMemo(() => {
    return picks.reduce((sum, name) => sum + (name ? wcByName.get(name) ?? 0 : 0), 0);
  }, [picks, wcByName]);

  const remaining = Math.max(0, cap - spent);
  const overCap = spent > cap;
  const dup = useMemo(() => {
    const filled = picks.filter(Boolean);
    return filled.length !== new Set(filled).size;
  }, [picks]);

  const setSlot = useCallback((idx: number, name: string) => {
    setPicks((prev) => {
      const next = [...prev];
      next[idx] = name;
      return next;
    });
  }, []);

  const clearLineup = useCallback(() => {
    setPicks(Array.from({ length: rosterSlots }, () => ""));
  }, [rosterSlots]);

  const filledCount = picks.filter(Boolean).length;

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
          <Link className="dash-ghost-btn" to="/poker/scoring">
            Scoring table
          </Link>
          <Link className="dash-ghost-btn" to="/poker">
            Poker hub
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
              <strong>100 WakiCash</strong>; player salaries are set from the featured rankings pool below. Draft is saved in
              this browser until server-backed lineups ship.
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
              onChange={(e) => setSlateKey(e.target.value)}
            >
              {cfg.tier1_slates.map((s) => (
                <option key={s.slate_key} value={s.slate_key}>
                  {s.title}
                </option>
              ))}
            </select>
          </div>

          <div className="wf-picks">
            {Array.from({ length: rosterSlots }, (_, i) => {
              const selectedElsewhere = new Set(picks.filter((_, j) => j !== i && picks[j]));
              return (
                <div key={i} className="wf-pick-row">
                  <span className="wf-slot">Pick {i + 1}</span>
                  <select
                    className="wf-select wf-select-grow"
                    value={picks[i] ?? ""}
                    onChange={(e) => setSlot(i, e.target.value)}
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
                  <span className="wf-cap">{picks[i] ? `${wcByName.get(picks[i]!) ?? 0} WC` : "—"}</span>
                </div>
              );
            })}
          </div>

          <div className="wf-actions">
            <button type="button" className="dash-ghost-btn" onClick={clearLineup}>
              Clear lineup
            </button>
          </div>

          <p className="dash-footnote">
            Structure: <strong>5</strong> main-event slates × <strong>6</strong> picks × <strong>100</strong> WakiCash per
            slate. Pool size here: <strong>{pool.length}</strong> players (featured slice of rankings). Server-backed saves
            and locks will wire up next.
          </p>
        </div>
      )}
    </div>
  );
}
