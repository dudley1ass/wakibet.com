import type { SessionUser } from "../../../App";
import SportStandingsPage from "../../../components/sportStandings/SportStandingsPage";

export default function LacrosseStandingsPage({ user }: { user: SessionUser }) {
  return (
    <SportStandingsPage
      user={user}
      title="Lacrosse — Standings"
      kicker="PLL 2026 · scoring leaderboard"
      backHref="/lacrosse"
      backLabel="Lacrosse hub"
      sportLabel="Lacrosse"
      fantasyEndpoint="/api/v1/lacrosse/season-leaderboard"
      fantasyQueryKey={["lacrosse", "season-leaderboard"] as const}
      fantasyKicker="Wakibet · PLL fantasy"
      fantasySignInPrompt="Sign in to see the Wakibet lacrosse user leaderboard."
    />
  );
}
