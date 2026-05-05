import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import {
  buildLacrossePicksSpotlightPayload,
  buildPickleballPicksSpotlightPayload,
  buildVolleyballPicksSpotlightPayload,
} from "@wakibet/shared";

const Status = z.enum(["live", "upcoming", "ended"]);

export const picksSpotlightRoutes: FastifyPluginAsync = async (app) => {
  const typed = app.withTypeProvider<ZodTypeProvider>();

  typed.get(
    "/spotlight",
    {
      schema: {
        tags: ["picks"],
        response: {
          200: z.object({
            generated_at: z.string(),
            items: z.array(
              z.object({
                sport_key: z.string(),
                window_key: z.string(),
                href: z.string(),
                label_short: z.string(),
                label_full: z.string(),
                venue: z.string(),
                status: Status,
                starts_at: z.string(),
                ends_at: z.string(),
              }),
            ),
          }),
        },
      },
    },
    async () => {
      const now = new Date();
      const vb = buildVolleyballPicksSpotlightPayload(now);
      const pb = buildPickleballPicksSpotlightPayload(now);
      const lx = buildLacrossePicksSpotlightPayload(now);

      const items: {
        sport_key: string;
        window_key: string;
        href: string;
        label_short: string;
        label_full: string;
        venue: string;
        status: z.infer<typeof Status>;
        starts_at: string;
        ends_at: string;
      }[] = [
        {
          sport_key: vb.sport_key,
          window_key: vb.window_key,
          href: vb.href,
          label_short: vb.label_short,
          label_full: vb.label_full,
          venue: vb.venue,
          status: vb.status,
          starts_at: vb.starts_at,
          ends_at: vb.ends_at,
        },
        {
          sport_key: pb.sport_key,
          window_key: pb.window_key,
          href: pb.href,
          label_short: pb.label_short,
          label_full: pb.label_full,
          venue: pb.venue,
          status: pb.status,
          starts_at: pb.starts_at,
          ends_at: pb.ends_at,
        },
        {
          sport_key: lx.sport_key,
          window_key: lx.window_key,
          href: lx.href,
          label_short: lx.label_short,
          label_full: lx.label_full,
          venue: lx.venue,
          status: lx.status,
          starts_at: lx.starts_at,
          ends_at: lx.ends_at,
        },
      ];

      return {
        generated_at: now.toISOString(),
        items,
      };
    },
  );
};
