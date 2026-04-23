import type { SessionUser } from "../App";
import FantasyTournamentSection from "./FantasyTournamentSection";
import "./dashboard.css";

type Props = {
  user: SessionUser;
  onRosterSaved?: () => void | Promise<void>;
};

export default function PickTeamsPage({ user, onRosterSaved }: Props) {
  return (
    <div className="pick-teams-shell">
      <header className="pick-teams-head">
        <div>
          <h1 className="pick-teams-title">Pick / Edit Teams</h1>
          <p className="pick-teams-sub">
            Signed in as <strong>{user.display_name || user.email}</strong>
          </p>
        </div>
        <a className="dash-ghost-btn" href="/">
          Back to dashboard
        </a>
      </header>
      <FantasyTournamentSection pageLayout onRosterSaved={onRosterSaved} />
    </div>
  );
}
