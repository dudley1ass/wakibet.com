import { MLP_TEAM_FANTASY_RULES, WINTER_FANTASY_RULES } from "@wakibet/shared";
import { FormEvent, useState, type ReactNode } from "react";
import { apiPost } from "../api";

function StaticLayout({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="static-page-wrap">
      <div className="static-page-card">
        <div className="dash-head" style={{ marginBottom: 8 }}>
          <h1 style={{ margin: 0 }}>{title}</h1>
          <a className="dash-ghost-btn" href="/">
            Back to Dashboard
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
        For questions, contact <a href="mailto:wakibet.app@gmail.com">wakibet.app@gmail.com</a>.
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
        <a href="mailto:wakibet.app@gmail.com">wakibet.app@gmail.com</a>.
      </p>
      <h3>7. Contact</h3>
      <p>
        <a href="mailto:wakibet.app@gmail.com">wakibet.app@gmail.com</a>
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
        If you have concerns about your usage, contact <a href="mailto:wakibet.app@gmail.com">wakibet.app@gmail.com</a>.
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
        <a href="mailto:wakibet.app@gmail.com">wakibet.app@gmail.com</a>.
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
  const mlpT = MLP_TEAM_FANTASY_RULES;
  return (
    <StaticLayout title="WakiPoints — Full Table (v3)">
      <p className="scoring-lede">
        WakiPoints are built from multiple layers:
        <br />
        Base points
        <br />
        Performance in matches
        <br />
        Progression through the tournament
        <br />
        Bonus points (when available)
        <br />
        <br />
        All of these combine to create a player&apos;s total score.
        <br />
        <br />
        <strong>PPA-style events</strong> use only this player table. <strong>MLP tournament fantasy</strong> keeps the
        same player rules, and adds a small <strong>team bonus layer</strong> (one franchise pick per event) so you
        capture both individual performance and team outcomes — see the MLP team block below.
        <br />
        <br />
        You can also assign a Captain on your roster -
        <br />
        that player earns {r.captainMultiplier}× points, giving you a strategic edge.
      </p>

      <div className="scoring-example" role="note">
        <div className="scoring-example-kicker">Example</div>
        <p className="scoring-example-body">
          If Bauer pulls off an upset win by a large margin, he earns points from each part of that result:
          <br />
          <br />
          <strong>+{r.matchWinPoints}</strong> for the match win
          <br />
          <strong>+{r.upsetWinPoints}</strong> for the upset
          <br />
          <strong>+{r.winMargin8PlusPoints}</strong> for winning by 8+ points
          <br />
          <br />
          That&apos;s{" "}
          <strong className="scoring-example-total">
            {r.matchWinPoints + r.upsetWinPoints + r.winMargin8PlusPoints} WakiPoints
          </strong>{" "}
          total for that match.
          <br />
          <br />
          Any bonus points from medals or playoff rounds are added separately when applicable.
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
          title="Penalties"
          rows={[
            { label: "Early elimination (0 wins, 4+ finished matches)", pts: `${r.earlyEliminationPenalty}` },
            { label: "Favorite upset loss (seeds + upset flag)", pts: `${r.favoriteUpsetLossPenalty}` },
          ]}
        />
        <ScoringBlock
          title="MLP team bonus (tournament fantasy — bonus layer)"
          rows={[
            {
              label: "Team credited when your franchise wins a finished match row",
              pts: `+${mlpT.teamMatchWinPoints} each`,
            },
            {
              label: "Team event win (clincher flag on schedule, or gold medal + final/championship stage — once per event)",
              pts: `+${mlpT.teamEventWinPoints}`,
            },
            {
              label: "Team undefeated in this event division (every match decided, zero losses)",
              pts: `+${mlpT.teamUndefeatedBonusPoints}`,
            },
          ]}
        />
      </div>
    </StaticLayout>
  );
}

export function FantasyRulesPage() {
  return (
    <StaticLayout title="How Fantasy Works (v1)">
      <p>
        WakiBet fantasy is <strong>season-long WakiPoints</strong>: you pick players who earn points from real
        schedule results. These rules are what the app enforces today.
      </p>

      <h3>WakiCash</h3>
      <ul>
        <li>
          <strong>Tournament fantasy:</strong> you get <strong>100 WakiCash per tournament</strong> to spend across
          up to <strong>five events</strong> in that tournament. Stronger events (tier A) cost a bit more; weaker ones
          (tier C) cost less.
        </li>
        <li>
          <strong>Division fantasy (classic):</strong> still 100 WakiCash per featured division lineup.
        </li>
        <li>Prices scale with skill band and a stable hash so every pool has stars and sleepers.</li>
      </ul>

      <h3>What You Pick (Tournament Mode)</h3>
      <ul>
        <li>Up to <strong>five different events</strong> per tournament — <strong>fewer is allowed</strong>; empty slots
          are fine.</li>
        <li>Each saved event needs <strong>five different players</strong> from that event’s schedule and{" "}
          <strong>one captain</strong> (captain scores 1.5× on that event).</li>
        <li>
          The <strong>same player cannot appear twice</strong> in one tournament lineup, even across two events.
        </li>
        <li>Doubles brackets still use <strong>individual player names</strong> from the draw (no separate “team” pick
          yet).</li>
      </ul>

      <h3>Locks</h3>
      <ul>
        <li>Each <strong>event locks on its own</strong> one hour before its first listed match time.</li>
        <li>After lock, that event’s lineup cannot change; <strong>other events in the same tournament</strong> can
          still be edited until they lock.</li>
        <li>Times come from the tournament schedule we import; if a start time moves, the lock window moves with it
          until you are locked.</li>
      </ul>

      <h3>Which Events You Can Play</h3>
      <ul>
        <li>Only events with at least <strong>6 teams/players</strong> appear in the picker.</li>
        <li>Events can be tier <strong>A / B / C</strong> for price and WakiPoints weighting.</li>
      </ul>

      <h3>Season Score & Ties</h3>
      <ul>
        <li>Your season total is the <strong>sum of WakiPoints</strong> from all your lineups on loaded schedules.</li>
        <li>Skip a tournament → <strong>0 points</strong> for that stop (no penalty row).</li>
        <li>
          <strong>Tie-breakers:</strong> higher points first; if tied, alphabetical display name; if still tied,
          internal account order. Same points can share the same rank.
        </li>
      </ul>

      <p className="scoring-foot">
        For point details, see the <a href="/scoring-table">Scoring table</a>.
      </p>
    </StaticLayout>
  );
}

export function WakiOddsPage() {
  return (
    <StaticLayout title="WakiOdds — Calculation Table">
      <p>
        WakiOdds is Wakibet&apos;s in-house line engine. It converts player ratings into win probability, American odds,
        spread, and confidence.
      </p>

      <h3>1) Base Player Rating</h3>
      <p>
        Every player starts at <strong>R0 = 1500</strong>.
      </p>

      <h3>2) Team Rating (Doubles)</h3>
      <p>
        <code>Rteam = (R1 + R2) / 2 + C + F - P</code>
      </p>
      <ul>
        <li>
          <strong>C</strong>: chemistry bonus (0 to +50)
        </li>
        <li>
          <strong>F</strong>: recent form (-50 to +50)
        </li>
        <li>
          <strong>P</strong>: uncertainty penalty (0 to 50)
        </li>
      </ul>

      <h3>3) Win Probability (Elo)</h3>
      <p>
        <code>E = 1 / (1 + 10^(-(RA - RB) / 400))</code>
      </p>

      <h3>4) Probability to American Odds</h3>
      <ul>
        <li>
          Favorite (P &gt; 0.5): <code>-100 * P / (1 - P)</code>
        </li>
        <li>
          Underdog (P &lt; 0.5): <code>+100 * (1 - P) / P</code>
        </li>
      </ul>

      <h3>5) Spread</h3>
      <p>
        <code>Spread = (RA - RB) / 50</code>, rounded to half-points.
      </p>

      <h3>6) Confidence</h3>
      <p>
        <code>Confidence = abs(P - 0.5) * 100</code>
      </p>

      <h3>7) Rating Update After Match</h3>
      <p>
        <code>R&apos; = R + K * (S - E)</code> where S is 1 for win and 0 for loss.
      </p>
      <p>
        Optional margin boost: <code>R&apos; = R + K * (S - E) * log(|scoreDiff| + 1)</code>
      </p>

      <h3>Example Output</h3>
      <ul>
        <li>Team A rating: 1640</li>
        <li>Team B rating: 1510</li>
        <li>Win probability: Team A 68%, Team B 32%</li>
        <li>American odds: Team A -213, Team B +213</li>
        <li>Spread: Team A -2.5</li>
        <li>Confidence: 18</li>
      </ul>
    </StaticLayout>
  );
}
