import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import type { SessionUser } from "../../App";
import SportStandingsSection from "./SportStandingsSection";

type Props = {
  user: SessionUser;
  title: string;
  kicker: string;
  backHref: string;
  backLabel: string;
  extraNav?: ReactNode;
  sportLabel: string;
  fantasyEndpoint: string;
  fantasyQueryKey: readonly unknown[];
  fantasyKicker: string;
  fantasySignInPrompt: string;
};

export default function SportStandingsPage({
  user,
  title,
  kicker,
  backHref,
  backLabel,
  extraNav,
  sportLabel,
  fantasyEndpoint,
  fantasyQueryKey,
  fantasyKicker,
  fantasySignInPrompt,
}: Props) {
  return (
    <div className="pick-teams-shell">
      <header className="pick-teams-head">
        <div>
          <p className="season-lb-kicker">{kicker}</p>
          <h1 className="pick-teams-title">{title}</h1>
          <p className="pick-teams-sub">
            Signed in as <strong>{user.display_name || user.email}</strong>
          </p>
        </div>
        <div className="dash-head-actions">
          {extraNav}
          <Link className="dash-ghost-btn" to={backHref}>
            {backLabel}
          </Link>
          <Link className="dash-ghost-btn" to="/">
            Dashboard
          </Link>
        </div>
      </header>

      <SportStandingsSection
        headless
        user={user}
        sportLabel={sportLabel}
        fantasyEndpoint={fantasyEndpoint}
        fantasyQueryKey={fantasyQueryKey}
        fantasyKicker={fantasyKicker}
        fantasySignInPrompt={fantasySignInPrompt}
      />
    </div>
  );
}
