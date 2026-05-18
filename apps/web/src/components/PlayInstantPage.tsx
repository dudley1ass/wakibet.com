import { Link } from "react-router-dom";
import GuestDemoContest from "./GuestDemoContest";
import MarketingSiteHeader from "./MarketingSiteHeader";
import "./dashboard.css";

export default function PlayInstantPage() {
  return (
    <div className="marketing-page">
      <div style={{ maxWidth: 1140, margin: "0 auto", padding: "20px 16px 48px", color: "#e5e7eb" }}>
        <MarketingSiteHeader sticky registerFrom="play" />

        <p className="marketing-breadcrumb">
          <Link to="/">← Back to home</Link>
        </p>

        <section className="landing-hero landing-hero--compact" style={{ marginBottom: 16 }}>
          <div className="landing-hero__mesh" aria-hidden />
          <div className="landing-hero__grid">
            <p className="landing-hero__eyebrow">No signup required</p>
            <h1 className="landing-hero__title">Build a fantasy lineup in 60 seconds</h1>
            <p className="landing-hero__lede">
              Pick players with WakiCash, see your projected score, beat the WakiBet expert lineup, and save your guest
              roster on this device. Free to play for pickleball, lacrosse, volleyball, and WSOP fantasy.
            </p>
          </div>
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
