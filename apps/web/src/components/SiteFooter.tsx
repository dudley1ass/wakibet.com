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
              <a href="/terms">Terms of Use</a>
              <a href="/privacy">Privacy Policy</a>
              <a href="/scoring-table">Scoring Table</a>
              <a href="/fantasy-rules">How fantasy works</a>
            </div>
            <div className="site-footer-links site-footer-links--app">
              <a href="/rosters">My Rosters</a>
              <a href="/pick-teams">Pick / Edit Teams</a>
              <a href="/contact">Contact</a>
              <a href="/responsible-play">Responsible Play</a>
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
