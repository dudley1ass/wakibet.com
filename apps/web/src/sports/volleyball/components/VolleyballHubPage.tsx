import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AVP_HUNTINGTON_BEACH_OPEN_EVENT_KEY, AVP_SOUTH_BEACH_MAY_OPEN_EVENT_KEY } from "@wakibet/shared";
import { Link } from "react-router-dom";
import type { SessionUser } from "../../../App";
import { apiGet } from "../../../api";
import "../../../components/dashboard.css";

type AvpEvent = {
  event_key: string;
  category: "league" | "heritage" | "contender";
  name: string;
  location: string;
  start_date: string;
  end_date: string;
};

type SchedulePayload = {
  sport: "volleyball";
  season_year: number;
  events: AvpEvent[];
  schedule_notes: string[];
};

type StatusPayload = {
  sport: "volleyball";
  season_year: number;
  event_count: number;
  fantasy_enabled: boolean;
  message: string;
};

type AthleteProfile = {
  player: string;
  position: string;
  height: string;
  location: string;
  usual_side: string;
  usual_defense: string;
};

type TeamRow = {
  team_key: string;
  division_code:
    | "mens_aa"
    | "mens_aaa"
    | "mens_open"
    | "womens_aa"
    | "womens_aaa"
    | "womens_open"
    | "heritage_mens"
    | "heritage_womens";
  division_label: string;
  player_one: string;
  player_two: string;
  team_label: string;
  player_one_profile: AthleteProfile | null;
  player_two_profile: AthleteProfile | null;
};

type TeamsPayload = {
  sport: "volleyball";
  season_year: number;
  event_key: string;
  pool_title: string;
  team_count: number;
  athletes_csv_row_count: number;
  roster_players_missing_profile: string[];
  teams: TeamRow[];
};

function fmtRange(start: string, end: string): string {
  try {
    const s = new Date(`${start}T12:00:00`);
    const e = new Date(`${end}T12:00:00`);
    const o: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
    if (start === end) return s.toLocaleDateString(undefined, { ...o, year: "numeric" });
    if (s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear()) {
      return `${s.toLocaleDateString(undefined, o)}–${e.getDate()}, ${e.getFullYear()}`;
    }
    return `${s.toLocaleDateString(undefined, { ...o, year: "numeric" })} – ${e.toLocaleDateString(undefined, { ...o, year: "numeric" })}`;
  } catch {
    return `${start} – ${end}`;
  }
}

function categoryTitle(c: AvpEvent["category"]): string {
  if (c === "league") return "AVP League";
  if (c === "heritage") return "AVP Heritage (majors)";
  return "AVP Heritage Contenders";
}

function fmtAthleteLine(p: AthleteProfile | null | undefined): string {
  if (!p) return "—";
  const core = [p.position, p.height, p.location].map((s) => (s && s !== "-" ? s : "")).filter(Boolean);
  const role = [p.usual_side, p.usual_defense].map((s) => (s && s !== "-" ? s : "")).filter(Boolean);
  const a = core.join(" · ");
  const b = role.join(" / ");
  if (a && b) return `${a} · ${b}`;
  return a || b || "—";
}

type Props = {
  user: SessionUser | null;
};

