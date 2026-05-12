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

export default function InvestPortfoliosPage({ user }: Props) {
  const contestQ = useQuery({
    queryKey: ["invest", "current-contest"] as const,
    queryFn: () => apiGet<CurrentContestPayload>("/api/v1/invest/current-contest"),
    staleTime: 60_000,
  });

  const [drafts, setDrafts] = useState<InvestDraftsMap>({});
  useEffect(() => {
    setDrafts(loadAllInvestDrafts());
  }, []);

  const window = contestQ.data?.window ?? null;
  const allContestKeys = useMemo(() => {
    const keys = new Set<string>(Object.keys(drafts));
    if (window?.contest_key) keys.add(window.contest_key);
    return Array.from(keys).sort();
  }, [drafts, window]);

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

      {contestQ.isLoading ? <p className="dash-loading">Loading weekly contest…</p> : null}

      <p className="dash-footnote" style={{ marginTop: 0 }}>
        Free stock-picking contest using virtual portfolios. ${INVEST_WEEKLY_PICKEM_STARTING_CASH_USD.toLocaleString()} in
        fake cash, locks Monday at market open, settles Friday at the closing bell.
      </p>

      {allContestKeys.length === 0 ? (
        <p className="rost-empty-body">No portfolios saved yet. Build your first weekly lineup.</p>
      ) : (
        <ul className="rost-list">
          {allContestKeys.map((key) => {
            const draft = drafts[key];
            const picks = draft?.picks ?? [];
            const filled = picks.filter((p) => p.symbol);
            const totalPct = filled.reduce((s, p) => s + p.allocation_pct, 0);
            const hasPicks = filled.length > 0;
            const isCurrent = window?.contest_key === key;
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
                        <span className="rost-badge">
                          {totalPct.toFixed(1)}% / 100%
                        </span>
                        <span className="rost-badge">
                          {filled.length}/{INVEST_WEEKLY_PICKEM_PICKS} picks
                        </span>
                      </div>
                    </div>
                    <div>
                      <Link className="dash-ghost-btn" to="/invest/pick">
                        {hasPicks ? "Edit portfolio" : "Build portfolio"}
                      </Link>
                    </div>
                  </div>
                  <div className="rost-players">
                    <span className="rost-players-label">Positions</span>
                    {hasPicks ? (
                      <ol className="rost-pick-list">
                        {filled.map((p, i) => (
                          <li key={`${key}-${p.symbol}-${i}`} className="rost-pick-row">
                            <span className="rost-slot">#{i + 1}</span>
                            <span className="rost-name">{p.symbol}</span>
                            <span className="rost-odds">
                              {p.allocation_pct}% · ~$
                              {pctToUsd(p.allocation_pct).toLocaleString()}
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
