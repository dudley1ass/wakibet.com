import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  WSOP_FANTASY_CAPTAIN_MULTIPLIER,
  WSOP_FANTASY_ROSTER_SLOTS,
  WSOP_FANTASY_SOFT_LOCK_DAYS,
  computeLineupFreezeStatus,
  type LineupFreezePhase,
  type PokerWorldRankingRow,
} from "@wakibet/shared";
import { apiGet } from "../../../api";
import type { SessionUser } from "../../../App";
import { loadAllCaptains, loadAllPokerDrafts, wakicashForRank } from "./PokerPickPage";
import "../../../components/dashboard.css";

type Props = { user: SessionUser };

type WsopSlateView = {
  slate_key: string;
  title: string;
  start_date: string | null;
  end_date: string | null;
  start_time_pt: string | null;
};

type WsopCfg = {
  roster_slots: number;
  salary_cap_wakicash: number;
  featured_player_pool_max: number;
  captain_multiplier: number;
  soft_lock_days: number;
  soft_lock_max_swaps: number;
  tier1_slates: WsopSlateView[];
};

function phaseShortLabel(phase: LineupFreezePhase): string {
  if (phase === "open") return "Open";
  if (phase === "soft_lock") return "Soft lock";
  return "Lineup Freeze";
}

function phaseRowClass(phase: LineupFreezePhase): string {
  if (phase === "open") return "rost-phase rost-phase--open";
  if (phase === "soft_lock") return "rost-phase rost-phase--soft";
  return "rost-phase rost-phase--hard";
}

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
  const left = `${MONTHS_SHORT[ms - 1]} ${ds}`;
  const right = `${MONTHS_SHORT[me - 1]} ${de}`;
  if (ms === me && ys === ye) return `${MONTHS_SHORT[ms - 1]} ${ds}–${de}, ${ys}`;
  if (ys === ye) return `${left} – ${right}, ${ys}`;
  return `${left}, ${ys} – ${right}, ${ye}`;
}

type RankingsPayload = {
  players: PokerWorldRankingRow[];
};

export default function PokerRostersPage({ user }: Props) {
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
  const captainMultiplier = cfg?.captain_multiplier ?? WSOP_FANTASY_CAPTAIN_MULTIPLIER;
  const softLockDays = cfg?.soft_lock_days ?? WSOP_FANTASY_SOFT_LOCK_DAYS;

  const [drafts, setDrafts] = useState<Record<string, string[]>>({});
  const [captains, setCaptains] = useState<Record<string, number>>({});
  useEffect(() => {
    setDrafts(loadAllPokerDrafts());
    setCaptains(loadAllCaptains());
  }, []);

  const [now, setNow] = useState<Date>(() => new Date());
  useEffect(() => {
    const t = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(t);
  }, []);

  const wcByName = useMemo(() => {
    const rows = rankQ.data?.players ?? [];
    const pool = rows.slice(0, Math.min(poolMax, rows.length));
    const m = new Map<string, number>();
    const n = pool.length;
    for (const p of pool) m.set(p.player_name, wakicashForRank(p.rank, n));
    return m;
  }, [rankQ.data?.players, poolMax]);

  const slates = cfg?.tier1_slates ?? [];

  return (
    <div className="rost-shell">
      <header className="rost-head">
        <div>
          <h1 className="rost-title">My WSOP Rosters</h1>
          <p className="rost-sub">
            <strong>{user.display_name || user.email}</strong> — your six-player lineup for each of the 5 main WSOP events
          </p>
        </div>
        <div className="rost-actions">
          <Link className="dash-ghost-btn" to="/poker/leaderboard">
            Standings
          </Link>
          <Link className="dash-ghost-btn" to="/poker/scoring">
            Scoring table
          </Link>
          <Link className="dash-main-btn rost-dash-link" to="/">
            Dashboard
          </Link>
        </div>
      </header>

      {wsopQ.isLoading ? <p className="dash-loading">Loading WSOP events…</p> : null}
      {wsopQ.isError ? <p className="dash-error">Could not load WSOP fantasy configuration.</p> : null}

      <p className="dash-footnote" style={{ marginTop: 0 }}>
        <strong>Lineup Freeze:</strong> lineups remain editable through Day {softLockDays} — adapt to chip counts and survive
        the field. After Day {softLockDays}, rosters lock and standings become final-only. Captain pick earns a{" "}
        <strong>{captainMultiplier}×</strong> points multiplier.
      </p>

      {slates.length > 0 ? (
        <ul className="rost-list">
          {slates.map((slate) => {
            const picks = drafts[slate.slate_key] ?? [];
            const filled = picks.filter(Boolean);
            const totalSalary = filled.reduce((sum, name) => sum + (wcByName.get(name) ?? 0), 0);
            const hasPicks = filled.length > 0;
            const freeze = computeLineupFreezeStatus(slate, now);
            const captainIdx = captains[slate.slate_key];
            const captainName =
              typeof captainIdx === "number" && captainIdx >= 0 ? picks[captainIdx] ?? "" : "";
            return (
              <li key={slate.slate_key}>
                <article className="rost-card dash-card">
                  <div className="rost-card-head">
                    <div className="rost-card-head-main">
                      <div className="rost-tournament">{slate.title}</div>
                      <div className="rost-meta">
                        {formatSlateDateRange(slate.start_date, slate.end_date) ? (
                          <span className="rost-badge">
                            {formatSlateDateRange(slate.start_date, slate.end_date)}
                          </span>
                        ) : null}
                        {slate.start_time_pt ? (
                          <span className="rost-badge">{slate.start_time_pt}</span>
                        ) : null}
                        <span className={phaseRowClass(freeze.phase)}>{phaseShortLabel(freeze.phase)}</span>
                        <span className="rost-badge">
                          {hasPicks ? `${totalSalary}/${cap} WC` : `0/${cap} WC`}
                        </span>
                        <span className="rost-badge">
                          {filled.length}/{rosterSlots} picks
                        </span>
                        {captainName ? (
                          <span className="rost-badge rost-badge--captain" title="Captain (1.5× multiplier)">
                            ★ Captain · {captainName}
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <div>
                      <Link className="dash-ghost-btn" to="/poker/pick">
                        {freeze.phase === "hard_lock"
                          ? "View lineup"
                          : hasPicks
                            ? "Edit lineup"
                            : "Build lineup"}
                      </Link>
                    </div>
                  </div>
                  <div className="rost-players">
                    <span className="rost-players-label">Players</span>
                    {hasPicks ? (
                      <ol className="rost-pick-list">
                        {Array.from({ length: rosterSlots }, (_, i) => {
                          const name = picks[i] ?? "";
                          const wc = name ? wcByName.get(name) ?? 0 : 0;
                          const isCaptain = typeof captainIdx === "number" && i === captainIdx && !!name;
                          return (
                            <li
                              key={`${slate.slate_key}-${i}`}
                              className={`rost-pick-row${isCaptain ? " rost-pick-row--captain" : ""}`}
                            >
                              <span className="rost-slot">
                                #{i + 1}
                                {isCaptain ? <span className="wf-captain-star">★</span> : null}
                              </span>
                              <span className="rost-name">{name || "—"}</span>
                              <span className="rost-odds">{name ? `${wc} WC` : ""}</span>
                            </li>
                          );
                        })}
                      </ol>
                    ) : (
                      <p className="rost-empty-body">No picks yet for this event.</p>
                    )}
                  </div>
                </article>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
