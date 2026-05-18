import { Link, useLocation } from "react-router-dom";

type Props = {
  /** Keep nav visible while scrolling lineup builder */
  sticky?: boolean;
  /** Append ?from= for register CTA (e.g. play page) */
  registerFrom?: string;
};

export default function MarketingSiteHeader({ sticky = false, registerFrom }: Props) {
  const { pathname } = useLocation();
  const onHome = pathname === "/";

  return (
    <header
      className={`marketing-header${sticky ? " marketing-header--sticky" : ""}`}
    >
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
        <Link className="dash-ghost-btn" to="/play">
          Play instantly
        </Link>
        <Link className="dash-ghost-btn" to="/leaderboard/pickleball">
          Leaderboards
        </Link>
        <Link className="dash-ghost-btn" to="/articles">
          Articles
        </Link>
        <Link className="dash-ghost-btn" to="/auth?mode=login">
          Log in
        </Link>
        <Link
          className="dash-main-btn"
          to={registerFrom ? `/auth?mode=register&from=${encodeURIComponent(registerFrom)}` : "/auth?mode=register"}
        >
          {registerFrom === "play" ? "Create free account" : "Create account"}
        </Link>
      </nav>
    </header>
  );
}
