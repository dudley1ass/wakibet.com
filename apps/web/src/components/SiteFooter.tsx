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

        <nav className="site-footer-links" aria-label="Footer links">
          <a href="/terms">Terms of Use</a>
          <a href="/privacy">Privacy Policy</a>
          <a href="/scoring-table">Scoring Table</a>
          <a href="/fantasy-rules">How fantasy works</a>
          <a href="/rosters">My Rosters</a>
          <a href="/pick-teams">Pick / Edit Teams</a>
          <a href="/contact">Contact</a>
          <a href="/responsible-play">Responsible Play</a>
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
    </footer>
  );
}
