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

          <section className="dash-card">
            <div className="dash-label">Recent Picks</div>
            {preview.recent_bets.length ? preview.recent_bets.slice(0, 4).map((b) => (
              <div className="dash-list-item" key={b.selection_id}><div>{b.market_label}</div><small>{b.pick} - {b.status}</small></div>
            )) : <p className="dash-empty">No picks yet. Enter a contest to build a lineup.</p>}
          </section>
        </div>
      )}

      <p className="dash-footnote">Dashboard upgraded with profile and wallet activity. Next: live contests and leaderboard modules.</p>
    </div>
  );
}
