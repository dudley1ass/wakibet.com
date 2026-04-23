import { Link } from "react-router-dom";

const SOCIALS = [
  { label: "TikTok", href: "#" },
  { label: "Facebook", href: "#" },
  { label: "Instagram", href: "#" },
  { label: "X/Twitter", href: "#" },
  { label: "YouTube", href: "#" },
];

export default function SiteFooter() {
  const liveSocials = SOCIALS.filter((s) => s.href !== "#");
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="site-footer-brand">
          <div className="site-footer-title">
            WakiBet <span className="brand-jp">ワキベット</span>
          </div>
          <div className="site-footer-copy">© 2026 WakiBet. All rights reserved.</div>
          <div className="site-footer-disclaimer">
            For entertainment purposes only. No real-money wagering.
          </div>
        </div>

        <div className="site-footer-right">
          <nav className="site-footer-nav-wrap" aria-label="Footer links">
            <div className="site-footer-links site-footer-links--legal">
              <Link to="/terms">Terms of Use</Link>
              <Link to="/privacy">Privacy Policy</Link>
              <Link to="/scoring-table">Scoring Table</Link>
              <Link to="/fantasy-rules">How fantasy works</Link>
            </div>
            <div className="site-footer-links site-footer-links--app">
              <Link to="/rosters">My Rosters</Link>
              <Link to="/pick-teams">Pick / Edit Teams</Link>
              <Link to="/contact">Contact</Link>
              <Link to="/responsible-play">Responsible Play</Link>
            </div>
          </nav>

          {liveSocials.length > 0 && (
            <div className="site-footer-socials" aria-label="Social links">
              {liveSocials.map((s) => (
                <a key={s.label} href={s.href} target="_blank" rel="noreferrer">
                  {s.label}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </footer>
  );
}
