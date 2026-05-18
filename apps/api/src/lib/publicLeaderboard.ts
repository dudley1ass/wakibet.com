import { prisma } from "./prisma.js";
import { getCachedPickleballFantasyLeaderboard } from "./pickleballFantasyLeaderboard.js";

const VOLLEYBALL_TOURNAMENT_KEY = "volleyball_avp_2026";
const VOLLEYBALL_SEASON_KEY = "volleyball_2026";

export type PublicLeaderboardRow = {
  rank: number;
  display_name: string;
  points: number;
};

export type PublicLeaderboardPayload = {
  sport: "pickleball" | "lacrosse" | "volleyball" | "poker";
  total_players: number;
  rows: PublicLeaderboardRow[];
};

export async function getPublicSeasonLeaderboard(
  sport: PublicLeaderboardPayload["sport"],
): Promise<PublicLeaderboardPayload> {
  switch (sport) {
    case "pickleball": {
      const ranked = await getCachedPickleballFantasyLeaderboard();
      return {
        sport,
        total_players: ranked.length,
        rows: ranked.slice(0, 100).map((r) => ({
          rank: r.rank,
          display_name: r.display_name,
          points: r.points,
        })),
      };
    }
    case "lacrosse": {
      const grouped = await prisma.lacrosseLineup.groupBy({
        by: ["userId"],
        _sum: { estReturn: true },
      });
      const userIds = grouped.map((g) => g.userId);
      const users = userIds.length
        ? await prisma.user.findMany({
            where: { id: { in: userIds } },
            select: { id: true, displayName: true, username: true },
          })
        : [];
      const byId = new Map(users.map((u) => [u.id, u] as const));
      const ranked = grouped
        .map((g) => {
          const u = byId.get(g.userId);
          return {
            display_name: u?.displayName || u?.username || "Player",
            points: Number(g._sum.estReturn ?? 0),
          };
        })
        .sort((a, b) => b.points - a.points || a.display_name.localeCompare(b.display_name));
      return {
        sport,
        total_players: ranked.length,
        rows: ranked.slice(0, 100).map((r, i) => ({ rank: i + 1, ...r })),
      };
    }
    case "volleyball": {
      const lineups = await prisma.fantasyTournamentLineup.findMany({
        where: {
          tournamentKey: VOLLEYBALL_TOURNAMENT_KEY,
          seasonKey: VOLLEYBALL_SEASON_KEY,
        },
        include: {
          user: { select: { displayName: true, username: true } },
          eventPicks: { include: { slots: { select: { id: true } } } },
        },
      });
      const ranked = lineups
        .map((l) => ({
          display_name: l.user.displayName || l.user.username || "Player",
          points: l.eventPicks.reduce((s, ev) => s + ev.slots.length, 0),
        }))
        .sort((a, b) => b.points - a.points || a.display_name.localeCompare(b.display_name));
      return {
        sport,
        total_players: ranked.length,
        rows: ranked.slice(0, 100).map((r, i) => ({ rank: i + 1, ...r })),
      };
    }
    case "poker":
      return { sport, total_players: 0, rows: [] };
  }
}
