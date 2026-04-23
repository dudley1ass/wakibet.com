import { useEffect, useMemo, useState } from "react";
import type { SessionUser } from "../App";
import type { DashboardData } from "./Dashboard";
import { useDashboardDataRequired } from "../context/DashboardDataContext";
import "./app-floating-corner.css";

const JOKES = [
  "Why did the paddle go to therapy? Too much backspin on its feelings.",
  "I asked my fantasy lineup for advice. It ghosted me until match day.",
  "Parallel lines have so much in common. It’s a shame they’ll never meet — unlike you and the leaderboard.",
];

function firstName(user: SessionUser): string {
  const d = user.display_name?.trim();
  if (d) return d.split(/\s+/)[0] ?? d;
  return user.email.split("@")[0] ?? "there";
}

function hostLines(user: SessionUser, path: string, preview: DashboardData | null): string[] {
  const name = firstName(user);
  const hr = new Date().getHours();
  const greet =
    hr < 12 ? `Morning, ${name} — how are you today?` : hr < 17 ? `Hey ${name}, good afternoon!` : `Evening, ${name}!`;
  const joke = JOKES[Math.floor(Date.now() / 86400000) % JOKES.length]!;
  const lines = [
    greet,
    joke,
    "What are you up to today — tightening lineups, scouting schedules, or just browsing?",
    "If you could change one thing in your fantasy setup right now, what would it be?",
  ];

  if (preview) {
    const upcoming = preview.tournament_schedules.flatMap((t) =>
      t.my_upcoming_matches.map((m) => ({
        ...m,
        tournament_name: t.tournament_name,
      })),
    );
    upcoming.sort((a, b) => a.event_date.localeCompare(b.event_date));
    const m0 = upcoming[0];
    if (m0) {
      const when = m0.event_date
        ? new Date(m0.event_date).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })
        : m0.event_date;
      lines.push(`On deck: ${m0.tournament_name} vs ${m0.opponent} (${when}).`);
    } else {
      lines.push("No upcoming matches tied to your name on loaded schedules yet — check back after the draw updates.");
    }

    const incomplete = preview.winter_fantasy_rosters.filter((r) => !r.waki_lineup_complete || r.picks.length < 5);
    if (incomplete.length > 0) {
      lines.push(
        `You still have ${incomplete.length} roster row${incomplete.length === 1 ? "" : "s"} to finish — open Pick / Edit Teams when you're ready.`,
      );
    }

    if (preview.open_contests.length > 0) {
      lines.push(`Tournaments on the radar: ${preview.open_contests.slice(0, 3).map((c) => c.name).join(" · ")}.`);
    }
  }

  if (path !== "/" && path !== "/pick-teams" && path !== "/rosters") {
    lines.push("Tip: the dashboard has your season pulse; Pick / Edit Teams is where lineups lock in.");
  }

  return lines;
}

export default function AppFloatingCorner({ user, path }: { user: SessionUser; path: string }) {
  const dash = useDashboardDataRequired();
  const preview = dash.preview;
  const pulse = preview?.fantasy_pulse;
  const [open, setOpen] = useState(true);

  const lines = useMemo(() => hostLines(user, path, preview), [user, path, preview]);

  useEffect(() => {
    setOpen(true);
  }, [path]);

  return (
    <div className="app-float-corner" aria-label="Session host">
      <div className="app-float-kpis" aria-label="Season snapshot">
        <div className="app-float-kpi">
          <span className="app-float-kpi-k">You</span>
          <span className="app-float-kpi-v">{preview ? preview.fantasy_season.total_fantasy_points : dash?.loading ? "…" : "—"}</span>
          <span className="app-float-kpi-l">pts</span>
        </div>
        <div className="app-float-kpi">
          <span className="app-float-kpi-k">Rank</span>
          <span className="app-float-kpi-v">{pulse && pulse.my_rank != null ? `#${pulse.my_rank}` : dash?.loading ? "…" : "—"}</span>
          <span className="app-float-kpi-l">{pulse ? `${pulse.rank_players_count} pl` : ""}</span>
        </div>
        <div className="app-float-kpi">
          <span className="app-float-kpi-k">Move</span>
          <span className="app-float-kpi-v app-float-kpi-v--delta">
            {pulse && pulse.rank_change != null && pulse.rank_change !== 0
              ? pulse.rank_change > 0
                ? `↑${pulse.rank_change}`
                : `↓${Math.abs(pulse.rank_change)}`
              : "—"}
          </span>
          <span className="app-float-kpi-l">snap</span>
        </div>
      </div>

      <div className={`app-float-host${open ? " app-float-host--open" : ""}`}>
        <button type="button" className="app-float-host-toggle" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
          <span className="app-float-host-avatar" aria-hidden>
            ☺
          </span>
          <span className="app-float-host-toggle-text">{open ? "Hide" : "Host"}</span>
        </button>
        {open ? (
          <div className="app-float-host-panel" role="dialog" aria-label="Friendly host">
            <div className="app-float-host-title">Your corner</div>
            <ul className="app-float-host-lines">
              {lines.map((t, i) => (
                <li key={i}>{t}</li>
              ))}
            </ul>
            <label className="app-float-host-input-wrap">
              <span className="visually-hidden">Say something (not sent anywhere yet)</span>
              <input type="text" className="app-float-host-input" placeholder="Type a thought… (offline for now)" disabled />
            </label>
          </div>
        ) : null}
      </div>
    </div>
  );
}