export default function VolleyballHubPage({ user }: Props) {
  const scheduleQ = useQuery({
    queryKey: ["volleyball", "schedule"] as const,
    queryFn: () => apiGet<SchedulePayload>("/api/v1/volleyball/schedule"),
  });
  const statusQ = useQuery({
    queryKey: ["volleyball", "status"] as const,
    queryFn: () => apiGet<StatusPayload>("/api/v1/volleyball/status"),
  });
  const southBeachKey = AVP_SOUTH_BEACH_MAY_OPEN_EVENT_KEY;
  const huntingtonKey = AVP_HUNTINGTON_BEACH_OPEN_EVENT_KEY;
  const teamsQ = useQuery({
    queryKey: ["volleyball", "teams", southBeachKey] as const,
    queryFn: () =>
      apiGet<TeamsPayload>(
        `/api/v1/volleyball/teams?event_key=${encodeURIComponent(southBeachKey)}`,
      ),
  });
  const teamsHbQ = useQuery({
    queryKey: ["volleyball", "teams", huntingtonKey] as const,
    queryFn: () =>
      apiGet<TeamsPayload>(`/api/v1/volleyball/teams?event_key=${encodeURIComponent(huntingtonKey)}`),
  });
  const [selectedEventKey, setSelectedEventKey] = useState<string>(huntingtonKey);
  const [captain, setCaptain] = useState<string>("");
  const [flex1, setFlex1] = useState<string>("");
  const [flex2, setFlex2] = useState<string>("");
  const [flex3, setFlex3] = useState<string>("");
  const [flex4, setFlex4] = useState<string>("");

  const byCategory = useMemo(() => {
    const ev = scheduleQ.data?.events ?? [];
    const league = ev.filter((e) => e.category === "league");
    const heritage = ev.filter((e) => e.category === "heritage");
    const contender = ev.filter((e) => e.category === "contender");
    return { league, heritage, contender };
  }, [scheduleQ.data?.events]);

  const teamsByDivision = useMemo(() => {
    const list = teamsQ.data?.teams ?? [];
    const order = ["Mens AA", "Mens AAA", "Mens Open", "Womens AA", "Womens AAA", "Womens Open"];
    const map = new Map<string, TeamRow[]>();
    for (const t of list) {
      const k = t.division_label;
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(t);
    }
    return order.filter((k) => map.has(k)).map((k) => ({ label: k, rows: map.get(k)! }));
  }, [teamsQ.data?.teams]);

  const teamsHbByDivision = useMemo(() => {
    const list = teamsHbQ.data?.teams ?? [];
    const order = ["Womens", "Mens"];
    const map = new Map<string, TeamRow[]>();
    for (const t of list) {
      const k = t.division_label;
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(t);
    }
    return order.filter((k) => map.has(k)).map((k) => ({ label: k, rows: map.get(k)! }));
  }, [teamsHbQ.data?.teams]);
  const selectedPool = selectedEventKey === huntingtonKey ? teamsHbQ.data : teamsQ.data;
  const playerOptions = useMemo(() => {
    const names = new Set<string>();
    for (const t of selectedPool?.teams ?? []) {
      const p1 = t.player_one.trim();
      const p2 = t.player_two.trim();
      if (p1) names.add(p1);
      if (p2) names.add(p2);
    }
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [selectedPool?.teams]);
  const selectedNames = [captain, flex1, flex2, flex3, flex4].filter(Boolean);
  const hasDuplicateSelections = new Set(selectedNames).size !== selectedNames.length;
  const lineupCount = selectedNames.length;
  const lineupComplete = lineupCount === 5 && !hasDuplicateSelections;
  const selectOptions = (currentValue: string) =>
    playerOptions.filter((n) => n === currentValue || !selectedNames.includes(n));
  const resetSelections = () => {
    setCaptain("");
    setFlex1("");
    setFlex2("");
    setFlex3("");
    setFlex4("");
  };

  const err = scheduleQ.error instanceof Error ? scheduleQ.error.message : null;
  const teamsErr = teamsQ.error instanceof Error ? teamsQ.error.message : null;
  const teamsHbErr = teamsHbQ.error instanceof Error ? teamsHbQ.error.message : null;

  return (
    <div className="dash-shell">
      <div className="dash-head">
        <div>
          <h1>
            Beach volleyball <span className="brand-jp">WakiBet</span>
          </h1>
          <p>
            <strong>AVP {scheduleQ.data?.season_year ?? "2026"}</strong> — summer tour stops below. Fantasy lineups and
            scoring will mirror pickleball (WakiCash, captains, season leaderboard) once the player pool and points
            table are wired in.
          </p>
          {statusQ.data?.message ? <p className="dash-sub" style={{ marginTop: 10 }}>{statusQ.data.message}</p> : null}
        </div>
        <div className="dash-head-actions">
          <Link className="dash-ghost-btn" to="/scoring-table">
            Pickleball scoring (reference)
          </Link>
          <Link className="dash-ghost-btn" to="/">
            Dashboard
          </Link>
        </div>
      </div>

      {user ? (
        <p className="dash-sub" style={{ marginTop: 4 }}>
          Signed in as <strong>{user.display_name || user.email}</strong>
        </p>
      ) : null}

      {err ? <p className="dash-error">{err}</p> : null}
      {teamsErr ? <p className="dash-error">{teamsErr}</p> : null}
      {teamsHbErr ? <p className="dash-error">{teamsHbErr}</p> : null}
      {scheduleQ.isLoading ? <p className="dash-loading">Loading schedule…</p> : null}

      {scheduleQ.data?.schedule_notes?.length ? (
        <ul className="dash-sub" style={{ marginTop: 16, maxWidth: 720 }}>
          {scheduleQ.data.schedule_notes.map((n, i) => (
            <li key={i} style={{ marginBottom: 8 }}>
              {n}
            </li>
          ))}
        </ul>
      ) : null}
      <section style={{ marginTop: 28 }} aria-labelledby="avp-lineup-builder">
        <h2 id="avp-lineup-builder" className="dash-sub" style={{ fontWeight: 800, fontSize: "1.05rem" }}>
          Volleyball lineup builder
        </h2>
        <p className="dash-sub" style={{ marginTop: 8, maxWidth: 760 }}>
          Same flow as pickleball: pick a tournament, then choose <strong>1 Captain</strong> and <strong>4 Flex</strong>{" "}
          players from dropdowns.
        </p>
        <div style={{ display: "grid", gap: 12, marginTop: 12, maxWidth: 520 }}>
          <label className="dash-sub" style={{ display: "grid", gap: 6 }}>
            Tournament
            <select
              value={selectedEventKey}
              onChange={(e) => {
                setSelectedEventKey(e.target.value);
                resetSelections();
              }}
              style={{ padding: "10px 12px", borderRadius: 10, border: "1px solid #334155", background: "#0b1220", color: "#e2e8f0" }}
            >
              <option value={huntingtonKey}>Huntington Beach Open (May 14–17)</option>
              <option value={southBeachKey}>South Beach May Open (May 23–24)</option>
            </select>
          </label>
          <label className="dash-sub" style={{ display: "grid", gap: 6 }}>
            Captain (1.5x)
            <select value={captain} onChange={(e) => setCaptain(e.target.value)} style={{ padding: "10px 12px", borderRadius: 10, border: "1px solid #334155", background: "#0b1220", color: "#e2e8f0" }}>
              <option value="">Select captain</option>
              {selectOptions(captain).map((n) => (
                <option key={`cap-${n}`} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          <label className="dash-sub" style={{ display: "grid", gap: 6 }}>
            Flex 1
            <select value={flex1} onChange={(e) => setFlex1(e.target.value)} style={{ padding: "10px 12px", borderRadius: 10, border: "1px solid #334155", background: "#0b1220", color: "#e2e8f0" }}>
              <option value="">Select player</option>
              {selectOptions(flex1).map((n) => (
                <option key={`f1-${n}`} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          <label className="dash-sub" style={{ display: "grid", gap: 6 }}>
            Flex 2
            <select value={flex2} onChange={(e) => setFlex2(e.target.value)} style={{ padding: "10px 12px", borderRadius: 10, border: "1px solid #334155", background: "#0b1220", color: "#e2e8f0" }}>
              <option value="">Select player</option>
              {selectOptions(flex2).map((n) => (
                <option key={`f2-${n}`} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          <label className="dash-sub" style={{ display: "grid", gap: 6 }}>
            Flex 3
            <select value={flex3} onChange={(e) => setFlex3(e.target.value)} style={{ padding: "10px 12px", borderRadius: 10, border: "1px solid #334155", background: "#0b1220", color: "#e2e8f0" }}>
              <option value="">Select player</option>
              {selectOptions(flex3).map((n) => (
                <option key={`f3-${n}`} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          <label className="dash-sub" style={{ display: "grid", gap: 6 }}>
            Flex 4
            <select value={flex4} onChange={(e) => setFlex4(e.target.value)} style={{ padding: "10px 12px", borderRadius: 10, border: "1px solid #334155", background: "#0b1220", color: "#e2e8f0" }}>
              <option value="">Select player</option>
              {selectOptions(flex4).map((n) => (
                <option key={`f4-${n}`} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
        </div>
        <p className="dash-sub" style={{ marginTop: 10 }}>
          {lineupComplete
            ? "Lineup complete: 5/5 selected."
            : hasDuplicateSelections
              ? "Lineup has duplicate players. Choose unique players for all slots."
              : `Lineup progress: ${lineupCount}/5 selected.`}
        </p>
      </section>

      {(["league", "heritage", "contender"] as const).map((cat) => {
        const rows = cat === "league" ? byCategory.league : cat === "heritage" ? byCategory.heritage : byCategory.contender;
        if (rows.length === 0) return null;
        return (
          <section key={cat} style={{ marginTop: 28 }} aria-labelledby={`avp-cat-${cat}`}>
            <h2 id={`avp-cat-${cat}`} className="dash-sub" style={{ fontWeight: 800, fontSize: "1.05rem" }}>
              {categoryTitle(cat)}
            </h2>
            <div style={{ overflowX: "auto", marginTop: 10 }}>
              <table className="season-lb-table" style={{ minWidth: 520 }}>
                <thead>
                  <tr>
                    <th scope="col">Event</th>
                    <th scope="col">Location</th>
                    <th scope="col" className="season-lb-th-score">
                      Dates
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((e) => (
                    <tr key={e.event_key}>
                      <td className="season-lb-name">{e.name}</td>
                      <td>{e.location}</td>
                      <td className="season-lb-score">{fmtRange(e.start_date, e.end_date)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        );
      })}

      <section style={{ marginTop: 32 }} aria-labelledby="avp-sb-teams">
        <h2 id="avp-sb-teams" className="dash-sub" style={{ fontWeight: 800, fontSize: "1.05rem" }}>
          {teamsQ.data?.pool_title ?? "AVP NEXT South Beach May Open"} — registered teams
        </h2>
        <p className="dash-sub" style={{ marginTop: 8, maxWidth: 720 }}>
          Schedule stop: <strong>AVP South Florida Open</strong> ({southBeachKey}, May 23–24) — Miami / South Beach May
          series entries below for fantasy prep.
        </p>
        {teamsQ.isLoading ? <p className="dash-loading" style={{ marginTop: 10 }}>Loading team list…</p> : null}
        {!teamsQ.isLoading && teamsQ.data ? (
          <p className="dash-sub" style={{ marginTop: 6 }}>
            <strong>{teamsQ.data.team_count}</strong> teams · athlete rows loaded from CSV:{" "}
            <strong>{teamsQ.data.athletes_csv_row_count}</strong>
            {teamsQ.data.roster_players_missing_profile.length > 0 ? (
              <>
                {" "}
                · missing profile match for: {teamsQ.data.roster_players_missing_profile.join(", ")}
              </>
            ) : null}
          </p>
        ) : null}
        {teamsByDivision.map((block) => (
          <div key={block.label} style={{ marginTop: 18 }}>
            <h3 className="dash-sub" style={{ fontWeight: 700, fontSize: "0.95rem", marginBottom: 8 }}>
              {block.label}
            </h3>
            <div style={{ overflowX: "auto" }}>
              <table className="season-lb-table" style={{ minWidth: 720 }}>
                <thead>
                  <tr>
                    <th scope="col">Team</th>
                    <th scope="col">Player 1</th>
                    <th scope="col">P1 details</th>
                    <th scope="col">Player 2</th>
                    <th scope="col">P2 details</th>
                  </tr>
                </thead>
                <tbody>
                  {block.rows.map((t) => (
                    <tr key={t.team_key}>
                      <td className="season-lb-name">{t.team_label}</td>
                      <td>{t.player_one}</td>
                      <td className="dash-sub" style={{ fontSize: "0.85rem", maxWidth: 280 }}>
                        {fmtAthleteLine(t.player_one_profile)}
                      </td>
                      <td>{t.player_two.trim() ? t.player_two : "—"}</td>
                      <td className="dash-sub" style={{ fontSize: "0.85rem", maxWidth: 280 }}>
                        {t.player_two.trim() ? fmtAthleteLine(t.player_two_profile) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </section>

      <section style={{ marginTop: 36 }} aria-labelledby="avp-hb-teams">
        <h2 id="avp-hb-teams" className="dash-sub" style={{ fontWeight: 800, fontSize: "1.05rem" }}>
          {teamsHbQ.data?.pool_title ?? "AVP Huntington Beach Open"} — teams & athletes
        </h2>
        <p className="dash-sub" style={{ marginTop: 8, maxWidth: 720 }}>
          Heritage stop <strong>{huntingtonKey}</strong> (May 14–17, 2026). Pairings and per-player rows load from the
          Huntington CSV bundled with the API.
        </p>
        {teamsHbQ.isLoading ? <p className="dash-loading" style={{ marginTop: 10 }}>Loading Huntington data…</p> : null}
        {!teamsHbQ.isLoading && teamsHbQ.data ? (
          <p className="dash-sub" style={{ marginTop: 6 }}>
            <strong>{teamsHbQ.data.team_count}</strong> teams · <strong>{teamsHbQ.data.athletes_csv_row_count}</strong>{" "}
            athlete rows in CSV
            {teamsHbQ.data.roster_players_missing_profile.length > 0 ? (
              <>
                {" "}
                · no profile row for: {teamsHbQ.data.roster_players_missing_profile.join(", ")}
              </>
            ) : null}
          </p>
        ) : null}
        {teamsHbByDivision.map((block) => (
          <div key={`hb-${block.label}`} style={{ marginTop: 18 }}>
            <h3 className="dash-sub" style={{ fontWeight: 700, fontSize: "0.95rem", marginBottom: 8 }}>
              Huntington — {block.label}
            </h3>
            <div style={{ overflowX: "auto" }}>
              <table className="season-lb-table" style={{ minWidth: 720 }}>
                <thead>
                  <tr>
                    <th scope="col">Team</th>
                    <th scope="col">Player 1</th>
                    <th scope="col">P1 details</th>
                    <th scope="col">Player 2</th>
                    <th scope="col">P2 details</th>
                  </tr>
                </thead>
                <tbody>
                  {block.rows.map((t) => (
                    <tr key={t.team_key}>
                      <td className="season-lb-name">{t.team_label}</td>
                      <td>{t.player_one}</td>
                      <td className="dash-sub" style={{ fontSize: "0.85rem", maxWidth: 280 }}>
                        {fmtAthleteLine(t.player_one_profile)}
                      </td>
                      <td>{t.player_two}</td>
                      <td className="dash-sub" style={{ fontSize: "0.85rem", maxWidth: 280 }}>
                        {fmtAthleteLine(t.player_two_profile)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </section>

      <p className="dash-empty" style={{ marginTop: 28 }}>
        WakiCash salaries and AVP fantasy scoring table are still to come — team keys are stable for when picks go live.
        Athlete position / height / hometown rows load from the API’s South Beach CSV (reconciled with the roster list).
      </p>
    </div>
  );
}
