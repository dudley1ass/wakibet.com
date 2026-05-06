import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import type { PokerWorldRankingRow } from "@wakibet/shared";
import { apiGet } from "../../../api";
import type { SessionUser } from "../../../App";
import "../../../components/dashboard.css";

type WsopLeaderboardPlayerPayload = {
  wsop_rank: number;
  player_name: string;
  country: string;
  earnings_usd: number;
  bracelets: number;
  rings: number;
  cashes: number;
};

type WorldRankingsPayload = {
  players: PokerWorldRankingRow[];
  wsop_leaderboard_top_50: WsopLeaderboardPlayerPayload[];
  wsop_players_not_in_world_top_200: WsopLeaderboardPlayerPayload[];
  generated_at: string;
};

type WsopPayload = {
  focus: "wsop_las_vegas_2026";
  event_key: string;
  start_date: string;
  end_date: string;
  city: "Las Vegas";
  roster_slots: number;
  salary_cap_wakicash: number;
  featured_player_pool_min: number;
  featured_player_pool_max: number;
  tier1_slates: Array<{
    slate_key: string;
    title: string;
    tier: 1 | 2;
    always_featured: boolean;
    rationale: string;
  }>;
  tier2_slates: Array<{
    slate_key: string;
    title: string;
    tier: 1 | 2;
    always_featured: boolean;
    rationale: string;
  }>;
  scoring: Array<{ outcome_key: string; label: string; points: number }>;
  pool_inclusion_notes: string[];
  post_launch_bonus_ideas: string[];
  generated_at: string;
};

