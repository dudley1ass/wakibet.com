import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AVP_HUNTINGTON_BEACH_OPEN_EVENT_KEY, AVP_SOUTH_BEACH_MAY_OPEN_EVENT_KEY } from "@wakibet/shared";
import { Link } from "react-router-dom";
import type { SessionUser } from "../../../App";
import { apiGet, apiPut } from "../../../api";
import "../../../components/dashboard.css";

type TeamRow = {
  team_key: string;
  player_one: string;
  player_two: string;
};

type TeamsPayload = {
  teams: TeamRow[];
};

type LineupPayload = {
  event_key: string;
  picks: Array<{
    slot_index: number;
    player_name: string;
    is_captain: boolean;
    waki_cash: number;
  }>;
  total_salary: number;
  salary_cap: number;
};

const VOLLEYBALL_SALARY_CAP = 100;

function stableHash(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i += 1) h = (h * 31 + input.charCodeAt(i)) >>> 0;
  return h;
}

function wakiCashForPlayer(name: string, eventKey: string): number {
  const roll = stableHash(`${eventKey}:${name}`) % 100;
  if (roll >= 92) return 47 + (roll % 4); // elite 47-50
  if (roll >= 70) return 30 + (roll % 8); // strong 30-37
  if (roll >= 35) return 18 + (roll % 10); // mid 18-27
  return 8 + (roll % 9); // value 8-16
}

function wcLabel(name: string, eventKey: string): string {
  return `${name} (${wakiCashForPlayer(name, eventKey)} WC)`;
}

type Props = {
  user: SessionUser | null;
};

