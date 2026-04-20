import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { prisma } from "../lib/prisma.js";

const HealthResponse = z.object({
  ok: z.literal(true),
  version: z.string(),
  database: z.enum(["up", "down"]),
});

export const healthRoutes: FastifyPluginAsync = async (app) => {
  const typed = app.withTypeProvider<ZodTypeProvider>();

  typed.get(
    "/api/v1/health",
    {
      schema: {
        tags: ["system"],
        description: "Liveness + DB connectivity",
        response: { 200: HealthResponse },
      },
    },
    async () => {
      let database: "up" | "down" = "down";
      try {
        await prisma.$queryRaw`SELECT 1`;
        database = "up";
      } catch {
        database = "down";
      }
      return {
        ok: true as const,
        version: process.env.npm_package_version ?? "0.0.1",
        database,
      };
    },
  );

  /** Uptime monitors often expect `/health` without prefix. */
  typed.get(
    "/health",
    {
      schema: {
        hide: true,
        response: { 200: HealthResponse },
      },
    },
    async () => {
      let database: "up" | "down" = "down";
      try {
        await prisma.$queryRaw`SELECT 1`;
        database = "up";
      } catch {
        database = "down";
      }
      return {
        ok: true as const,
        version: process.env.npm_package_version ?? "0.0.1",
        database,
      };
    },
  );
};
