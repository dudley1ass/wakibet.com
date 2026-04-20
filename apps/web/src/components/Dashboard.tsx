import { useState } from "react";
import { apiGet } from "../api";
import type { SessionUser } from "../App";

type DashboardData = {
  balance_cents: number;
  summary: { wins: number; losses: number; pending: number };
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
    setPreview(null);
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

  return (
    <div
      style={{
        width: "100%",
        maxWidth: "900px",
        background: "rgba(255,255,255,0.92)",
        borderRadius: "16px",
        padding: "20px",
        boxShadow: "0 20px 40px rgba(0,0,0,0.12)",
        border: "1px solid rgba(180, 83, 9, 0.25)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "12px",
          alignItems: "center",
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: "20px", color: "#7f1d1d" }}>WakiBet</h1>
          <div style={{ fontSize: "11px", color: "#92400e" }}>
            Logged in as <strong>{user.display_name || user.email}</strong>
            {user.display_name ? (
              <span style={{ fontWeight: 400, color: "#b45309" }}> ({user.email})</span>
            ) : null}
          </div>
        </div>
        <button
          type="button"
          onClick={onLogout}
          style={{
            fontSize: "11px",
            padding: "6px 12px",
            borderRadius: "999px",
            border: "1px solid #fdba74",
            background: "white",
            color: "#9a3412",
            cursor: "pointer",
          }}
        >
          Log out
        </button>
      </div>

      <button
        type="button"
        onClick={() => void handleLoadDashboard()}
        disabled={loading}
        style={{
          marginTop: "4px",
          padding: "10px 16px",
          borderRadius: "999px",
          border: "none",
          background: "linear-gradient(135deg, #b45309, #7f1d1d)",
          color: "white",
          fontWeight: "600",
          cursor: loading ? "wait" : "pointer",
          opacity: loading ? 0.7 : 1,
        }}
      >
        {loading ? "Loading…" : "Load my dashboard"}
      </button>

      {error && <p style={{ marginTop: "10px", fontSize: "12px", color: "#b91c1c" }}>{error}</p>}

      {preview && (
        <div style={{ marginTop: "16px", fontSize: "13px", color: "#422006" }}>
          <p style={{ margin: "0 0 8px", fontWeight: 600 }}>
            Balance: {(preview.balance_cents / 100).toFixed(2)} credits
          </p>
          <p style={{ margin: "0 0 8px", fontSize: "12px", color: "#92400e" }}>
            Record — wins: {preview.summary.wins}, losses: {preview.summary.losses}, pending:{" "}
            {preview.summary.pending}
          </p>
          {preview.recent_bets?.length ? (
            <ul style={{ paddingLeft: "18px", margin: 0 }}>
              {preview.recent_bets.slice(0, 8).map((b) => (
                <li key={b.selection_id} style={{ marginBottom: "4px" }}>
                  {b.market_label} — pick {b.pick} ({b.status})
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ fontSize: "12px", color: "#92400e" }}>
              No picks yet. Enter a contest to build a lineup.
            </p>
          )}
        </div>
      )}

      <p style={{ marginTop: "14px", fontSize: "11px", color: "#92400e" }}>
        New stack: Fastify + Prisma API. Contest lobby and live leaderboard next.
      </p>
    </div>
  );
}
