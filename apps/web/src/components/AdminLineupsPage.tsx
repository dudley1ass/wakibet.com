import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { apiGet, apiPost } from "../api";
import type { SessionUser } from "../App";
import "./dashboard.css";

type AdminUserRow = {
  user_id: string;
  email: string;
  display_name: string;
  created_at: string;
  is_banned: boolean;
  password_set: boolean;
  count_winter_fantasy_rosters: number;
  pickleball_lineups: {
    tournament_key: string;
    season_key: string;
    event_count: number;
    wakicash_spent: number;
    updated_at: string;
  }[];
  nascar_lineups: {
    week_key: string;
    race_name: string;
    pick_count: number;
    updated_at: string;
  }[];
};

type AdminLineupsResponse = { users: AdminUserRow[] };

type Props = { user: SessionUser };

export default function AdminLineupsPage({ user }: Props) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [resetPwd, setResetPwd] = useState<Record<string, string>>({});
  const [resetBusy, setResetBusy] = useState<string | null>(null);
  const [resetMsg, setResetMsg] = useState<string | null>(null);
  const [resetErr, setResetErr] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ["admin", "lineups", submitted] as const,
    queryFn: () => apiGet<AdminLineupsResponse>(`/api/v1/admin/users/lineups?q=${encodeURIComponent(submitted)}`),
    staleTime: 20_000,
  });

  const users = query.data?.users ?? [];
  const totals = useMemo(
    () => ({
      users: users.length,
      pb: users.reduce((n, u) => n + u.pickleball_lineups.length, 0),
      nascar: users.reduce((n, u) => n + u.nascar_lineups.length, 0),
      noPassword: users.filter((u) => !u.password_set).length,
      banned: users.filter((u) => u.is_banned).length,
    }),
    [users],
  );

  async function handleResetPassword(userId: string) {
    setResetErr(null);
    setResetMsg(null);
    const pwd = (resetPwd[userId] ?? "").trim();
    if (pwd.length < 8) {
      setResetErr("Password must be at least 8 characters.");
      return;
    }
    setResetBusy(userId);
    try {
      await apiPost<{ ok: true }>("/api/v1/admin/users/reset-password", {
        user_id: userId,
        new_password: pwd,
      });
      setResetPwd((m) => ({ ...m, [userId]: "" }));
      setResetMsg("Password updated. User can log in with the new password.");
      await queryClient.invalidateQueries({ queryKey: ["admin", "lineups", submitted] });
    } catch (e) {
      setResetErr(e instanceof Error ? e.message : "Reset failed.");
    } finally {
      setResetBusy(null);
    }
  }

  return (
    <div className="pick-teams-shell">
      <header className="pick-teams-head">
        <div>
          <h1 className="pick-teams-title">Admin — Users & lineups</h1>
          <p className="pick-teams-sub">
            Signed in as <strong>{user.display_name || user.email}</strong>
          </p>
        </div>
        <div className="dash-head-actions">
          <Link className="dash-ghost-btn" to="/">
            Back to Dashboard
          </Link>
        </div>
      </header>

      <section className="dash-card wf-section">
        <p className="dash-sub" style={{ marginBottom: 12 }}>
          Lists up to <strong>100</strong> users (newest first) when search is empty. Password hashes are{" "}
          <strong>never</strong> shown — only whether a password exists. Use reset only to fix accounts stuck without a
          password or when the owner asks for a new one.
        </p>

        <form
          className="wf-row"
          onSubmit={(e) => {
            e.preventDefault();
            setSubmitted(search.trim());
          }}
        >
          <label className="wf-label" htmlFor="admin-user-search">
            Search by email or display name (optional — leave blank for latest signups)
          </label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <input
              id="admin-user-search"
              className="wf-select"
              style={{ flex: "1 1 280px" }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="e.g. gare1223@gmail.com or leave empty"
            />
            <button type="submit" className="dash-main-btn" disabled={query.isLoading}>
              {query.isLoading ? "Loading…" : "Search / refresh"}
            </button>
          </div>
        </form>

        {query.error ? (
          <p className="dash-error">{query.error instanceof Error ? query.error.message : "Request failed."}</p>
        ) : null}
        {resetErr ? <p className="dash-error">{resetErr}</p> : null}
        {resetMsg ? <p style={{ color: "#166534", marginTop: 8 }}>{resetMsg}</p> : null}

        <p className="dash-sub" style={{ marginTop: 8 }}>
          Users: <strong>{totals.users}</strong> · Pickleball tournament shells: <strong>{totals.pb}</strong> · NASCAR
          lineups: <strong>{totals.nascar}</strong> · <strong>{totals.noPassword}</strong> without password ·{" "}
          <strong>{totals.banned}</strong> banned
        </p>

        {users.length === 0 && !query.isLoading && !query.error ? (
          <p className="dash-empty">
            {submitted
              ? "No users match this search."
              : "No users returned (empty DB or you are past the 100-user cap for this query)."}
          </p>
        ) : null}

        <ul className="rost-list">
          {users.map((u) => (
            <li key={u.user_id}>
              <article className="rost-card dash-card">
                <div className="rost-card-head">
                  <div>
                    <div className="rost-tournament">{u.display_name}</div>
                    <div className="dash-sub">{u.email}</div>
                    <div className="dash-sub" style={{ marginTop: 6, fontSize: 11 }}>
                      Joined {new Date(u.created_at).toLocaleString()} · User ID{" "}
                      <code style={{ fontSize: 10 }}>{u.user_id}</code>
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                    {u.is_banned ? (
                      <span className="admin-badge admin-badge--bad">Banned</span>
                    ) : (
                      <span className="admin-badge admin-badge--ok">Active</span>
                    )}
                    {u.password_set ? (
                      <span className="admin-badge admin-badge--ok">Password set</span>
                    ) : (
                      <span className="admin-badge admin-badge--warn">No password — cannot log in</span>
                    )}
                  </div>
                </div>

                <div className="rost-event" style={{ marginTop: 8 }}>
                  <span className="rost-event-label">Division fantasy (winter rosters)</span>
                  <span className="rost-event-value">{u.count_winter_fantasy_rosters} saved</span>
                </div>

                <div className="rost-event" style={{ marginTop: 8 }}>
                  <span className="rost-event-label">Pickleball tournament lineups</span>
                  <span className="rost-event-value">{u.pickleball_lineups.length} shells</span>
                </div>
                {u.pickleball_lineups.length === 0 ? (
                  <p className="dash-empty" style={{ marginTop: 6 }}>
                    No multi-event tournament lineups yet.
                  </p>
                ) : (
                  <ol className="rost-pick-list">
                    {u.pickleball_lineups.map((l) => (
                      <li key={`${u.user_id}-pb-${l.tournament_key}-${l.season_key}-${l.updated_at}`} className="rost-pick-row">
                        <span className="rost-name">
                          {l.tournament_key} · events {l.event_count} · spent {l.wakicash_spent} WC
                        </span>
                      </li>
                    ))}
                  </ol>
                )}

                <div className="rost-event" style={{ marginTop: 8 }}>
                  <span className="rost-event-label">NASCAR</span>
                  <span className="rost-event-value">{u.nascar_lineups.length} week rows</span>
                </div>
                {u.nascar_lineups.length === 0 ? (
                  <p className="dash-empty" style={{ marginTop: 6 }}>
                    No NASCAR lineups yet.
                  </p>
                ) : (
                  <ol className="rost-pick-list">
                    {u.nascar_lineups.map((l) => (
                      <li key={`${u.user_id}-ns-${l.week_key}-${l.updated_at}`} className="rost-pick-row">
                        <span className="rost-name">
                          {l.race_name} ({l.week_key}) · picks {l.pick_count}
                        </span>
                      </li>
                    ))}
                  </ol>
                )}

                <div className="admin-reset-pw" style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid rgba(251,191,36,0.2)" }}>
                  <div className="wf-label" style={{ marginBottom: 6 }}>
                    Set / reset password (min 8 chars)
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                    <input
                      type="password"
                      className="wf-select"
                      style={{ flex: "1 1 200px", maxWidth: 320 }}
                      autoComplete="new-password"
                      placeholder="New password for this user"
                      value={resetPwd[u.user_id] ?? ""}
                      onChange={(e) => setResetPwd((m) => ({ ...m, [u.user_id]: e.target.value }))}
                      disabled={resetBusy === u.user_id}
                    />
                    <button
                      type="button"
                      className="dash-ghost-btn"
                      disabled={resetBusy === u.user_id}
                      onClick={() => void handleResetPassword(u.user_id)}
                    >
                      {resetBusy === u.user_id ? "Saving…" : "Save password"}
                    </button>
                  </div>
                </div>
              </article>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
