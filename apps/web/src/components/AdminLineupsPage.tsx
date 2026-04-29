import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { apiGet } from "../api";
import type { SessionUser } from "../App";
import "./dashboard.css";

type AdminUserRow = {
  user_id: string;
  email: string;
  display_name: string;
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
  const [search, setSearch] = useState("");
  const [submitted, setSubmitted] = useState("");

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
    }),
    [users],
  );

  return (
    <div className="pick-teams-shell">
      <header className="pick-teams-head">
        <div>
          <h1 className="pick-teams-title">Admin User Lineups</h1>
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
        <form
          className="wf-row"
          onSubmit={(e) => {
            e.preventDefault();
            setSubmitted(search.trim());
          }}
        >
          <label className="wf-label" htmlFor="admin-user-search">
            Search user by email or display name
          </label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <input
              id="admin-user-search"
              className="wf-select"
              style={{ flex: "1 1 280px" }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="email or display name"
            />
            <button type="submit" className="dash-main-btn" disabled={query.isLoading}>
              {query.isLoading ? "Searching…" : "Search"}
            </button>
          </div>
        </form>

        {query.error ? <p className="dash-error">{query.error instanceof Error ? query.error.message : "Request failed."}</p> : null}

        <p className="dash-sub" style={{ marginTop: 8 }}>
          Users: <strong>{totals.users}</strong> · Pickleball lineups: <strong>{totals.pb}</strong> · NASCAR lineups:{" "}
          <strong>{totals.nascar}</strong>
        </p>

        {users.length === 0 && !query.isLoading ? <p className="dash-empty">No users with saved lineups found.</p> : null}

        <ul className="rost-list">
          {users.map((u) => (
            <li key={u.user_id}>
              <article className="rost-card dash-card">
                <div className="rost-card-head">
                  <div>
                    <div className="rost-tournament">{u.display_name}</div>
                    <div className="dash-sub">{u.email}</div>
                  </div>
                </div>

                <div className="rost-event">
                  <span className="rost-event-label">Pickleball</span>
                  <span className="rost-event-value">{u.pickleball_lineups.length} lineups</span>
                </div>
                <ol className="rost-pick-list">
                  {u.pickleball_lineups.map((l) => (
                    <li key={`${u.user_id}-pb-${l.tournament_key}-${l.updated_at}`} className="rost-pick-row">
                      <span className="rost-name">
                        {l.tournament_key} · events {l.event_count} · spent {l.wakicash_spent}
                      </span>
                    </li>
                  ))}
                </ol>

                <div className="rost-event" style={{ marginTop: 8 }}>
                  <span className="rost-event-label">NASCAR</span>
                  <span className="rost-event-value">{u.nascar_lineups.length} lineups</span>
                </div>
                <ol className="rost-pick-list">
                  {u.nascar_lineups.map((l) => (
                    <li key={`${u.user_id}-ns-${l.week_key}-${l.updated_at}`} className="rost-pick-row">
                      <span className="rost-name">
                        {l.race_name} ({l.week_key}) · picks {l.pick_count}
                      </span>
                    </li>
                  ))}
                </ol>
              </article>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
