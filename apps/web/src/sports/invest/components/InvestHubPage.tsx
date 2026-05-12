import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  INVEST_WEEKLY_PICKEM_PICKS,
  INVEST_WEEKLY_PICKEM_STARTING_CASH_USD,
  INVEST_WEEKLY_PICKEM_MAX_POSITION_PCT,
  type InvestEligibleAsset,
  type InvestWeeklyContestWindow,
  type WeeklyPickemRulesView,
} from "@wakibet/shared";
import { apiGet } from "../../../api";
import type { SessionUser } from "../../../App";
import "../../../components/dashboard.css";

type Props = { user: SessionUser };

type CurrentContestPayload = {
  sport: "invest";
  contest_type: "weekly_pickem";
  window: InvestWeeklyContestWindow;
  rules: WeeklyPickemRulesView;
  disclaimer: string;
};

type FinnhubQuoteView = {
  symbol: string;
  current_price: number | null;
  change_pct: number | null;
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

function formatIsoUtcAsEt(iso: string): string {
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return iso;
  // Approximate ET (UTC-4 during DST, May–Nov). For display only.
  const et = new Date(dt.getTime() - 4 * 3_600_000);
  const months = [
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
  let hh = et.getUTCHours();
  const mm = String(et.getUTCMinutes()).padStart(2, "0");
  const ampm = hh >= 12 ? "PM" : "AM";
  hh = hh % 12 === 0 ? 12 : hh % 12;
  return `${months[et.getUTCMonth()]} ${et.getUTCDate()} · ${hh}:${mm} ${ampm} ET`;
}

export default function InvestHubPage({ user }: Props) {
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
  const universe = universeQ.data;
  const quoteBySymbol = new Map<string, FinnhubQuoteView>();
  for (const q of universe?.quotes ?? []) quoteBySymbol.set(q.symbol.toUpperCase(), q);

  return (
    <div className="pick-teams-shell">
      <header className="pick-teams-head">
        <div>
          <h1 className="pick-teams-title">Invest — Weekly Stock Pick&apos;em</h1>
          <p className="pick-teams-sub">
            Build a virtual portfolio with <strong>${INVEST_WEEKLY_PICKEM_STARTING_CASH_USD.toLocaleString()}</strong> in fake
            cash. Pick <strong>{INVEST_WEEKLY_PICKEM_PICKS} stocks</strong>, lock at market open Monday, settle at the closing
            bell Friday. Signed in as <strong>{user.display_name || user.email}</strong>.
          </p>
        </div>
        <div className="dash-head-actions">
          <Link className="dash-ghost-btn" to="/invest/pick">
            Build portfolio
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

      {contestQ.isLoading ? <p className="dash-loading">Loading weekly contest…</p> : null}
      {contestQ.isError ? <p className="dash-error">Could not load the weekly contest.</p> : null}

      {contest ? (
        <div className="dash-card wf-section wf-section--page">
          <div className="wf-page-hero">
            <div className="wf-page-hero-kicker">{contest.window.label}</div>
            <p className="wf-page-lead">
              <strong>Lock:</strong> {formatIsoUtcAsEt(contest.window.lock_at_iso)} ·{" "}
              <strong>Settle:</strong> {formatIsoUtcAsEt(contest.window.end_at_iso)}. Highest portfolio return wins. Free to
              play — virtual portfolios only, no real money is invested.
            </p>
          </div>

          <ul className="rost-list">
            <li>
              <article className="rost-card dash-card">
                <div className="rost-card-head">
                  <div className="rost-card-head-main">
                    <div className="rost-tournament">Contest rules</div>
                    <div className="rost-meta">
                      <span className="rost-badge">{contest.rules.picks} picks</span>
                      <span className="rost-badge">
                        ${contest.rules.starting_cash_usd.toLocaleString()} virtual
                      </span>
                      <span className="rost-badge">{contest.rules.starting_wakicash} WC</span>
                      <span className="rost-badge">≤ {INVEST_WEEKLY_PICKEM_MAX_POSITION_PCT}% / stock</span>
                      <span className="rost-badge">min ${contest.rules.min_share_price_usd}/share</span>
                    </div>
                  </div>
                  <div>
                    <Link className="dash-ghost-btn" to="/invest/pick">
                      Build lineup
                    </Link>
                  </div>
                </div>
                <p className="dash-footnote" style={{ marginTop: 8 }}>
                  Allowed: {contest.rules.allowed_asset_types.join(" + ")}. Excluded:{" "}
                  {contest.rules.excluded.join(", ")}.
                </p>
              </article>
            </li>
          </ul>
        </div>
      ) : null}

      {universe ? (
        <div className="dash-card wf-section wf-section--page" style={{ marginTop: 12 }}>
          <div className="wf-page-hero">
            <div className="wf-page-hero-kicker">Eligible universe (starter)</div>
            <p className="wf-page-lead">
              {universe.assets.length} curated names ({universe.assets.filter((a) => a.asset_type === "stock").length} stocks
              + {universe.assets.filter((a) => a.asset_type === "etf").length} ETFs).{" "}
              <em>{universe.note}</em>
            </p>
          </div>
          <ul className="rost-list">
            {Array.from(new Set(universe.assets.map((a) => a.sector))).map((sector) => {
              const inSector = universe.assets.filter((a) => a.sector === sector);
              return (
                <li key={sector}>
                  <article className="rost-card dash-card">
                    <div className="rost-card-head">
                      <div className="rost-card-head-main">
                        <div className="rost-tournament">{sector}</div>
                        <div className="rost-meta">
                          <span className="rost-badge">{inSector.length} symbols</span>
                        </div>
                      </div>
                    </div>
                    <ul className="rost-pick-list" style={{ marginTop: 8 }}>
                      {inSector.map((a) => {
                        const q = quoteBySymbol.get(a.symbol.toUpperCase());
                        const chg = q?.change_pct ?? null;
                        return (
                          <li key={a.symbol} className="rost-pick-row">
                            <span className="rost-slot">{a.symbol}</span>
                            <span className="rost-name">{a.name}</span>
                            <span className="rost-odds">
                              {formatPriceUsd(q?.current_price ?? null)}
                              {chg !== null ? (
                                <span
                                  style={{
                                    marginLeft: 8,
                                    color: chg >= 0 ? "#86efac" : "#fca5a5",
                                    fontSize: 11,
                                  }}
                                >
                                  {formatChangePct(chg)}
                                </span>
                              ) : null}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </article>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      <p className="dash-footnote">
        {universe?.data_source.available
          ? "Live quotes from Finnhub · refreshed every 60s. Free stock-picking contest using virtual portfolios. No real money is invested. Not investment advice."
          : "Live quotes unavailable — set FINNHUB_API_KEY on the API server to enable real-time pricing. Free stock-picking contest using virtual portfolios. No real money is invested. Not investment advice."}
      </p>
    </div>
  );
}
