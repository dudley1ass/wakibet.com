import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { apiGet } from "../api";
import {
  trackBeatExpertsResult,
  trackDemoContestComplete,
  trackDemoContestStart,
  trackGuestLineupSaved,
  trackRegisterFromDemoClick,
} from "../lib/analytics";
import { clearGuestLineup, loadGuestLineup, saveGuestLineup, type GuestLineupSport } from "../lib/guestLineup";

export type DemoContestPlayer = {
  player_name: string;
  display_name: string;
  projected_points: number;
  waki_cash: number;
  last_event_label: string;
};

type DemoSport = GuestLineupSport;

type ExpertLineup = {
  label: string;
  player_names: string[];
  projected_score: number;
  waki_cash_spent: number;
  players: {
    player_name: string;
    display_name: string;
    projected_points: number;
    waki_cash: number;
  }[];
};

type DemoContestResponse = {
  sport: DemoSport;
  tournament_key: string;
  tournament_name: string;
  roster_size: number;
  salary_cap: number;
  players: DemoContestPlayer[];
  expert_lineup: ExpertLineup | null;
};

const DEMO_SPORT_OPTIONS: { value: DemoSport; label: string }[] = [
  { value: "pickleball", label: "Pickleball" },
  { value: "lacrosse", label: "Lacrosse" },
  { value: "volleyball", label: "Volleyball" },
  { value: "poker", label: "WSOP" },
];

type Props = {
  sectionId?: string;
  /** Compact title for homepage embed */
  compact?: boolean;
};

