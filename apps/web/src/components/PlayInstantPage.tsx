import { Link } from "react-router-dom";
import GuestDemoContest from "./GuestDemoContest";
import { trackPlayInstantClick } from "../lib/analytics";
import "./dashboard.css";

export default function PlayInstantPage() {
  return (
    <div className="marketing-page">
      <div style={{ maxWidth: 1140, margin: "0 auto", padding: "20px 16px 48px", color: "#e5e7eb" }}>
        <header className="marketing-header">
          <Link to="/">
            <img src="/brand/logo-primary.svg" alt="WakiBet" style={{ height: 34, width: "auto" }} />
          </Link>
          <nav style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link className="dash-ghost-btn" to="/leaderboard/pickleball">
              Leaderboards
            </Link>
            <Link
              className="dash-ghost-btn"
              to="/auth?mode=login"
              onClick={() => trackPlayInstantClick("play_page_login")}
            >
              Log in
            </Link>
            <Link
              className="dash-main-btn"
              to="/auth?mode=register&from=play"
              onClick={() => trackPlayInstantClick("play_page_register")}
            >
              Create free account
            </Link>
          </nav>
        </header>

        <section className="landing-hero landing-hero--compact" style={{ marginBottom: 16 }}>
          <p className="landing-hero__eyebrow">No signup required</p>
          <h1 className="landing-hero__title">Build a fantasy lineup in 60 seconds</h1>
          <p className="landing-hero__lede">
            Pick players with WakiCash, see your projected score, beat the WakiBet expert lineup, and save your guest
            roster on this device. Free to play for pickleball, lacrosse, volleyball, and WSOP fantasy.
          </p>
        </section>

        <GuestDemoContest />

        <p className="dash-sub" style={{ marginTop: 24, textAlign: "center" }}>
          <Link to="/">← Back to home</Link>
          {" · "}
          <Link to="/pickleball/rankings">PPA rankings</Link>
          {" · "}
          <Link to="/leaderboard/pickleball">Public leaderboard</Link>
        </p>
      </div>
    </div>
  );
}
