import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { WSOP_FANTASY_ROSTER_SLOTS, type PokerWorldRankingRow } from "@wakibet/shared";
import { apiGet } from "../../../api";
import type { SessionUser } from "../../../App";
import { loadAllPokerDrafts, wakicashForRank } from "./PokerPickPage";
import "../../../components/dashboard.css";

type Props = { user: SessionUser };

type WsopCfg = {
  roster_slots: number;
  salary_cap_wakicash: number;
  featured_player_pool_max: number;
  tier1_slates: { slate_key: string; title: string }[];
};

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

  const [drafts, setDrafts] = useState<Record<string, string[]>>({});
  useEffect(() => {
    setDrafts(loadAllPokerDrafts());
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

      {slates.length > 0 ? (
        <ul className="rost-list">
          {slates.map((slate) => {
            const picks = drafts[slate.slate_key] ?? [];
            const filled = picks.filter(Boolean);
            const totalSalary = filled.reduce((sum, name) => sum + (wcByName.get(name) ?? 0), 0);
            const hasPicks = filled.length > 0;
            return (
              <li key={slate.slate_key}>
                <article className="rost-card dash-card">
                  <div className="rost-card-head">
                    <div className="rost-card-head-main">
                      <div className="rost-tournament">{slate.title}</div>
                      <div className="rost-meta">
                        <span className="rost-badge">{slate.slate_key}</span>
                        <span className="rost-badge">
                          {hasPicks ? `${totalSalary}/${cap} WC` : `0/${cap} WC`}
                        </span>
                        <span className="rost-badge">
                          {filled.length}/{rosterSlots} picks
                        </span>
                      </div>
                    </div>
                    <div>
                      <Link className="dash-ghost-btn" to="/poker/pick">
                        {hasPicks ? "Edit lineup" : "Build lineup"}
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
                          return (
                            <li key={`${slate.slate_key}-${i}`} className="rost-pick-row">
                              <span className="rost-slot">#{i + 1}</span>
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
