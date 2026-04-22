import { WINTER_FANTASY_RULES } from "@wakibet/shared";
import { FormEvent, useState, type ReactNode } from "react";
import { apiPost } from "../api";

function StaticLayout({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="static-page-wrap">
      <div className="static-page-card">
        <div className="dash-head" style={{ marginBottom: 8 }}>
          <h1 style={{ margin: 0 }}>{title}</h1>
          <a className="dash-ghost-btn" href="/">
            Back to WakiBet ワキベット
          </a>
        </div>
        <div className="static-page-body">{children}</div>
      </div>
    </div>
  );
}

export function TermsPage() {
  return (
    <StaticLayout title="Terms of Use">
      <p>Welcome to WakiBet.</p>
      <p>By accessing or using WakiBet, you agree to the following terms:</p>
      <h3>1. Use of the Platform</h3>
      <p>
        WakiBet is a fantasy sports-style platform designed for entertainment purposes only. Users may create picks,
        track performance, and participate in prediction-based activities.
      </p>
      <h3>2. No Gambling or Wagering</h3>
      <p>WakiBet does not offer real-money wagering, betting, or gambling. No cash prizes are awarded.</p>
      <h3>3. Eligibility</h3>
      <p>You must be at least 18 years old to use this platform.</p>
      <h3>4. User Conduct</h3>
      <ul>
        <li>Use the platform for illegal activities</li>
        <li>Attempt to manipulate scoring or results</li>
        <li>Abuse or disrupt the platform</li>
      </ul>
      <h3>5. Data Accuracy</h3>
      <p>
        Tournament data, player information, and results may contain errors or delays. WakiBet is not responsible for
        incorrect data.
      </p>
      <h3>6. Account Responsibility</h3>
      <p>You are responsible for maintaining the confidentiality of your account.</p>
      <h3>7. Changes to Terms</h3>
      <p>We may update these terms at any time. Continued use of the platform constitutes acceptance.</p>
      <h3>8. Contact</h3>
      <p>
        For questions, contact <a href="mailto:support@wakibet.com">support@wakibet.com</a>.
      </p>
    </StaticLayout>
  );
}

export function PrivacyPage() {
  return (
    <StaticLayout title="Privacy Policy">
      <p>WakiBet respects your privacy.</p>
      <h3>1. Information We Collect</h3>
      <ul>
        <li>Name</li>
        <li>Email address</li>
        <li>Usage data (app interactions)</li>
      </ul>
      <h3>2. How We Use Information</h3>
      <ul>
        <li>To operate and improve the platform</li>
        <li>To respond to support requests</li>
        <li>To communicate updates (if opted in)</li>
      </ul>
      <h3>3. Data Sharing</h3>
      <p>We do not sell or share personal data with third parties except as required by law.</p>
      <h3>4. Security</h3>
      <p>We take reasonable measures to protect your data, but no system is completely secure.</p>
      <h3>5. Cookies</h3>
      <p>We may use cookies to improve user experience.</p>
      <h3>6. Your Rights</h3>
      <p>
        You may request deletion of your data by contacting{" "}
        <a href="mailto:support@wakibet.com">support@wakibet.com</a>.
      </p>
      <h3>7. Contact</h3>
      <p>
        <a href="mailto:support@wakibet.com">support@wakibet.com</a>
      </p>
    </StaticLayout>
  );
}

export function ResponsiblePlayPage() {
  return (
    <StaticLayout title="Responsible Play">
      <p>WakiBet is designed as a fun, competitive, and social experience.</p>
      <h3>1. Entertainment Only</h3>
      <p>This platform is for entertainment and skill-based play. No real-money wagering is involved.</p>
      <h3>2. Healthy Play</h3>
      <ul>
        <li>Take breaks</li>
        <li>Avoid excessive use</li>
        <li>Keep gameplay fun and social</li>
      </ul>
      <h3>3. No Financial Risk</h3>
      <p>There is no risk of financial loss on WakiBet.</p>
      <h3>4. Future Features</h3>
      <p>
        If WakiBet introduces prizes or paid features in the future, additional safeguards and policies will be
        implemented.
      </p>
      <h3>5. Contact</h3>
      <p>
        If you have concerns about your usage, contact <a href="mailto:support@wakibet.com">support@wakibet.com</a>.
      </p>
    </StaticLayout>
  );
}

