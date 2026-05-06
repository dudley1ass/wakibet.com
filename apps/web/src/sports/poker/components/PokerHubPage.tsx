import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import type { PokerLiveTourEvent2026, PokerWorldRankingRow } from "@wakibet/shared";
import { apiGet } from "../../../api";
import type { SessionUser } from "../../../App";
import "../../../components/dashboard.css";

type SchedulePayload = {
  season_year: number;
  events: PokerLiveTourEvent2026[];
  generated_at: string;
};

type WorldRankingsPayload = {
  players: PokerWorldRankingRow[];
  generated_at: string;
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function fmtMonthDay(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return `${MONTHS[m - 1] ?? m} ${d}`;
}

function fmtRange(ev: PokerLiveTourEvent2026): string {
  const y0 = ev.start_date.slice(0, 4);
  const y1 = ev.end_date.slice(0, 4);
  const left = fmtMonthDay(ev.start_date);
  const right = fmtMonthDay(ev.end_date);
  if (y0 === y1) return `${left} – ${right}, ${y0}`;
  return `${left}, ${y0} – ${right}, ${y1}`;
}

type Props = {
  user: SessionUser | null;
};

function fmtRating(n: number): string {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function PokerHubPage({ user: _user }: Props) {
  const scheduleQ = useQuery({
    queryKey: ["poker", "schedule"] as const,
    queryFn: () => apiGet<SchedulePayload>("/api/v1/poker/schedule"),
    staleTime: 300_000,
  });

  const rankingsQ = useQuery({
    queryKey: ["poker", "world-rankings"] as const,
    queryFn: () => apiGet<WorldRankingsPayload>("/api/v1/poker/world-rankings"),
    staleTime: 300_000,
  });

  const rows = scheduleQ.data?.events ?? [];
  const rankingRows = rankingsQ.data?.players ?? [];

  const upcomingFirst = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return [...rows].sort((a, b) => {
      const aDone = a.end_date < today;
      const bDone = b.end_date < today;
      if (aDone !== bDone) return aDone ? 1 : -1;
      return a.start_date.localeCompare(b.start_date);
    });
  }, [rows]);

  return (
    <div className="dash-wrap" style={{ maxWidth: 1040 }}>
      <p className="dash-kicker">WakiBet · Poker fantasy</p>
      <h1 className="dash-title">Live tour calendar — 2026</h1>
      <p className="dash-sub" style={{ marginBottom: 16 }}>
        Planned contest stops plus the global player ranking table (top 200). WakiCash pricing and contest scoring will
        wire into these lists next.
      </p>

      <section className="dash-card" style={{ marginBottom: 16 }}>
        <h2 className="dash-card-title">Coming next</h2>
        <ul className="dash-list" style={{ margin: 0, paddingLeft: 18 }}>
          <li>WakiCash salaries and salary cap per event contest</li>
          <li>Scoring tied to published tour results</li>
          <li>Roster picks and leaderboards per stop</li>
        </ul>
      </section>

      <h2 className="dash-title" style={{ fontSize: "1.35rem", marginTop: 28, marginBottom: 8 }}>
        World rankings — top 200
      </h2>
      <p className="dash-sub" style={{ marginBottom: 12 }}>
        Composite rating index (higher is stronger). Same order as your supplied world list.
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

      <h2 className="dash-title" style={{ fontSize: "1.35rem", marginTop: 8, marginBottom: 8 }}>
        2026 live tour calendar
      </h2>

      {scheduleQ.isLoading ? (
        <p className="dash-loading">Loading schedule…</p>
      ) : scheduleQ.isError ? (
        <p style={{ color: "#fca5a5" }}>Could not load the poker schedule. Try again shortly.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table className="dash-table">
            <thead>
              <tr>
                <th>Dates</th>
                <th>Country</th>
                <th>Series</th>
                <th>Event</th>
                <th>City</th>
              </tr>
            </thead>
            <tbody>
              {upcomingFirst.map((ev) => (
                <tr key={ev.event_key}>
                  <td>{fmtRange(ev)}</td>
                  <td>{ev.country}</td>
                  <td>{ev.series_code}</td>
                  <td>
                    {ev.title}
                    {ev.tier === "major" ? (
                      <span style={{ marginLeft: 8, color: "#fcd34d", fontSize: 12 }}>★ major</span>
                    ) : null}
                  </td>
                  <td>{ev.city}</td>
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
