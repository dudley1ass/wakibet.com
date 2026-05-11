import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import {
  POKER_LIVE_TOUR_2026_EVENTS,
  POKER_WORLD_RANKINGS_TOP_200,
  WSOP_SITE_TOP_50_PLAYERS,
  WSOP_2026_END_DATE,
  WSOP_2026_LAS_VEGAS_EVENT_KEY,
  WSOP_2026_SIMPLE_SCORING,
  WSOP_2026_START_DATE,
  WSOP_2026_TIER1_SLATES,
  WSOP_2026_TIER2_SLATES,
  WSOP_FEATURED_PLAYER_POOL_MAX,
  WSOP_FEATURED_PLAYER_POOL_MIN,
  WSOP_FEATURED_POOL_INCLUSION_NOTES,
  WSOP_FANTASY_CAPTAIN_MULTIPLIER,
  WSOP_FANTASY_ROSTER_SLOTS,
  WSOP_FANTASY_SALARY_CAP,
  WSOP_FANTASY_SOFT_LOCK_DAYS,
  WSOP_FANTASY_SOFT_LOCK_MAX_SWAPS,
  WSOP_POST_LAUNCH_BONUS_IDEAS,
  wsopLeaderboardPlayersNotInWorldTop200,
} from "@wakibet/shared";

const eventSchema = z.object({
  event_key: z.string(),
  start_date: z.string(),
  end_date: z.string(),
  country: z.string(),
  city: z.string(),
  series_code: z.string(),
  title: z.string(),
  tier: z.enum(["major", "international", "regional"]),
});

const worldRankingSchema = z.object({
  rank: z.number(),
  country: z.string(),
  player_name: z.string(),
  rating: z.number(),
});

const wsopLeaderboardSchema = z.object({
  wsop_rank: z.number(),
  player_name: z.string(),
  country: z.string(),
  earnings_usd: z.number(),
  bracelets: z.number(),
  rings: z.number(),
  cashes: z.number(),
});

const wsopSlateSchema = z.object({
  slate_key: z.string(),
  title: z.string(),
  tier: z.union([z.literal(1), z.literal(2)]),
  always_featured: z.boolean(),
  rationale: z.string(),
  start_date: z.string().nullable(),
  end_date: z.string().nullable(),
  start_time_pt: z.string().nullable(),
});

const wsopScoringSchema = z.object({
  outcome_key: z.string(),
  label: z.string(),
  points: z.number(),
});

export const pokerRoutes: FastifyPluginAsync = async (app) => {
  const typed = app.withTypeProvider<ZodTypeProvider>();

  typed.get(
    "/schedule",
    {
      schema: {
        tags: ["poker"],
        summary: "2026 live tour calendar for poker fantasy",
        response: {
          200: z.object({
            season_year: z.number(),
            events: z.array(eventSchema),
            generated_at: z.string(),
          }),
        },
      },
    },
    async () => ({
      season_year: 2026,
      events: POKER_LIVE_TOUR_2026_EVENTS,
      generated_at: new Date().toISOString(),
    }),
  );

  typed.get(
    "/world-rankings",
    {
      schema: {
        tags: ["poker"],
        summary:
          "Global top 200, WSOP.com-style top 50 snapshot, and WSOP rows not matched to the global list",
        response: {
          200: z.object({
            players: z.array(worldRankingSchema),
            wsop_leaderboard_top_50: z.array(wsopLeaderboardSchema),
            wsop_players_not_in_world_top_200: z.array(wsopLeaderboardSchema),
            generated_at: z.string(),
          }),
        },
      },
    },
    async () => ({
      players: POKER_WORLD_RANKINGS_TOP_200,
      wsop_leaderboard_top_50: WSOP_SITE_TOP_50_PLAYERS,
      wsop_players_not_in_world_top_200: wsopLeaderboardPlayersNotInWorldTop200(),
      generated_at: new Date().toISOString(),
    }),
  );

  typed.get(
    "/wsop-2026",
    {
      schema: {
        tags: ["poker"],
        summary: "WSOP Las Vegas 2026 fantasy config (slates, rules, scoring)",
        response: {
          200: z.object({
            focus: z.literal("wsop_las_vegas_2026"),
            event_key: z.string(),
            start_date: z.string(),
            end_date: z.string(),
            city: z.literal("Las Vegas"),
            roster_slots: z.number(),
            salary_cap_wakicash: z.number(),
            featured_player_pool_min: z.number(),
            featured_player_pool_max: z.number(),
            soft_lock_days: z.number(),
            soft_lock_max_swaps: z.number(),
            captain_multiplier: z.number(),
            tier1_slates: z.array(wsopSlateSchema),
            tier2_slates: z.array(wsopSlateSchema),
            scoring: z.array(wsopScoringSchema),
            pool_inclusion_notes: z.array(z.string()),
            post_launch_bonus_ideas: z.array(z.string()),
            generated_at: z.string(),
          }),
        },
      },
    },
    async () => ({
      focus: "wsop_las_vegas_2026" as const,
      event_key: WSOP_2026_LAS_VEGAS_EVENT_KEY,
      start_date: WSOP_2026_START_DATE,
      end_date: WSOP_2026_END_DATE,
      city: "Las Vegas" as const,
      roster_slots: WSOP_FANTASY_ROSTER_SLOTS,
      salary_cap_wakicash: WSOP_FANTASY_SALARY_CAP,
      featured_player_pool_min: WSOP_FEATURED_PLAYER_POOL_MIN,
      featured_player_pool_max: WSOP_FEATURED_PLAYER_POOL_MAX,
      soft_lock_days: WSOP_FANTASY_SOFT_LOCK_DAYS,
      soft_lock_max_swaps: WSOP_FANTASY_SOFT_LOCK_MAX_SWAPS,
      captain_multiplier: WSOP_FANTASY_CAPTAIN_MULTIPLIER,
      tier1_slates: WSOP_2026_TIER1_SLATES,
      tier2_slates: WSOP_2026_TIER2_SLATES,
      scoring: WSOP_2026_SIMPLE_SCORING,
      pool_inclusion_notes: WSOP_FEATURED_POOL_INCLUSION_NOTES,
      post_launch_bonus_ideas: WSOP_POST_LAUNCH_BONUS_IDEAS,
      generated_at: new Date().toISOString(),
    }),
  );

  typed.get(
    "/season-leaderboard",
    {
      schema: {
        tags: ["poker"],
        summary: "Wakibet user fantasy leaderboard for the WSOP 2026 season (empty until scoring is live)",
        response: {
          200: z.object({
            sport: z.literal("poker"),
            total_players: z.number().int(),
            rows: z.array(
              z.object({
                rank: z.number().int(),
                display_name: z.string(),
                points: z.number(),
                is_me: z.boolean(),
              }),
            ),
          }),
        },
      },
    },
    async () => ({ sport: "poker" as const, total_players: 0, rows: [] }),
  );
};
