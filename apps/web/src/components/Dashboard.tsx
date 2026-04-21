import { useCallback, useEffect, useState } from "react";
import { apiGet } from "../api";
import type { SessionUser } from "../App";
import WinterFantasySection from "./WinterFantasySection";
import "./dashboard.css";

export type FantasyRosterRow = {
  division_key: string;
  event_type: string;
  skill_level: string;
  age_bracket: string;
  picks: { slot_index: number; player_name: string; is_captain: boolean }[];
};

type DashboardData = {
  profile: {
    display_name: string;
    email: string;
    state: string | null;
    country: string;
    joined_at: string;
  };
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
  winter_fantasy_rosters: FantasyRosterRow[];
};

type Props = {
  user: SessionUser;
  onLogout: () => void;
};

function WinterSpringsHero({
  tournamentName,
  matchCount,
  rosters,
}: {
  tournamentName: string;
  matchCount: number;
  rosters: FantasyRosterRow[];
}) {
  return (
    <section className="dash-hero" aria-labelledby="dash-hero-title">
      <div className="dash-hero-inner">
        <p className="dash-hero-kicker">Your event</p>
        <h2 id="dash-hero-title" className="dash-hero-title">
          {tournamentName}
        </h2>
        <p className="dash-hero-sub">
          Test schedule: {matchCount.toLocaleString()} generated matches · Fantasy rosters you save appear below
        </p>
        {rosters.length > 0 ? (
          <div className="dash-hero-rosters">
            {rosters.map((r) => (
              <div className="dash-hero-division" key={r.division_key}>
                <div className="dash-hero-division-head">
                  <span className="dash-hero-division-title">{r.event_type}</span>
                  <span className="dash-hero-division-meta">
                    {r.skill_level} · {r.age_bracket}
                  </span>
                </div>
                <ul className="dash-hero-picks">
                  {r.picks.map((p) => (
                    <li key={`${r.division_key}-${p.slot_index}`}>
                      <span className="dash-hero-slot">#{p.slot_index + 1}</span>
                      <span className="dash-hero-name">{p.player_name}</span>
                      {p.is_captain ? <span className="dash-hero-cap">Captain</span> : null}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ) : (
          <p className="dash-hero-empty">Save a roster for a division in the builder below — it will show up here.</p>
        )}
      </div>
    </section>
  );
}

export default function Dashboard({ user, onLogout }: Props) {
  const [preview, setPreview] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const joined = preview ? new Date(preview.profile.joined_at).toLocaleDateString() : "--";

  return (
    <div className="dash-shell">
      <div className="dash-head">
        <div>
          <h1>WakiBet</h1>
          <p>
            Welcome back, <strong>{user.display_name || user.email}</strong>
          </p>
        </div>
        <div className="dash-head-actions">
          <button type="button" onClick={() => void loadDashboard()} disabled={loading} className="dash-ghost-btn">
            {loading ? "Updating…" : "Refresh"}
          </button>
          <button type="button" onClick={onLogout} className="dash-ghost-btn">
            Log out
          </button>
        </div>
      </div>

      {error && <p className="dash-error">{error}</p>}

      {loading && !preview && (
        <p className="dash-loading" role="status">
          Loading your dashboard…
        </p>
      )}

      {preview && (
        <>
          <WinterSpringsHero
            tournamentName={preview.winter_springs.tournament_name}
            matchCount={preview.winter_springs.generated_matches}
            rosters={preview.winter_fantasy_rosters}
          />

          <div style={{ marginTop: 16 }}>
            <WinterFantasySection onRosterSaved={() => void loadDashboard()} />
          </div>

          <div className="dash-grid" style={{ marginTop: 16 }}>
            <section className="dash-card">
              <div className="dash-label">Profile</div>
              <div className="dash-row">
                <span>Name</span>
                <strong>{preview.profile.display_name}</strong>
              </div>
              <div className="dash-row">
                <span>Email</span>
                <strong>{preview.profile.email}</strong>
              </div>
              <div className="dash-row">
                <span>Location</span>
                <strong>
                  {preview.profile.state ?? "--"}, {preview.profile.country}
                </strong>
              </div>
              <div className="dash-row">
                <span>Joined</span>
                <strong>{joined}</strong>
              </div>
            </section>

            <section className="dash-card">
              <div className="dash-label">Open contests</div>
              {preview.open_contests.length ? (
                preview.open_contests.map((c) => (
                  <div className="dash-list-item" key={c.id}>
                    <div>{c.name}</div>
                    <small>{c.status}</small>
                  </div>
                ))
              ) : (
                <p className="dash-empty">No open contests yet.</p>
              )}
            </section>

            <section className="dash-card dash-span-2">
              <div className="dash-label">{preview.winter_springs.tournament_name} — your schedule matches</div>
              <div className="dash-sub">Names on the schedule must match your profile display name.</div>
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
                      <tr key={`${m.match_id}-${m.event_type}-${m.skill_level}-${m.age_bracket}`}>
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
                  No matches mapped to this account yet. Use your tournament full name as your profile display name
                  to link the test schedule.
                </p>
              )}
            </section>
          </div>
        </>
      )}

      <p className="dash-footnote">Fantasy rosters are saved per division; refresh or save again to update the hero.</p>
    </div>
  );
}
