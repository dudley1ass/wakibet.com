import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  INVEST_WEEKLY_PICKEM_PICKS,
  INVEST_WEEKLY_PICKEM_STARTING_CASH_USD,
  type InvestWeeklyContestWindow,
} from "@wakibet/shared";
import { apiGet } from "../../../api";
import type { SessionUser } from "../../../App";
import "../../../components/dashboard.css";
import {
  loadAllInvestDrafts,
  pctToUsd,
  type InvestDraftsMap,
} from "../lib/investPortfolio";

type Props = { user: SessionUser };

type CurrentContestPayload = {
  sport: "invest";
  contest_type: "weekly_pickem";
  window: InvestWeeklyContestWindow;
};

type ServerPositionView = {
  symbol: string;
  allocation_pct: number;
  lock_price_usd: number | null;
  end_price_usd: number | null;
  current_price_usd: number | null;
};

type ServerPortfolioView = {
  contest_key: string;
  lock_at_iso: string;
  end_at_iso: string;
  is_locked: boolean;
  is_settled: boolean;
  starting_value_usd: number | null;
  ending_value_usd: number | null;
  live_return_pct: number | null;
  settled_return_pct: number | null;
  positions: ServerPositionView[];
  updated_at_iso: string;
};

type MyPortfoliosPayload = {
  sport: "invest";
  portfolios: ServerPortfolioView[];
  current_contest_key: string;
};

function formatReturnPct(n: number | null): string {
  if (n === null || !Number.isFinite(n)) return "—";
  const sign = n >= 0 ? "+" : "";
  return `${sign}${n.toFixed(2)}%`;
}

function statusBadge(p: ServerPortfolioView): string {
  if (p.is_settled) return "Settled";
  if (p.is_locked) return "Locked";
  return "Open";
}

