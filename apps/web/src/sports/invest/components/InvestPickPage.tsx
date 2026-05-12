import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  INVEST_WEEKLY_PICKEM_MAX_POSITION_PCT,
  INVEST_WEEKLY_PICKEM_PICKS,
  INVEST_WEEKLY_PICKEM_STARTING_CASH_USD,
  type InvestEligibleAsset,
  type InvestWeeklyContestWindow,
  type WeeklyPickemRulesView,
} from "@wakibet/shared";
import { apiGet } from "../../../api";
import type { SessionUser } from "../../../App";
import "../../../components/dashboard.css";
import {
  anyOverMaxPosition,
  emptyInvestPicks,
  loadAllInvestDrafts,
  loadLastInvestContest,
  pctToUsd,
  saveLastInvestContest,
  setContestDraft,
  totalAllocationPct,
  type InvestPick,
} from "../lib/investPortfolio";

type Props = { user: SessionUser };

type CurrentContestPayload = {
  sport: "invest";
  contest_type: "weekly_pickem";
  window: InvestWeeklyContestWindow;
  rules: WeeklyPickemRulesView;
};

type FinnhubQuoteView = {
  symbol: string;
  current_price: number | null;
  open_price: number | null;
  previous_close: number | null;
  change_abs: number | null;
  change_pct: number | null;
  source_ts: number | null;
  available: boolean;
};

type UniversePayload = {
  sport: "invest";
  assets: InvestEligibleAsset[];
  quotes: FinnhubQuoteView[] | null;
  data_source: { provider: "finnhub"; available: boolean };
  note: string;
};

function formatPriceUsd(n: number | null | undefined): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return "—";
  return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatChangePct(n: number | null | undefined): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return "";
  const sign = n >= 0 ? "+" : "";
  return `${sign}${n.toFixed(2)}%`;
}

