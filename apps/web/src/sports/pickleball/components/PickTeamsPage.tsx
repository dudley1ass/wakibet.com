import { Link } from "react-router-dom";
import type { SessionUser } from "../../../App";
import { useDashboardDataRequired } from "../context/DashboardDataContext";
import FantasyTournamentSection from "../../../components/FantasyTournamentSection";
import "../../../components/dashboard.css";

type Props = {
  user: SessionUser;
  onRosterSaved?: () => void | Promise<void>;
};

export default function PickTeamsPage({ user, onRosterSaved }: Props) {
  const { reload } = useDashboardDataRequired();

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
          <Link className="dash-ghost-btn" to="/rosters">
            My Rosters
          </Link>
          <Link className="dash-ghost-btn" to="/">
            Back to dashboard
          </Link>
        </div>
      </header>
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
