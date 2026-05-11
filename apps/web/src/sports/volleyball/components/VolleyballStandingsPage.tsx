import type { SessionUser } from "../../../App";
import SportStandingsPage from "../../../components/sportStandings/SportStandingsPage";

export default function VolleyballStandingsPage({ user }: { user: SessionUser }) {
  return (
    <SportStandingsPage
      user={user}
      title="Volleyball — Standings"
      kicker="AVP 2026 · scoring leaderboard"
      backHref="/volleyball"
      backLabel="Volleyball hub"
      sportLabel="Volleyball"
      fantasyEndpoint="/api/v1/volleyball/season-leaderboard"
      fantasyQueryKey={["volleyball", "season-leaderboard"] as const}
      fantasyKicker="Wakibet · AVP 2026 fantasy"
      fantasySignInPrompt="Sign in to see the Wakibet volleyball user leaderboard."
    />
  );
}