type Props = {
  user: SessionUser | null;
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function fmtIsoRange(start: string, end: string): string {
  const [ys, ms, ds] = start.split("-").map(Number);
  const [ye, me, de] = end.split("-").map(Number);
  if (!ys || !ms || !ds || !ye || !me || !de) return `${start} – ${end}`;
  const left = `${MONTHS[ms - 1]} ${ds}`;
  const right = `${MONTHS[me - 1]} ${de}`;
  if (ys === ye) return `${left} – ${right}, ${ys}`;
  return `${left}, ${ys} – ${right}, ${ye}`;
}

function fmtRating(n: number): string {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtUsd(n: number): string {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

export default function PokerHubPage({ user: _user }: Props) {
  const wsopQ = useQuery({
    queryKey: ["poker", "wsop-2026"] as const,
    queryFn: () => apiGet<WsopPayload>("/api/v1/poker/wsop-2026"),
    staleTime: 300_000,
  });

  const rankingsQ = useQuery({
    queryKey: ["poker", "world-rankings"] as const,
    queryFn: () => apiGet<WorldRankingsPayload>("/api/v1/poker/world-rankings"),
    staleTime: 300_000,
  });

  const rankingRows = rankingsQ.data?.players ?? [];
  const wsopBoard = rankingsQ.data?.wsop_leaderboard_top_50 ?? [];
  const wsopOnlyBoard = rankingsQ.data?.wsop_players_not_in_world_top_200 ?? [];
  const cfg = wsopQ.data;

  return (
    <div className="dash-wrap" style={{ maxWidth: 1040 }}>
      <p className="dash-kicker">WakiBet · Poker fantasy</p>
      <h1 className="dash-title">WSOP Las Vegas 2026</h1>
      <p className="dash-sub" style={{ marginBottom: 12 }}>
        Launch focus is <strong>only</strong> the World Series of Poker in Las Vegas (
        {cfg ? fmtIsoRange(cfg.start_date, cfg.end_date) : "May 26 – Jul 15, 2026"}). Other tours stay out of scope for
        now — lineup building stays simple and emotional, not spreadsheet simulator poker.
      </p>

      {wsopQ.isLoading ? (
        <p className="dash-loading">Loading WSOP fantasy rules…</p>
      ) : wsopQ.isError || !cfg ? (
        <p style={{ color: "#fca5a5", marginBottom: 24 }}>Could not load WSOP fantasy configuration.</p>
      ) : (
        <>
          <section className="dash-card" style={{ marginBottom: 16 }}>
            <h2 className="dash-card-title">How each slate works (launch)</h2>
            <ul className="dash-list" style={{ margin: 0, paddingLeft: 18 }}>
              <li>
                <strong>{cfg.roster_slots} players</strong> per lineup — enough strategy without overwhelming casual fans.
              </li>
              <li>
                <strong>{cfg.salary_cap_wakicash} WakiCash</strong> salary cap per lineup (same tension as example:
                stars + value + wildcard).
              </li>
              <li>
                Featured pool targets <strong>{cfg.featured_player_pool_min}–{cfg.featured_player_pool_max}</strong>{" "}
                names per slate — not the entire WSOP field.
              </li>
            </ul>
          </section>

          <h2 className="dash-title" style={{ fontSize: "1.35rem", marginTop: 20, marginBottom: 8 }}>
            Tier 1 — flagship fantasy events (always featured)
          </h2>
          <p className="dash-sub" style={{ marginBottom: 12 }}>
            Product default: these slates stay front-and-center — main attraction energy (Super Bowl / Masters-level for
            poker fantasy).
          </p>
          <ul className="dash-list" style={{ marginBottom: 24, paddingLeft: 18 }}>
            {cfg.tier1_slates.map((s) => (
              <li key={s.slate_key}>
                <strong>{s.title}</strong> — {s.rationale}
              </li>
            ))}
          </ul>

          <h2 className="dash-title" style={{ fontSize: "1.35rem", marginTop: 8, marginBottom: 8 }}>
            Tier 2 — elite pro slates
          </h2>
          <p className="dash-sub" style={{ marginBottom: 12 }}>
            Built for hardcore fans: rankings debates, “who’s elite?”, championship-level narratives.
          </p>
          <ul className="dash-list" style={{ marginBottom: 24, paddingLeft: 18 }}>
            {cfg.tier2_slates.map((s) => (
              <li key={s.slate_key}>
                <strong>{s.title}</strong> — {s.rationale}
              </li>
            ))}
          </ul>

          <section className="dash-card" style={{ marginBottom: 16 }}>
            <h2 className="dash-card-title">Example roster shape (100 WakiCash)</h2>
            <p className="dash-sub" style={{ marginTop: 0 }}>
              Illustrative salaries — real prices ship with each slate’s pool.
            </p>
            <table className="dash-table">
              <thead>
                <tr>
                  <th>Role</th>
                  <th>WakiCash</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Star</td>
                  <td>28</td>
                </tr>
                <tr>
                  <td>Star</td>
                  <td>24</td>
                </tr>
                <tr>
                  <td>Secondary</td>
                  <td>18</td>
                </tr>
                <tr>
                  <td>Sleeper</td>
                  <td>12</td>
                </tr>
                <tr>
                  <td>Value grinder</td>
                  <td>10</td>
                </tr>
                <tr>
                  <td>Wildcard</td>
                  <td>8</td>
                </tr>
              </tbody>
            </table>
            <p className="dash-sub" style={{ marginBottom: 0 }}>
              Total: 100 — fantasy tension without spreadsheet overload.
            </p>
          </section>

          <h2 className="dash-title" style={{ fontSize: "1.35rem", marginTop: 8, marginBottom: 8 }}>
            Scoring (simple — launch)
          </h2>
          <div style={{ overflowX: "auto", marginBottom: 16 }}>
            <table className="dash-table">
              <thead>
                <tr>
                  <th>Result</th>
                  <th>Points</th>
                </tr>
              </thead>
              <tbody>
                {cfg.scoring.map((row) => (
                  <tr key={row.outcome_key}>
                    <td>{row.label}</td>
                    <td>{row.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="dash-sub" style={{ marginBottom: 24 }}>
            Captain multipliers, ownership %, and heater bonuses stay <strong>post-launch</strong> — keep v1 readable and
            dramatic.
          </p>

          <section className="dash-card" style={{ marginBottom: 16 }}>
            <h2 className="dash-card-title">Featured pool curation</h2>
            <ul className="dash-list" style={{ margin: 0, paddingLeft: 18 }}>
              {cfg.pool_inclusion_notes.map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
          </section>

          <section className="dash-card" style={{ marginBottom: 24 }}>
            <h2 className="dash-card-title">Post-launch bonus ideas (not in v1)</h2>
            <ul className="dash-list" style={{ margin: 0, paddingLeft: 18 }}>
              {cfg.post_launch_bonus_ideas.map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
          </section>
        </>
      )}

      <h2 className="dash-title" style={{ fontSize: "1.35rem", marginTop: 8, marginBottom: 8 }}>
        WSOP.com-style leaderboard (top 50)
      </h2>
      <p className="dash-sub" style={{ marginBottom: 12 }}>
        Snapshot from the WSOP site’s earnings-driven board — not the same methodology as the global composite index
        below.{" "}
        <Link to="/articles/poker-which-poker-ranking-is-real">Why lists disagree →</Link>
      </p>
      {rankingsQ.isLoading ? (
        <p className="dash-loading">Loading leaderboard…</p>
      ) : rankingsQ.isError ? (
        <p style={{ color: "#fca5a5", marginBottom: 24 }}>Could not load WSOP leaderboard data.</p>
      ) : (
        <div style={{ overflowX: "auto", maxHeight: 360, overflowY: "auto", marginBottom: 24 }}>
          <table className="dash-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Player</th>
                <th>Country</th>
                <th>Earnings</th>
                <th>B / R / Cashes</th>
              </tr>
            </thead>
            <tbody>
              {wsopBoard.map((p) => (
                <tr key={`wsop-${p.wsop_rank}-${p.player_name}`}>
                  <td>{p.wsop_rank}</td>
                  <td>{p.player_name}</td>
                  <td>{p.country}</td>
                  <td>{fmtUsd(p.earnings_usd)}</td>
                  <td>
                    {p.bracelets} / {p.rings} / {p.cashes}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h2 className="dash-title" style={{ fontSize: "1.35rem", marginTop: 8, marginBottom: 8 }}>
        On the WSOP board but not on our global top 200
      </h2>
      <p className="dash-sub" style={{ marginBottom: 12 }}>
        Names from the WSOP top 50 that did not match the composite global list (after spelling matching). Use this as a
        supplement when building featured pools.
      </p>
      {rankingsQ.isLoading ? null : rankingsQ.isError ? null : wsopOnlyBoard.length === 0 ? (
        <p className="dash-sub" style={{ marginBottom: 24 }}>No extra rows — everyone on the WSOP board overlapped.</p>
      ) : (
        <div style={{ overflowX: "auto", maxHeight: 320, overflowY: "auto", marginBottom: 24 }}>
          <table className="dash-table">
            <thead>
              <tr>
                <th>WSOP #</th>
                <th>Player</th>
                <th>Country</th>
                <th>Earnings</th>
              </tr>
            </thead>
            <tbody>
              {wsopOnlyBoard.map((p) => (
                <tr key={`only-${p.wsop_rank}-${p.player_name}`}>
                  <td>{p.wsop_rank}</td>
                  <td>{p.player_name}</td>
                  <td>{p.country}</td>
                  <td>{fmtUsd(p.earnings_usd)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <section className="dash-card" style={{ marginBottom: 24 }}>
        <h2 className="dash-card-title">Reading the numbers</h2>
        <p className="dash-sub" style={{ marginTop: 0 }}>
          <Link to="/articles/poker-which-poker-ranking-is-real">Which poker ranking list is “real”?</Link>
          {" — GPI-style indexes, Hendon data, WSOP earnings boards, and what fantasy should care about."}
        </p>
        <p className="dash-sub" style={{ marginBottom: 0 }}>
          <Link to="/articles/poker-wsop-leaderboard-vs-featured-pools">
            Why the WSOP leaderboard is not your fantasy player pool
          </Link>
          {" — turning site boards into WakiBet’s 50–150 featured lists."}
        </p>
      </section>

      <h2 className="dash-title" style={{ fontSize: "1.35rem", marginTop: 8, marginBottom: 8 }}>
        Global rankings reference (top 200)
      </h2>
      <p className="dash-sub" style={{ marginBottom: 12 }}>
        Separate composite index — WSOP featured pools will narrow to {cfg?.featured_player_pool_min ?? 50}–
        {cfg?.featured_player_pool_max ?? 150} players per slate, blending these ratings with site boards, qualifiers,
        and storylines.
      </p>
      {rankingsQ.isLoading ? (
        <p className="dash-loading">Loading rankings…</p>
      ) : rankingsQ.isError ? (
        <p style={{ color: "#fca5a5", marginBottom: 24 }}>Could not load player rankings.</p>
      ) : (
        <div style={{ overflowX: "auto", maxHeight: 420, overflowY: "auto", marginBottom: 28 }}>
          <table className="dash-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Country</th>
                <th>Player</th>
                <th>Rating</th>
              </tr>
            </thead>
            <tbody>
              {rankingRows.map((p) => (
                <tr key={`${p.rank}-${p.player_name}`}>
                  <td>{p.rank}</td>
                  <td>{p.country}</td>
                  <td>{p.player_name}</td>
                  <td>{fmtRating(p.rating)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="dash-sub" style={{ marginTop: 20 }}>
        <Link to="/">← Back to home</Link>
        {" · "}
        <span style={{ color: "#94a3b8" }}>
          Fantasy entertainment only — no real-money wagering on WakiBet.
        </span>
      </p>
    </div>
  );
}
