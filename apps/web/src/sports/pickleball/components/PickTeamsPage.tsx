import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { apiPut } from "../../../api";
import { trackPickTeamsView, trackLineupSaved } from "../../../lib/analytics";
import { clearPendingTournamentLineup, loadPendingTournamentLineup } from "../../../lib/pendingLineup";
import type { SessionUser } from "../../../App";
import WeekPicksHelpCue from "../../../components/WeekPicksHelpCue";
import WeekPicksPromoBanner from "../../../components/WeekPicksPromoBanner";
import { useDashboardDataRequired } from "../context/DashboardDataContext";
import FantasyTournamentSection from "../../../components/FantasyTournamentSection";
import "../../../components/dashboard.css";

type Props = {
  user: SessionUser;
  onRosterSaved?: () => void | Promise<void>;
};

export default function PickTeamsPage({ user, onRosterSaved }: Props) {
  const { reload } = useDashboardDataRequired();
  const pendingAppliedRef = useRef(false);

  useEffect(() => {
    trackPickTeamsView();
  }, []);

  useEffect(() => {
    if (pendingAppliedRef.current) return;
    const pending = loadPendingTournamentLineup();
    if (!pending) return;
    pendingAppliedRef.current = true;
    void (async () => {
      try {
        const enc = encodeURIComponent(pending.tournament_key);
        await apiPut(`/api/v1/fantasy-tournament/${enc}/lineup`, {
          season_key: pending.season_key,
          events: pending.events,
        });
        clearPendingTournamentLineup();
        trackLineupSaved("pickleball", pending.tournament_key);
        await reload();
      } catch {
        pendingAppliedRef.current = false;
      }
    })();
  }, [reload]);

  return (
    <div className="pick-teams-shell">
      <header className="pick-teams-head">
        <div>
          <h1 className="pick-teams-title">Pick / Edit Teams</h1>
          <p className="pick-teams-sub">
            Signed in as <strong>{user.display_name || user.email}</strong>
          </p>
        </div>
        <div className="dash-head-actions">
          <Link className="dash-ghost-btn" to="/scoring-table">
            Scoring table
          </Link>
          <Link className="dash-ghost-btn" to="/pick-teams/leaderboard">
            Season leaderboard
          </Link>
          <Link className="dash-ghost-btn" to="/pickleball/rankings">
            Player rankings
          </Link>
          <Link className="dash-ghost-btn" to="/rosters">
            My Rosters
          </Link>
          <Link className="dash-ghost-btn" to="/">
            Back to dashboard
          </Link>
        </div>
      </header>
      <WeekPicksPromoBanner sport="pickleball" />
      <WeekPicksHelpCue sport="pickleball" />
      <FantasyTournamentSection
        pageLayout
        onRosterSaved={async () => {
          await onRosterSaved?.();
          await reload();
        }}
      />
    </div>
  );
}
