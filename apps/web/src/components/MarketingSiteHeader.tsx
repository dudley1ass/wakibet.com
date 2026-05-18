import { Link, useLocation } from "react-router-dom";
import { trackPlayInstantClick } from "../lib/analytics";

type Props = {
  sticky?: boolean;
  registerFrom?: string;
};

export default function MarketingSiteHeader({ sticky = false, registerFrom }: Props) {
  const { pathname } = useLocation();
  const onHome = pathname === "/";
  const registerHref = registerFrom
    ? `/auth?mode=register&from=${encodeURIComponent(registerFrom)}`
    : "/auth?mode=register&from=header";

  return (
    <header className={`marketing-header${sticky ? " marketing-header--sticky" : ""}`}>
      <Link className="marketing-header__brand" to="/" aria-label="WakiBet home">
        <img src="/brand/logo-primary.svg" alt="" width={120} height={34} style={{ height: 34, width: "auto" }} />
        {!onHome ? <span className="marketing-header__home-hint">← Home</span> : null}
      </Link>
      <nav className="marketing-header__nav" aria-label="Site navigation">
        {!onHome ? (
          <Link className="dash-ghost-btn marketing-header__home-btn" to="/">
            Home
          </Link>
        ) : null}
        <Link
          className="dash-ghost-btn marketing-header__nav-quiet"
          to={onHome ? "/#this-week" : "/pick-teams"}
          onClick={() => trackPlayInstantClick("header_build_lineup")}
        >
          Build lineup
        </Link>
        {!onHome ? (
          <Link className="dash-ghost-btn marketing-header__nav-quiet" to="/leaderboard/pickleball">
            Leaderboards
          </Link>
        ) : null}
        <Link className="dash-ghost-btn marketing-header__nav-quiet" to="/auth?mode=login">
          Log in
        </Link>
        <Link className="dash-main-btn marketing-header__cta-primary" to={registerHref}>
          Create free account
        </Link>
      </nav>
    </header>
  );
}