export default function InvestPickPage({ user }: Props) {
  const contestQ = useQuery({
    queryKey: ["invest", "current-contest"] as const,
    queryFn: () => apiGet<CurrentContestPayload>("/api/v1/invest/current-contest"),
    staleTime: 60_000,
  });

  const universeQ = useQuery({
    queryKey: ["invest", "universe", "with-quotes"] as const,
    queryFn: () => apiGet<UniversePayload>("/api/v1/invest/universe?with_quotes=true"),
    staleTime: 60_000,
    refetchInterval: 60_000,
  });

  const contest = contestQ.data;
  const universe = useMemo(() => universeQ.data?.assets ?? [], [universeQ.data?.assets]);
  const quotes = useMemo(() => universeQ.data?.quotes ?? null, [universeQ.data?.quotes]);
  const liveDataAvailable = universeQ.data?.data_source.available ?? false;
  const quoteBySymbol = useMemo(() => {
    const m = new Map<string, FinnhubQuoteView>();
    if (quotes) for (const q of quotes) m.set(q.symbol.toUpperCase(), q);
    return m;
  }, [quotes]);
  const rosterSize = contest?.rules.picks ?? INVEST_WEEKLY_PICKEM_PICKS;

  const hydratedRef = useRef(false);
  const [contestKey, setContestKey] = useState("");
  const [picks, setPicks] = useState<InvestPick[]>(() => emptyInvestPicks());
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useEffect(() => {
    if (!contest || hydratedRef.current) return;
    hydratedRef.current = true;
    const key = contest.window.contest_key;
    const last = loadLastInvestContest();
    const useKey = last && last === key ? last : key;
    setContestKey(useKey);
    const all = loadAllInvestDrafts();
    const existing = all[useKey]?.picks ?? [];
    setPicks(
      existing.length === rosterSize ? existing : emptyInvestPicks(rosterSize),
    );
  }, [contest, rosterSize]);

  useEffect(() => {
    if (!hydratedRef.current || !contestKey) return;
    setContestDraft(contestKey, { picks });
    saveLastInvestContest(contestKey);
  }, [contestKey, picks]);

  const setSymbol = useCallback((idx: number, symbol: string) => {
    setPicks((prev) => {
      const next = prev.slice();
      next[idx] = { ...next[idx]!, symbol };
      return next;
    });
  }, []);

  const setAllocation = useCallback((idx: number, allocation_pct: number) => {
    setPicks((prev) => {
      const next = prev.slice();
      next[idx] = { ...next[idx]!, allocation_pct };
      return next;
    });
  }, []);

  const clearLineup = useCallback(() => {
    setPicks(emptyInvestPicks(rosterSize));
    setSavedAt(null);
  }, [rosterSize]);

  const saveLineup = useCallback(() => {
    if (!contestKey) return;
    setContestDraft(contestKey, { picks });
    saveLastInvestContest(contestKey);
    setSavedAt(Date.now());
  }, [contestKey, picks]);

  const totalPct = totalAllocationPct(picks);
  const overMaxPosition = anyOverMaxPosition(picks);
  const overAllocated = totalPct > 100.0001;
  const filledCount = picks.filter((p) => p.symbol).length;
  const dup = useMemo(() => {
    const used = picks.map((p) => p.symbol).filter(Boolean);
    return used.length !== new Set(used).size;
  }, [picks]);

  const canSave = filledCount > 0 && !overAllocated && !overMaxPosition && !dup;

  const symbolsAvailable = useMemo(() => {
    const taken = new Set(picks.map((p) => p.symbol).filter(Boolean));
    return (selfSymbol: string) => universe.filter((a) => !taken.has(a.symbol) || a.symbol === selfSymbol);
  }, [picks, universe]);

  return (
    <div className="pick-teams-shell">
      <header className="pick-teams-head">
        <div>
          <h1 className="pick-teams-title">Invest — build your weekly portfolio</h1>
          <p className="pick-teams-sub">
            <strong>{rosterSize} picks</strong>, <strong>${INVEST_WEEKLY_PICKEM_STARTING_CASH_USD.toLocaleString()}</strong> in
            virtual cash, max <strong>{INVEST_WEEKLY_PICKEM_MAX_POSITION_PCT}%</strong> per position — signed in as{" "}
            <strong>{user.display_name || user.email}</strong>
          </p>
        </div>
        <div className="dash-head-actions">
          <Link className="dash-ghost-btn" to="/invest">
            Invest hub
          </Link>
          <Link className="dash-ghost-btn" to="/invest/portfolios">
            My portfolios
          </Link>
          <Link className="dash-ghost-btn" to="/invest/leaderboard">
            Standings
          </Link>
          <Link className="dash-ghost-btn" to="/invest/scoring">
            Scoring table
          </Link>
          <Link className="dash-ghost-btn" to="/">
            Back to dashboard
          </Link>
        </div>
      </header>

      {contestQ.isLoading || universeQ.isLoading ? (
        <p className="dash-loading">Loading weekly contest…</p>
      ) : contestQ.isError || !contest ? (
        <p className="dash-error">Could not load the weekly contest.</p>
      ) : universeQ.isError ? (
        <p className="dash-error">Could not load eligible universe.</p>
      ) : (
        <div className="dash-card wf-section wf-section--page">
          <div className="wf-page-hero">
            <div className="wf-page-hero-kicker">{contest.window.label}</div>
            <p className="wf-page-lead">
              Allocate up to 100% of your virtual portfolio across {rosterSize} positions. Highest weekly return wins.
            </p>
          </div>

          <div className="poker-wakicash-hero dash-card">
            <div className="poker-wakicash-hero__label">Allocation left</div>
            <div
              className="poker-wakicash-hero__value"
              style={{ color: overAllocated ? "#fca5a5" : undefined }}
            >
              {(100 - totalPct).toFixed(1)}%
            </div>
            <div className="poker-wakicash-hero__meta">
              <span>
                of <strong>100%</strong> cap
              </span>
              <span>
                allocated <strong>{totalPct.toFixed(1)}%</strong>
              </span>
              <span>
                picks <strong>{filledCount}</strong> / {rosterSize}
              </span>
            </div>
          </div>

          {overAllocated ? (
            <p className="dash-error">Allocation exceeds 100% — trim a position.</p>
          ) : null}
          {overMaxPosition ? (
            <p className="dash-error">
              One position exceeds the {INVEST_WEEKLY_PICKEM_MAX_POSITION_PCT}% concentration cap.
            </p>
          ) : null}
          {dup ? <p className="dash-error">Duplicate symbols — each slot needs a different ticker.</p> : null}

          <div className="wf-picks">
            {picks.map((pick, i) => {
              const options = symbolsAvailable(pick.symbol);
              const q = pick.symbol ? quoteBySymbol.get(pick.symbol.toUpperCase()) : undefined;
              const price = q?.current_price ?? null;
              const dollars = pctToUsd(pick.allocation_pct);
              const shares = price && price > 0 ? dollars / price : null;
              return (
                <div key={i} className="wf-pick-row">
                  <span className="wf-slot">Pick {i + 1}</span>
                  <select
                    className="wf-select wf-select-grow"
                    value={pick.symbol}
                    onChange={(e) => setSymbol(i, e.target.value)}
                  >
                    <option value="">— Select stock or ETF —</option>
                    {options.map((a) => {
                      const qq = quoteBySymbol.get(a.symbol.toUpperCase());
                      const priceLabel = qq?.current_price ? ` · ${formatPriceUsd(qq.current_price)}` : "";
                      const chgLabel = qq?.change_pct !== null && qq?.change_pct !== undefined
                        ? ` (${formatChangePct(qq.change_pct)})`
                        : "";
                      return (
                        <option key={a.symbol} value={a.symbol}>
                          {a.symbol} — {a.name} ({a.asset_type.toUpperCase()})
                          {priceLabel}
                          {chgLabel}
                        </option>
                      );
                    })}
                  </select>
                  <label className="wf-cap" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                    <input
                      type="number"
                      className="wf-select"
                      style={{ width: 70 }}
                      min={0}
                      max={INVEST_WEEKLY_PICKEM_MAX_POSITION_PCT}
                      step={1}
                      value={Number.isFinite(pick.allocation_pct) ? pick.allocation_pct : 0}
                      onChange={(e) => setAllocation(i, Math.max(0, Number(e.target.value) || 0))}
                      disabled={!pick.symbol}
                    />
                    <span>%</span>
                  </label>
                  <span className="wf-cap" style={{ minWidth: 92 }}>
                    {pick.symbol ? formatPriceUsd(price) : "—"}
                    {pick.symbol && q && q.change_pct !== null ? (
                      <span
                        style={{
                          marginLeft: 6,
                          color: (q.change_pct ?? 0) >= 0 ? "#86efac" : "#fca5a5",
                          fontSize: 11,
                        }}
                      >
                        {formatChangePct(q.change_pct)}
                      </span>
                    ) : null}
                  </span>
                  <span className="wf-cap">
                    {pick.symbol ? `~$${dollars.toLocaleString()}` : "—"}
                    {shares !== null ? (
                      <span style={{ marginLeft: 6, opacity: 0.7, fontSize: 11 }}>
                        ≈ {shares.toFixed(2)} sh
                      </span>
                    ) : null}
                  </span>
                </div>
              );
            })}
          </div>

          <p className="dash-footnote">
            {liveDataAvailable
              ? `Live quotes from Finnhub · refreshed every 60s.${quotes ? "" : " Loading…"}`
              : "Live quotes unavailable — set FINNHUB_API_KEY on the API server to enable real-time pricing."}
          </p>

          <div className="wf-actions">
            <button
              type="button"
              className="dash-main-btn"
              onClick={saveLineup}
              disabled={!canSave}
            >
              Save portfolio
            </button>
            <button type="button" className="dash-ghost-btn" onClick={clearLineup}>
              Clear portfolio
            </button>
            <Link className="dash-ghost-btn" to="/invest/portfolios">
              My portfolios
            </Link>
            {savedAt ? <span className="dash-footnote">Saved.</span> : null}
          </div>

          <p className="dash-footnote">
            Drafts are saved in this browser until server-backed contests ship. Final scoring uses official close prices —
            virtual portfolios only, no real money is invested.
          </p>
        </div>
      )}
    </div>
  );
}