export default function VolleyballHubPage({ user }: Props) {
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
  const [saveBusy, setSaveBusy] = useState(false);
  const [saveErr, setSaveErr] = useState<string | null>(null);
  const [saveOk, setSaveOk] = useState<string | null>(null);
  const lineupQ = useQuery({
    queryKey: ["volleyball", "lineup", selectedEventKey] as const,
    queryFn: () => apiGet<LineupPayload>(`/api/v1/volleyball/lineup?event_key=${encodeURIComponent(selectedEventKey)}`),
    enabled: Boolean(user),
  });
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
  const totalSalary = selectedNames.reduce((sum, name) => sum + wakiCashForPlayer(name, selectedEventKey), 0);
  const salaryRemaining = VOLLEYBALL_SALARY_CAP - totalSalary;
  const hasDuplicateSelections = new Set(selectedNames).size !== selectedNames.length;
  const lineupCount = selectedNames.length;
  const lineupComplete = lineupCount === 5 && !hasDuplicateSelections;
  const overCap = totalSalary > VOLLEYBALL_SALARY_CAP;
  const validLineup = lineupComplete && !overCap;
  const selectOptions = (currentValue: string) =>
    playerOptions.filter((n) => n === currentValue || !selectedNames.includes(n));
  const resetSelections = () => {
    setCaptain("");
    setFlex1("");
    setFlex2("");
    setFlex3("");
    setFlex4("");
  };
  useEffect(() => {
    if (!lineupQ.data) return;
    const cap = lineupQ.data.picks.find((p) => p.is_captain)?.player_name ?? "";
    const flexes = lineupQ.data.picks.filter((p) => !p.is_captain).map((p) => p.player_name);
    setCaptain(cap);
    setFlex1(flexes[0] ?? "");
    setFlex2(flexes[1] ?? "");
    setFlex3(flexes[2] ?? "");
    setFlex4(flexes[3] ?? "");
  }, [lineupQ.data]);
  const teamsErr = teamsQ.error instanceof Error ? teamsQ.error.message : null;
  const teamsHbErr = teamsHbQ.error instanceof Error ? teamsHbQ.error.message : null;
  async function saveLineup() {
    if (!user) return;
    setSaveErr(null);
    setSaveOk(null);
    setSaveBusy(true);
    try {
      const picks = [
        { player_name: captain, is_captain: true },
        { player_name: flex1, is_captain: false },
        { player_name: flex2, is_captain: false },
        { player_name: flex3, is_captain: false },
        { player_name: flex4, is_captain: false },
      ];
      await apiPut("/api/v1/volleyball/lineup", {
        event_key: selectedEventKey,
        picks,
      });
      setSaveOk("Volleyball lineup saved.");
      await lineupQ.refetch();
    } catch (e) {
      setSaveErr(e instanceof Error ? e.message : "Could not save lineup.");
    } finally {
      setSaveBusy(false);
    }
  }

  return (
    <div className="dash-shell">
      <div className="dash-head">
        <div>
          <h1>
            Volleyball <span className="brand-jp">WakiBet</span>
          </h1>
          <p>
            WakiCash is your team budget for Wakibet Volleyball. Each player has a value based on performance, and you
            must build a 5-player lineup under the cap (typically 100). Pick the best mix of top players and value
            picks- once the tournament starts, your lineup locks and players score based on real match performance.
          </p>
        </div>
        <div className="dash-head-actions">
          {user ? (
            <Link className="dash-ghost-btn" to="/volleyball/rosters">
              My volleyball rosters
            </Link>
          ) : null}
          <Link className="dash-ghost-btn" to="/volleyball/scoring">
            Scoring table
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

      {teamsErr ? <p className="dash-error">{teamsErr}</p> : null}
      {teamsHbErr ? <p className="dash-error">{teamsHbErr}</p> : null}
      {teamsQ.isLoading || teamsHbQ.isLoading ? <p className="dash-loading">Loading players…</p> : null}
      <section style={{ marginTop: 28 }} aria-labelledby="avp-lineup-builder">
        <h2 id="avp-lineup-builder" className="dash-sub" style={{ fontWeight: 800, fontSize: "1.05rem" }}>
          Volleyball lineup builder
        </h2>
        <p className="dash-sub" style={{ marginTop: 8, maxWidth: 760 }}>
          Pick a tournament, then choose 1 Captain and 4 Flex players under a {VOLLEYBALL_SALARY_CAP} Waki Cash cap.
        </p>
        <div style={{ display: "grid", gap: 12, marginTop: 12, maxWidth: 520 }}>
          <label className="dash-sub" style={{ display: "grid", gap: 6 }}>
            Tournament
            <select
              value={selectedEventKey}
              onChange={(e) => {
                setSelectedEventKey(e.target.value);
                resetSelections();
                setSaveErr(null);
                setSaveOk(null);
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
                  {wcLabel(n, selectedEventKey)}
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
                  {wcLabel(n, selectedEventKey)}
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
                  {wcLabel(n, selectedEventKey)}
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
                  {wcLabel(n, selectedEventKey)}
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
                  {wcLabel(n, selectedEventKey)}
                </option>
              ))}
            </select>
          </label>
        </div>
        <p className="dash-sub" style={{ marginTop: 10 }}>
          Salary: <strong>{totalSalary}</strong> / {VOLLEYBALL_SALARY_CAP} WC{" "}
          ({salaryRemaining >= 0 ? `${salaryRemaining} left` : `${Math.abs(salaryRemaining)} over cap`})
        </p>
        <p className="dash-sub" style={{ marginTop: 10 }}>
          {overCap
            ? "Lineup is over the Waki Cash cap."
            : validLineup
              ? "Lineup complete and valid."
              : lineupComplete
            ? "Lineup complete: 5/5 selected."
            : hasDuplicateSelections
              ? "Lineup has duplicate players. Choose unique players for all slots."
              : `Lineup progress: ${lineupCount}/5 selected.`}
        </p>
        {user ? (
          <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 10 }}>
            <button
              type="button"
              className="dash-main-btn"
              disabled={saveBusy || !validLineup}
              onClick={() => void saveLineup()}
            >
              {saveBusy ? "Saving..." : "Save lineup"}
            </button>
            {saveOk ? <span style={{ color: "#86efac", fontSize: 12 }}>{saveOk}</span> : null}
            {saveErr ? <span style={{ color: "#fca5a5", fontSize: 12 }}>{saveErr}</span> : null}
          </div>
        ) : (
          <p className="scoring-foot">Sign in to save your volleyball lineup.</p>
        )}
      </section>
    </div>
  );
}
