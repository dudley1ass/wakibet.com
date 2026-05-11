import type { SessionUser } from "../../../App";
import SportStandingsPage from "../../../components/sportStandings/SportStandingsPage";

export default function PokerStandingsPage({ user }: { user: SessionUser }) {
  return (
    <SportStandingsPage
      user={user}
      title="Poker — Standings"
      kicker="WSOP 2026 · scoring leaderboard"
      backHref="/poker/pick"
      backLabel="WSOP fantasy"
      sportLabel="Poker"
      fantasyEndpoint="/api/v1/poker/season-leaderboard"
      fantasyQueryKey={["poker", "season-leaderboard"] as const}
      fantasyKicker="Wakibet · WSOP 2026 fantasy"
      fantasySignInPrompt="Sign in to see the Wakibet poker user leaderboard."
    />
  );
}
