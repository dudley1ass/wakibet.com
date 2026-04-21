import { useState } from "react";
import { apiGet } from "../api";
import type { SessionUser } from "../App";
import "./dashboard.css";

type DashboardData = {
  balance_cents: number;
  summary: { wins: number; losses: number; pending: number };
  profile: {
    display_name: string;
    email: string;
    state: string | null;
    country: string;
    joined_at: string;
  };
  wallet_activity: {
    id: string;
    type: string;
    amount_dills: number;
    created_at: string;
  }[];
  open_contests: {
    id: string;
    name: string;
    entry_fee_dills: number;
    status: string;
  }[];
  winter_springs: {
    tournament_name: string;
    generated_matches: number;
    my_upcoming_matches: {
      match_id: string;
      event_type: string;
      skill_level: string;
      age_bracket: string;
      event_date: string;
      opponent: string;
    }[];
    featured_matches: {
      match_id: string;
      event_type: string;
      event_date: string;
      player_a: string;
      player_b: string;
    }[];
  };
  recent_bets: {
    selection_id: string;
    market_label: string;
    pick: string;
    status: string;
  }[];
};

type Props = {
  user: SessionUser;
  onLogout: () => void;
};

export default function Dashboard({ user, onLogout }: Props) {
  const [preview, setPreview] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLoadDashboard() {
    setError(null);
    try {
      setLoading(true);
      const data = await apiGet<DashboardData>("/api/v1/users/me/dashboard");
      setPreview(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load dashboard.");
    } finally {
      setLoading(false);
    }
  }

  const joined = preview ? new Date(preview.profile.joined_at).toLocaleDateString() : "--";
  const balanceDills = preview ? (preview.balance_cents / 100).toFixed(2) : "0.00";
  const totalBets = preview ? preview.summary.wins + preview.summary.losses + preview.summary.pending : 0;

  return (
    <div className="dash-shell">
      <div className="dash-head">
        <div>
          <h1>WakiBet</h1>
          <p>
            Welcome back, <strong>{user.display_name || user.email}</strong>
          </p>
        </div>
        <button type="button" onClick={onLogout} className="dash-ghost-btn">
          Log out
        </button>
      </div>

      <button type="button" onClick={() => void handleLoadDashboard()} disabled={loading} className="dash-main-btn">
        {loading ? "Refreshing..." : "Refresh dashboard"}
      </button>

      {error && <p className="dash-error">{error}</p>}

      {preview && (
        <div className="dash-grid">
          <section className="dash-card">
            <div className="dash-label">Available Balance</div>
            <div className="dash-big">{balanceDills} DILLS</div>
            <div className="dash-sub">Virtual wallet for contest entries</div>
          </section>

          <section className="dash-card">
            <div className="dash-label">Performance</div>
            <div className="dash-row"><span>Wins</span><strong>{preview.summary.wins}</strong></div>
            <div className="dash-row"><span>Losses</span><strong>{preview.summary.losses}</strong></div>
            <div className="dash-row"><span>Pending</span><strong>{preview.summary.pending}</strong></div>
            <div className="dash-row"><span>Total Picks</span><strong>{totalBets}</strong></div>
          </section>

          <section className="dash-card">
            <div className="dash-label">Profile</div>
            <div className="dash-row"><span>Name</span><strong>{preview.profile.display_name}</strong></div>
            <div className="dash-row"><span>Email</span><strong>{preview.profile.email}</strong></div>
            <div className="dash-row"><span>Location</span><strong>{preview.profile.state ?? "--"}, {preview.profile.country}</strong></div>
            <div className="dash-row"><span>Joined</span><strong>{joined}</strong></div>
          </section>

          <section className="dash-card dash-span-2">
            <div className="dash-label">Wallet Activity</div>
            {preview.wallet_activity.length ? (
              <table className="dash-table">
                <thead><tr><th>Type</th><th>Amount</th><th>When</th></tr></thead>
                <tbody>
                  {preview.wallet_activity.map((row) => (
                    <tr key={row.id}>
                      <td>{row.type.replaceAll("_", " ")}</td>
                      <td>{row.amount_dills.toFixed(2)} DILLS</td>
                      <td>{new Date(row.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : <p className="dash-empty">No wallet activity yet.</p>}
          </section>

          <section className="dash-card">
            <div className="dash-label">Open Contests</div>
            {preview.open_contests.length ? preview.open_contests.map((c) => (
              <div className="dash-list-item" key={c.id}><div>{c.name}</div><small>{c.entry_fee_dills} DILLS - {c.status}</small></div>
            )) : <p className="dash-empty">Contest lobby coming next.</p>}
          </section>

          <section className="dash-card dash-span-2">
            <div className="dash-label">
              {preview.winter_springs.tournament_name} - My Upcoming Matches
            </div>
            <div className="dash-sub">
              Generated test schedule: {preview.winter_springs.generated_matches} matches
            </div>
            {preview.winter_springs.my_upcoming_matches.length ? (
              <table className="dash-table">
                <thead>
                  <tr>
                    <th>Match</th>
                    <th>Event</th>
                    <th>Division</th>
                    <th>Date</th>
                    <th>Opponent</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.winter_springs.my_upcoming_matches.map((m) => (
                    <tr key={m.match_id}>
                      <td>{m.match_id}</td>
                      <td>{m.event_type}</td>
                      <td>
                        {m.skill_level} / {m.age_bracket}
                      </td>
                      <td>{m.event_date}</td>
                      <td>{m.opponent}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="dash-empty">
                No direct matches mapped to this account yet. Use your tournament full name in profile
                display_name to map test schedules.
              </p>
            )}
          </section>

          <section className="dash-card">
            <div className="dash-label">Recent Picks</div>
            {preview.recent_bets.length ? preview.recent_bets.slice(0, 4).map((b) => (
              <div className="dash-list-item" key={b.selection_id}><div>{b.market_label}</div><small>{b.pick} - {b.status}</small></div>
            )) : preview.winter_springs.featured_matches.slice(0, 4).map((m) => (
              <div className="dash-list-item" key={m.match_id}>
                <div>{m.event_type}</div>
                <small>{m.player_a} vs {m.player_b} - {m.event_date}</small>
              </div>
            ))}
          </section>
        </div>
      )}

      <p className="dash-footnote">Dashboard upgraded with profile and wallet activity. Next: live contests and leaderboard modules.</p>
    </div>
  );
}