export default function GuestDemoContest({ sectionId = "demo-contest", compact = false }: Props) {
  const [searchParams] = useSearchParams();
  const initialSport = (searchParams.get("sport") as DemoSport | null) ?? "pickleball";
  const validInitial = DEMO_SPORT_OPTIONS.some((o) => o.value === initialSport) ? initialSport : "pickleball";

  const [selectedSport, setSelectedSport] = useState<DemoSport>(validInitial);
  const [selectedNames, setSelectedNames] = useState<string[]>([]);
  const [guestSaved, setGuestSaved] = useState(false);
  const demoStartedRef = useRef(false);
  const demoCompletedRef = useRef(false);
  const beatTrackedRef = useRef(false);

  const demoQuery = useQuery({
    queryKey: ["fantasy-demo-contest", selectedSport] as const,
    queryFn: () =>
      apiGet<DemoContestResponse>(
        `/api/v1/fantasy-tournament/demo?sport=${encodeURIComponent(selectedSport)}`,
        { timeoutMs: 20_000 },
      ),
    staleTime: 5 * 60_000,
    retry: 1,
  });

  const players = demoQuery.data?.players ?? [];
  const expert = demoQuery.data?.expert_lineup ?? null;
  const rosterSize = demoQuery.data?.roster_size ?? 5;
  const salaryCap = demoQuery.data?.salary_cap ?? 100;
  const selectedPlayers = selectedNames
    .map((name) => players.find((p) => p.player_name === name))
    .filter((p): p is DemoContestPlayer => Boolean(p));
  const projectedScore = Math.round(selectedPlayers.reduce((sum, p) => sum + p.projected_points, 0) * 100) / 100;
  const wakiCashSpent = selectedPlayers.reduce((sum, p) => sum + p.waki_cash, 0);
  const wakiCashRemaining = salaryCap - wakiCashSpent;
  const isFull = selectedPlayers.length === rosterSize;
  const isBuilt = isFull && wakiCashRemaining >= 0;

  useEffect(() => {
    const stored = loadGuestLineup();
    if (stored && stored.sport === selectedSport) {
      setSelectedNames(stored.player_names);
      setGuestSaved(true);
    }
  }, [selectedSport]);

  function togglePlayer(player: DemoContestPlayer) {
    if (!demoStartedRef.current) {
      demoStartedRef.current = true;
      trackDemoContestStart(selectedSport);
    }
    setGuestSaved(false);
    setSelectedNames((prev) => {
      if (prev.includes(player.player_name)) return prev.filter((name) => name !== player.player_name);
      if (prev.length >= rosterSize) return prev;
      if (wakiCashRemaining - player.waki_cash < 0) return prev;
      return [...prev, player.player_name];
    });
  }

  useEffect(() => {
    if (!isBuilt || demoCompletedRef.current) return;
    demoCompletedRef.current = true;
    trackDemoContestComplete(selectedSport, projectedScore);
  }, [isBuilt, projectedScore, selectedSport]);

  useEffect(() => {
    if (!isBuilt || !expert || beatTrackedRef.current) return;
    beatTrackedRef.current = true;
    const won = projectedScore > expert.projected_score;
    const tied = projectedScore === expert.projected_score;
    trackBeatExpertsResult(selectedSport, won ? "win" : tied ? "tie" : "loss", projectedScore, expert.projected_score);
  }, [isBuilt, expert, projectedScore, selectedSport]);

  function handleSportChange(next: DemoSport) {
    if (next === selectedSport) return;
    setSelectedSport(next);
    setSelectedNames([]);
    setGuestSaved(false);
    demoCompletedRef.current = false;
    beatTrackedRef.current = false;
  }

  function handleSaveGuestLineup() {
    if (!isBuilt || !demoQuery.data) return;
    saveGuestLineup({
      sport: selectedSport,
      tournament_key: demoQuery.data.tournament_key,
      tournament_name: demoQuery.data.tournament_name,
      player_names: selectedNames,
      display_names: selectedPlayers.map((p) => p.display_name),
      projected_score: projectedScore,
      waki_cash_spent: wakiCashSpent,
      saved_at: new Date().toISOString(),
    });
    setGuestSaved(true);
    trackGuestLineupSaved(selectedSport, projectedScore);
  }

  const expertScore = expert?.projected_score ?? 0;
  const beatExpert = isBuilt && expert ? projectedScore > expertScore : false;
  const tieExpert = isBuilt && expert ? projectedScore === expertScore : false;

  return (
    <section id={sectionId} className="landing-demo-contest">
      <div className="landing-demo-contest__head">
        <div>
          <div className="landing-demo-contest__kicker">
            {compact ? "Play instantly — no account" : "Guest lineup · no login"}
          </div>
          <h2 className="landing-demo-contest__title">
            {compact ? (
              <>Build a free lineup for{" "}</>
            ) : (
              <>Pick 5 players. Beat the experts.{" "}</>
            )}
            <span className="landing-demo-contest__sport-pick">
              <select
                aria-label="Choose a sport to demo"
                className="landing-demo-contest__sport-select"
                value={selectedSport}
                onChange={(e) => handleSportChange(e.target.value as DemoSport)}
              >
                {DEMO_SPORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </span>
            {compact ? null : "."}
          </h2>
          <p className="landing-demo-contest__lede">
            {salaryCap} WakiCash salary cap · projected scores from recent results · save your guest lineup on this
            device, then create a free account when you want to enter real contests.
          </p>
        </div>
        <div className="landing-demo-contest__score-card">
          <div className="landing-demo-contest__score-row">
            <span>WakiCash left</span>
            <strong className={wakiCashRemaining < 0 ? "landing-demo-contest__over" : undefined}>
              {wakiCashRemaining}
            </strong>
            <small>of {salaryCap}</small>
          </div>
          <div className="landing-demo-contest__score-row landing-demo-contest__score-row--alt">
            <span>Your projected score</span>
            <strong>{projectedScore}</strong>
            <small>
              {selectedPlayers.length}/{rosterSize} picked
            </small>
          </div>
          {expert ? (
            <div className="landing-demo-contest__score-row landing-demo-contest__score-row--expert">
              <span>{expert.label}</span>
              <strong>{expert.projected_score}</strong>
              <small>benchmark</small>
            </div>
          ) : null}
        </div>
      </div>

      {demoQuery.isLoading ? <p className="dash-empty">Loading contest…</p> : null}
      {demoQuery.isError ? <p className="dash-error">Contest data is not available right now.</p> : null}

      {players.length > 0 ? (
        <>
          <div className="landing-demo-contest__players" aria-label="Guest contest player pool">
            {players.map((player) => {
              const selected = selectedNames.includes(player.player_name);
              const isExpertPick = expert?.player_names.includes(player.player_name) ?? false;
              const wouldOverspend = !selected && wakiCashRemaining - player.waki_cash < 0;
              const rosterFull = !selected && selectedNames.length >= rosterSize;
              const disabled = rosterFull || wouldOverspend;
              return (
                <button
                  key={player.player_name}
                  type="button"
                  className={`landing-demo-player${selected ? " landing-demo-player--selected" : ""}${
                    wouldOverspend ? " landing-demo-player--over" : ""
                  }${isExpertPick ? " landing-demo-player--expert" : ""}`}
                  disabled={disabled}
                  onClick={() => togglePlayer(player)}
                >
                  <span className="landing-demo-player__row">
                    <span className="landing-demo-player__name">{player.display_name}</span>
                    <span className="landing-demo-player__price">{player.waki_cash} WC</span>
                  </span>
                  <span className="landing-demo-player__meta">
                    {player.projected_points} pts · {player.last_event_label}
                    {isExpertPick ? " · expert pick" : ""}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="landing-demo-contest__footer">
            {isBuilt ? (
              <>
                {expert ? (
                  <p
                    className={
                      beatExpert
                        ? "landing-beat-experts landing-beat-experts--win"
                        : tieExpert
                          ? "landing-beat-experts landing-beat-experts--tie"
                          : "landing-beat-experts"
                    }
                  >
                    {beatExpert
                      ? `You beat ${expert.label} (${projectedScore} vs ${expertScore} projected).`
                      : tieExpert
                        ? `Tied ${expert.label} at ${projectedScore} projected.`
                        : `${expert.label} leads ${expertScore} to ${projectedScore} — swap a pick and try again.`}
                  </p>
                ) : null}
                <p>
                  Spent {wakiCashSpent}/{salaryCap} WakiCash · {guestSaved ? "Guest lineup saved on this device." : "Save locally without an account."}
                </p>
                <div className="landing-demo-contest__footer-actions">
                  <button type="button" className="dash-ghost-btn" onClick={handleSaveGuestLineup}>
                    {guestSaved ? "Saved ✓" : "Save guest lineup"}
                  </button>
                  <Link
                    className="dash-main-btn landing-demo-contest__signup"
                    to="/auth?mode=register&from=demo"
                    onClick={() => trackRegisterFromDemoClick()}
                  >
                    Enter real contests — free account
                  </Link>
                  <button
                    type="button"
                    className="dash-ghost-btn"
                    onClick={() => {
                      clearGuestLineup();
                      setSelectedNames([]);
                      setGuestSaved(false);
                      demoCompletedRef.current = false;
                      beatTrackedRef.current = false;
                    }}
                  >
                    Clear lineup
                  </button>
                </div>
              </>
            ) : isFull && wakiCashRemaining < 0 ? (
              <p>Over budget by {Math.abs(wakiCashRemaining)} WakiCash — swap a player to finish.</p>
            ) : (
              <p>
                Choose {rosterSize - selectedPlayers.length} more — {wakiCashRemaining} WakiCash left.
              </p>
            )}
          </div>
        </>
      ) : null}
    </section>
  );
}