export default function InvestPortfoliosPage({ user }: Props) {
  const contestQ = useQuery({
    queryKey: ["invest", "current-contest"] as const,
    queryFn: () => apiGet<CurrentContestPayload>("/api/v1/invest/current-contest"),
    staleTime: 60_000,
  });

  const myQ = useQuery({
    queryKey: ["invest", "my-portfolios"] as const,
    queryFn: () => apiGet<MyPortfoliosPayload>("/api/v1/invest/my-portfolios"),
    staleTime: 30_000,
    refetchInterval: 60_000,
    retry: 1,
  });

  const [drafts, setDrafts] = useState<InvestDraftsMap>({});
  useEffect(() => {
    setDrafts(loadAllInvestDrafts());
  }, []);

  const window = contestQ.data?.window ?? null;
  const serverPortfolios = myQ.data?.portfolios ?? [];
  const serverByKey = useMemo(() => {
    const m = new Map<string, ServerPortfolioView>();
    for (const p of serverPortfolios) m.set(p.contest_key, p);
    return m;
  }, [serverPortfolios]);

  const allContestKeys = useMemo(() => {
    const keys = new Set<string>(Object.keys(drafts));
    for (const p of serverPortfolios) keys.add(p.contest_key);
    if (window?.contest_key) keys.add(window.contest_key);
    return Array.from(keys).sort();
  }, [drafts, serverPortfolios, window]);

  return (
    <div className="rost-shell">
      <header className="rost-head">
        <div>
          <h1 className="rost-title">My Invest Portfolios</h1>
          <p className="rost-sub">
            <strong>{user.display_name || user.email}</strong> — your virtual{" "}
            {INVEST_WEEKLY_PICKEM_PICKS}-stock portfolios for each weekly pick&apos;em
          </p>
        </div>
        <div className="rost-actions">
          <Link className="dash-ghost-btn" to="/invest">
            Invest hub
          </Link>
          <Link className="dash-ghost-btn" to="/invest/pick">
            Build portfolio
          </Link>
          <Link className="dash-ghost-btn" to="/invest/leaderboard">
            Standings
          </Link>
          <Link className="dash-main-btn rost-dash-link" to="/">
            Dashboard
          </Link>
        </div>
      </header>

      {contestQ.isLoading || myQ.isLoading ? <p className="dash-loading">Loading weekly contest…</p> : null}
      {myQ.isError ? (
        <p className="dash-footnote">
          Couldn&rsquo;t load server-saved portfolios — showing local drafts only.
        </p>
      ) : null}

      <p className="dash-footnote" style={{ marginTop: 0 }}>
        Free stock-picking contest using virtual portfolios. ${INVEST_WEEKLY_PICKEM_STARTING_CASH_USD.toLocaleString()} in
        fake cash, locks Monday at market open, settles Friday at the closing bell.
      </p>

      {allContestKeys.length === 0 ? (
        <p className="rost-empty-body">No portfolios saved yet. Build your first weekly lineup.</p>
      ) : (
        <ul className="rost-list">
          {allContestKeys.map((key) => {
            const server = serverByKey.get(key);
            const draft = drafts[key];
            const isCurrent = window?.contest_key === key;
            const positions = server
              ? server.positions.map((p) => ({
                  symbol: p.symbol,
                  allocation_pct: p.allocation_pct,
                  current_price_usd: p.current_price_usd,
                  lock_price_usd: p.lock_price_usd,
                }))
              : (draft?.picks ?? [])
                  .filter((p) => p.symbol)
                  .map((p) => ({
                    symbol: p.symbol,
                    allocation_pct: p.allocation_pct,
                    current_price_usd: null as number | null,
                    lock_price_usd: null as number | null,
                  }));
            const totalPct = positions.reduce((s, p) => s + p.allocation_pct, 0);
            const hasPicks = positions.length > 0;
            const statusLabel = server ? statusBadge(server) : "Draft";
            const returnLabel = server
              ? server.is_settled
                ? formatReturnPct(server.settled_return_pct)
                : formatReturnPct(server.live_return_pct)
              : "—";
            const editLabel = server?.is_locked || server?.is_settled ? "View portfolio" : hasPicks ? "Edit portfolio" : "Build portfolio";

            return (
              <li key={key}>
                <article className="rost-card dash-card">
                  <div className="rost-card-head">
                    <div className="rost-card-head-main">
                      <div className="rost-tournament">
                        {isCurrent && window ? window.label : key}
                      </div>
                      <div className="rost-meta">
                        <span className="rost-badge">{key}</span>
                        {isCurrent ? <span className="rost-badge">Current</span> : null}
                        <span className={`rost-badge rost-phase rost-phase--${statusLabel.toLowerCase()}`}>
                          {statusLabel}
                        </span>
                        <span className="rost-badge">
                          {totalPct.toFixed(1)}% / 100%
                        </span>
                        <span className="rost-badge">
                          {positions.length}/{INVEST_WEEKLY_PICKEM_PICKS} picks
                        </span>
                        <span className="rost-badge">
                          Return {returnLabel}
                        </span>
                      </div>
                    </div>
                    <div>
                      <Link className="dash-ghost-btn" to="/invest/pick">
                        {editLabel}
                      </Link>
                    </div>
                  </div>
                  <div className="rost-players">
                    <span className="rost-players-label">Positions</span>
                    {hasPicks ? (
                      <ol className="rost-pick-list">
                        {positions.map((p, i) => (
                          <li key={`${key}-${p.symbol}-${i}`} className="rost-pick-row">
                            <span className="rost-slot">#{i + 1}</span>
                            <span className="rost-name">{p.symbol}</span>
                            <span className="rost-odds">
                              {p.allocation_pct}% · ~$
                              {pctToUsd(p.allocation_pct).toLocaleString()}
                              {p.lock_price_usd
                                ? ` · lock $${p.lock_price_usd.toFixed(2)}`
                                : ""}
                              {p.current_price_usd
                                ? ` · now $${p.current_price_usd.toFixed(2)}`
                                : ""}
                            </span>
                          </li>
                        ))}
                      </ol>
                    ) : (
                      <p className="rost-empty-body">No picks yet for this contest.</p>
                    )}
                  </div>
                </article>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
