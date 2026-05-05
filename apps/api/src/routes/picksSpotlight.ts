import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { prisma } from "../lib/prisma.js";

const SPORT_ORDER = ["volleyball", "pickleball", "lacrosse"] as const;

const Status = z.enum(["live", "upcoming", "ended"]);

type WindowRow = {
  sportKey: string;
  windowKey: string;
  labelShort: string;
  labelFull: string;
  venue: string;
  href: string;
  startsAt: Date;
  endsAt: Date;
};

function resolveWindow(windows: WindowRow[], now: Date): { row: WindowRow; status: z.infer<typeof Status> } | null {
  const sorted = [...windows].sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
  const live = sorted.find((w) => w.startsAt <= now && w.endsAt > now);
  if (live) return { row: live, status: "live" };
  const upcoming = sorted.find((w) => w.startsAt > now);
  if (upcoming) return { row: upcoming, status: "upcoming" };
  const last = sorted[sorted.length - 1];
  if (last) return { row: last, status: "ended" };
  return null;
}

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
      const rows = await prisma.picksSpotlightWindow.findMany({
        orderBy: [{ sportKey: "asc" }, { startsAt: "asc" }],
      });

      const bySport = new Map<string, WindowRow[]>();
      for (const r of rows) {
        const list = bySport.get(r.sportKey) ?? [];
        list.push({
          sportKey: r.sportKey,
          windowKey: r.windowKey,
          labelShort: r.labelShort,
          labelFull: r.labelFull,
          venue: r.venue,
          href: r.href,
          startsAt: r.startsAt,
          endsAt: r.endsAt,
        });
        bySport.set(r.sportKey, list);
      }

      const out: {
        sport_key: string;
        window_key: string;
        href: string;
        label_short: string;
        label_full: string;
        venue: string;
        status: z.infer<typeof Status>;
        starts_at: string;
        ends_at: string;
      }[] = [];

      for (const key of SPORT_ORDER) {
        const windows = bySport.get(key);
        if (!windows?.length) continue;
        const resolved = resolveWindow(windows, now);
        if (!resolved) continue;
        const { row, status } = resolved;
        out.push({
          sport_key: row.sportKey,
          window_key: row.windowKey,
          href: row.href,
          label_short: row.labelShort,
          label_full: row.labelFull,
          venue: row.venue,
          status,
          starts_at: row.startsAt.toISOString(),
          ends_at: row.endsAt.toISOString(),
        });
      }

      return {
        generated_at: now.toISOString(),
        items: out,
      };
    },
  );
};
