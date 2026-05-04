import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import {
  AVP_2026_EVENTS,
  AVP_2026_SEASON_YEAR,
  AVP_HUNTINGTON_BEACH_OPEN_EVENT_KEY,
  AVP_SOUTH_BEACH_MAY_OPEN_EVENT_KEY,
  avpRegisteredTeamPoolForEvent,
} from "@wakibet/shared";
import {
  type AvpAthleteProfile,
  athleteProfileForRosterName,
  loadAvpSouthBeachAthleteMap,
} from "../sports/volleyball/lib/loadAvpSouthBeachAthletesCsv.js";
import { loadHuntingtonBeachOpenTeamPool } from "../sports/volleyball/lib/loadAvpHuntingtonBeachOpenData.js";

const AvpEventSchema = z.object({
  event_key: z.string(),
  category: z.enum(["league", "heritage", "contender"]),
  name: z.string(),
  location: z.string(),
  start_date: z.string(),
  end_date: z.string(),
});

const AvpAthleteProfileSchema = z.object({
  player: z.string(),
  position: z.string(),
  height: z.string(),
  location: z.string(),
  usual_side: z.string(),
  usual_defense: z.string(),
});

const AvpTeamSchema = z.object({
  team_key: z.string(),
  division_code: z.enum([
    "mens_aa",
    "mens_aaa",
    "mens_open",
    "womens_aa",
    "womens_aaa",
    "womens_open",
    "heritage_mens",
    "heritage_womens",
  ]),
  division_label: z.string(),
  player_one: z.string(),
  player_two: z.string(),
  team_label: z.string(),
  player_one_profile: AvpAthleteProfileSchema.nullable(),
  player_two_profile: AvpAthleteProfileSchema.nullable(),
});

const EventKeyQuery = z.object({
  event_key: z.string().min(1),
});

export const volleyballRoutes: FastifyPluginAsync = async (app) => {
  const typed = app.withTypeProvider<ZodTypeProvider>();

  typed.get(
    "/status",
    {
      schema: {
        tags: ["volleyball"],
        response: {
          200: z.object({
            sport: z.literal("volleyball"),
            season_year: z.number().int(),
            event_count: z.number().int(),
            fantasy_enabled: z.boolean(),
            message: z.string(),
          }),
        },
      },
    },
    async () => ({
      sport: "volleyball" as const,
      season_year: AVP_2026_SEASON_YEAR,
      event_count: AVP_2026_EVENTS.length,
      fantasy_enabled: false,
      message:
        "AVP 2026 schedule is live. Player pool and WakiPoints scoring will ship next — same fantasy flow as pickleball (WakiCash lineups, captains, season leaderboard).",
    }),
  );

  typed.get(
    "/schedule",
    {
      schema: {
        tags: ["volleyball"],
        response: {
          200: z.object({
            sport: z.literal("volleyball"),
            season_year: z.number().int(),
            events: z.array(AvpEventSchema),
            schedule_notes: z.array(z.string()),
          }),
        },
      },
    },
    async () => {
      return {
        sport: "volleyball" as const,
        season_year: AVP_2026_SEASON_YEAR,
        events: AVP_2026_EVENTS,
        schedule_notes: [
          "League, Heritage, and Contender stops can land on the same calendar weekend — each fantasy slate will target one official stop.",
          "Example overlap: AVP League Week 3 (Miami, Jun 12–13) and Virginia Beach Open (Jun 13–14); League Championships (Chicago, Sep 5–6) vs Mother Lode (Sep 5–7).",
        ],
      };
    },
  );

  typed.get(
    "/teams",
    {
      schema: {
        tags: ["volleyball"],
        querystring: EventKeyQuery,
        response: {
          200: z.object({
            sport: z.literal("volleyball"),
            season_year: z.number().int(),
            event_key: z.string(),
            pool_title: z.string(),
            team_count: z.number().int(),
            athletes_csv_row_count: z.number().int(),
            roster_players_missing_profile: z.array(z.string()),
            teams: z.array(AvpTeamSchema),
          }),
          404: z.object({ message: z.string() }),
        },
      },
    },
    async (req, reply) => {
      const { event_key } = req.query;
      let pool = avpRegisteredTeamPoolForEvent(event_key);
      let athleteMap = new Map<string, AvpAthleteProfile>();

      if (!pool && event_key === AVP_HUNTINGTON_BEACH_OPEN_EVENT_KEY) {
        const hb = await loadHuntingtonBeachOpenTeamPool();
        pool = { title: hb.title, teams: hb.teams };
        athleteMap = hb.athleteMap;
      } else if (event_key === AVP_SOUTH_BEACH_MAY_OPEN_EVENT_KEY) {
        athleteMap = await loadAvpSouthBeachAthleteMap();
      }

      if (!pool) {
        return reply.code(404).send({ message: `No registered team list for event_key: ${event_key}` } as const);
      }
      const missing = new Set<string>();

      const teams = pool.teams.map((t) => {
        const p1 = t.player_one.trim();
        const p2 = t.player_two.trim();
        const pr1 = p1 ? athleteProfileForRosterName(athleteMap, p1) : null;
        const pr2 = p2 ? athleteProfileForRosterName(athleteMap, p2) : null;
        if (p1 && !pr1) missing.add(p1);
        if (p2 && !pr2) missing.add(p2);
        return {
          ...t,
          player_one_profile: pr1,
          player_two_profile: pr2,
        };
      });

      return {
        sport: "volleyball" as const,
        season_year: AVP_2026_SEASON_YEAR,
        event_key,
        pool_title: pool.title,
        team_count: pool.teams.length,
        athletes_csv_row_count: athleteMap.size,
        roster_players_missing_profile: [...missing].sort((a, b) => a.localeCompare(b)),
        teams,
      };
    },
  );
};