const TOPICS = [
  "General Support",
  "Fantasy Scoring Issue",
  "Tournament Data",
  "Report a Bug",
  "Partnership / Promo",
] as const;

export function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [topic, setTopic] = useState<string>("General Support");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [ok, setOk] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setOk(null);
    setErr(null);
    try {
      setBusy(true);
      const res = await apiPost<{ ok: true; message: string }>("/api/v1/public/contact", {
        name,
        email,
        topic,
        subject,
        message,
      });
      setOk(res.message);
      setSubject("");
      setMessage("");
    } catch (error) {
      setErr(error instanceof Error ? error.message : "Could not send your message.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <StaticLayout title="Contact Us">
      <p>Send us a message and we will reply to your email.</p>
      <p className="contact-fallback">
        If sending fails, email us directly at{" "}
        <a href="mailto:support@wakibet.com">support@wakibet.com</a>.
      </p>
      <form className="contact-form" onSubmit={onSubmit}>
        <label>
          Name
          <input value={name} onChange={(e) => setName(e.target.value)} minLength={2} required />
        </label>
        <label>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label>
          Topic (optional)
          <select value={topic} onChange={(e) => setTopic(e.target.value)}>
            {TOPICS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <label>
          Subject
          <input value={subject} onChange={(e) => setSubject(e.target.value)} minLength={3} required />
        </label>
        <label>
          Message
          <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={6} minLength={10} required />
        </label>
        <button className="dash-main-btn" type="submit" disabled={busy}>
          {busy ? "Sending..." : "Send message"}
        </button>
        {ok && <p style={{ color: "#166534", marginBottom: 0 }}>{ok}</p>}
        {err && <p style={{ color: "#b91c1c", marginBottom: 0 }}>{err}</p>}
      </form>
    </StaticLayout>
  );
}

function ScoringBlock({ title, rows }: { title: string; rows: { label: string; pts: string }[] }) {
  return (
    <section className="scoring-block">
      <h3 className="scoring-block-title">{title}</h3>
      <div className="scoring-rows">
        {rows.map((row) => (
          <div key={row.label} className="scoring-row">
            <span className="scoring-label">{row.label}</span>
            <span className="scoring-pts">{row.pts}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export function ScoringTablePage() {
  const r = WINTER_FANTASY_RULES;
  return (
    <StaticLayout title="WakiPoints — Full Table (v3)">
      <p className="scoring-lede">
        <strong>WakiPoints</strong> stack <em>base</em>, <em>performance</em>, <em>progression</em>, and{" "}
        <em>Waki bonuses</em> when tournament data includes the right fields. Captain multiplies one slot&apos;s{" "}
        <strong>base</strong> total by {r.captainMultiplier}× on your roster.
      </p>

      <div className="scoring-example" role="note">
        <div className="scoring-example-kicker">Example</div>
        <p className="scoring-example-body">
          Bauer wins an upset match with big margin: <strong>+{r.matchWinPoints} match</strong> +{" "}
          <strong>+{r.upsetWinPoints} upset</strong> + <strong>+{r.winMargin8PlusPoints} margin (8+)</strong> ={" "}
          <strong className="scoring-example-total">{r.matchWinPoints + r.upsetWinPoints + r.winMargin8PlusPoints} WakiPoints</strong>{" "}
          from that result row (medals / playoff legs would add on top when the schedule marks them).
        </p>
      </div>

      <div className="scoring-board">
        <ScoringBlock
          title="Core match scoring"
          rows={[
            { label: "Match win", pts: `+${r.matchWinPoints}` },
            { label: "Match loss", pts: "0" },
            { label: "Forfeit win", pts: `+${r.forfeitWinPoints}` },
          ]}
        />
        <ScoringBlock
          title="Performance bonuses"
          rows={[
            { label: "Win by 5–7 points", pts: `+${r.winMargin57Points}` },
            { label: "Win by 8+ points", pts: `+${r.winMargin8PlusPoints}` },
            { label: "Shutout (11–0)", pts: `+${r.shutout110Points}` },
            { label: "Comeback win (down ≥5, flagged)", pts: `+${r.comebackWinPoints}` },
          ]}
        />
        <ScoringBlock
          title="Tournament progression"
          rows={[
            { label: "Qualify for playoffs (stage text)", pts: `+${r.playoffQualifyPoints}` },
            { label: "Quarterfinal win", pts: `+${r.quarterfinalWinPoints}` },
            { label: "Semifinal win", pts: `+${r.semifinalWinPoints}` },
            { label: "Final win", pts: `+${r.finalWinPoints}` },
            { label: "Gold medal", pts: `+${r.goldMedalPoints}` },
            { label: "Silver medal", pts: `+${r.silverMedalPoints}` },
            { label: "Bronze medal", pts: `+${r.bronzeMedalPoints}` },
          ]}
        />
        <ScoringBlock
          title="Signature Waki bonuses"
          rows={[
            { label: "Upset win (flagged)", pts: `+${r.upsetWinPoints}` },
            { label: "Beat top-3 seed (seeds on match)", pts: `+${r.beatTop3SeedPoints}` },
            { label: "Low-owned pick (<20% users, flagged)", pts: `+${r.lowOwnedPickPoints}` },
            { label: "Captain pick", pts: `×${r.captainMultiplier} on that player’s base` },
          ]}
        />
        <ScoringBlock
          title="Streak & consistency"
          rows={[
            { label: "3-match win streak (division)", pts: `+${r.winStreak3Points}` },
            { label: "5-match win streak (division)", pts: `+${r.winStreak5Points}` },
            { label: "Undefeated pool (flagged)", pts: `+${r.undefeatedPoolPoints}` },
            { label: "Perfect tournament — no losses (division)", pts: `+${r.perfectTournamentDivisionPoints}` },
          ]}
        />
        <ScoringBlock
          title="High-impact specials"
          rows={[
            { label: "Double medal (two divisions, flagged)", pts: `+${r.doubleMedalTwoDivisionsPoints}` },
            { label: "Triple play — 3+ wins same calendar day", pts: `+${r.triplePlaySameDayPoints} per qualifying day` },
            { label: "Partner upset combo (flagged)", pts: `+${r.partnerUpsetComboPoints}` },
          ]}
        />
        <ScoringBlock
          title="Penalties (optional)"
          rows={[
            { label: "Early elimination (0 wins, 4+ finished matches)", pts: `${r.earlyEliminationPenalty}` },
            { label: "Favorite upset loss (seeds + upset flag)", pts: `${r.favoriteUpsetLossPenalty}` },
          ]}
        />
      </div>

      <div className="scoring-lite">
        <h3 className="scoring-block-title">Mental “lite mode”</h3>
        <p className="scoring-lite-body">
          Win {r.matchWinPoints} · Playoffs {r.playoffQualifyPoints} · Gold {r.goldMedalPoints} · Upset {r.upsetWinPoints}{" "}
          · Undefeated pool {r.undefeatedPoolPoints} — the engine still awards deeper lines whenever the JSON carries
          scores, seeds, and stage labels.
        </p>
      </div>

      <p className="scoring-foot">
        Rules version <strong>{r.version}</strong>. Rows without the needed fields in schedule data simply award 0 for
        that category. Streaks / perfect run / triple-play are computed from results in the division slice.
      </p>
    </StaticLayout>
  );
}
