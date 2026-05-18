import { Link } from "react-router-dom";
import { useEffect } from "react";
import { trackPickTeamsView } from "../../../lib/analytics";
import MarketingSiteHeader from "../../../components/MarketingSiteHeader";
import WeekPicksHelpCue from "../../../components/WeekPicksHelpCue";
import WeekPicksPromoBanner from "../../../components/WeekPicksPromoBanner";
import FantasyTournamentSection from "../../../components/FantasyTournamentSection";
import "../../../components/dashboard.css";

export default function PublicPickTeamsPage() {
  useEffect(() => {
    trackPickTeamsView();
  }, []);

  return (
    <div className="marketing-page">
      <div style={{ maxWidth: 1140, margin: "0 auto", padding: "20px 16px 48px", color: "#e5e7eb" }}>
        <MarketingSiteHeader sticky registerFrom="pick_teams" />

        <p className="marketing-breadcrumb">
          <Link to="/">← Back to home</Link>
        </p>

        <header className="pick-teams-head" style={{ marginBottom: 16 }}>
          <div>
            <p className="season-lb-kicker">Next tournament slate</p>
            <h1 className="pick-teams-title">Build your pickleball lineup</h1>
            <p className="pick-teams-sub">
              Pick players for the upcoming MLP stop with WakiCash, set your captain, then save your lineup — you&apos;ll
              create a free account to enter the contest.
            </p>
          </div>
          <div className="dash-head-actions">
            <Link className="dash-ghost-btn" to="/pickleball/rankings">
              Player rankings
            </Link>
            <Link className="dash-ghost-btn" to="/leaderboard/pickleball">
              Leaderboard
            </Link>
            <Link className="dash-main-btn" to="/auth?mode=register&from=pick_teams">
              Create free account
            </Link>
          </div>
        </header>

        <WeekPicksPromoBanner sport="pickleball" />
        <WeekPicksHelpCue sport="pickleball" />
        <FantasyTournamentSection pageLayout saveRequiresAuth />
      </div>
    </div>
  );
}
