import Fastify from "fastify";
import cors from "@fastify/cors";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import * as Sentry from "@sentry/node";
import {
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from "fastify-type-provider-zod";
import { z } from "zod";
import { scorePlayerMatch } from "@wakibet/shared";
import { logger } from "./lib/logger.js";
import { healthRoutes } from "./routes/health.js";
import { authRoutes } from "./routes/auth.js";
import { usersRoutes } from "./routes/users.js";

export async function buildApp() {
  const app = Fastify({
    loggerInstance: logger,
    requestIdHeader: "x-request-id",
    disableRequestLogging: false,
  }).withTypeProvider<ZodTypeProvider>();

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  await app.register(cors, { origin: true });

  /** Render / browser hits `/` — API has no SPA; return JSON instead of 404. */
  app.get("/", { schema: { hide: true } }, async () => ({
    service: "wakibet-api",
    message: "HTTP API. Deploy apps/web as a Render Static Site for the browser UI.",
    links: {
      docs: "/docs",
      health: "/api/v1/health",
      openapiJson: "/documentation/json",
      auth: "/api/v1/auth/me",
    },
  }));

  /** Browsers request these automatically; without routes they clutter the console with 404. */
  for (const path of ["/favicon.ico", "/apple-touch-icon.png", "/apple-touch-icon-precomposed.png"]) {
    app.get(path, { schema: { hide: true } }, async (_req, reply) => reply.code(204).send());
  }

  await app.register(swagger, {
    transform: jsonSchemaTransform,
    openapi: {
      openapi: "3.1.0",
      info: {
        title: "WakiBet API",
        version: "0.0.1",
        description: "Fantasy pickleball MVP — Phase 1 foundation",
      },
      servers: [{ url: "/" }],
    },
  });

  await app.register(swaggerUi, {
    routePrefix: "/docs",
    uiConfig: { docExpansion: "list", deepLinking: true },
  });

  app.get(
    "/documentation/json",
    { schema: { hide: true } },
    async () => app.swagger(),
  );

  app.get(
    "/api/v1/meta",
    {
      schema: {
        tags: ["system"],
        response: {
          200: z.object({
            name: z.string(),
            sharedSample: z.number(),
          }),
        },
      },
    },
    async () => {
      const sample = scorePlayerMatch({
        matchWon: true,
        setsWon: 2,
        setsLost: 0,
        pointsWon: 22,
        pointsLost: 10,
        aces: 1,
        winners: 5,
        unforcedErrors: 2,
      });
      return { name: "wakibet", sharedSample: sample };
    },
  );

  await app.register(healthRoutes);
  await app.register(authRoutes);
  await app.register(usersRoutes);

  if (process.env.SENTRY_DSN) {
    app.addHook("onError", async (_request, _reply, error) => {
      Sentry.captureException(error);
    });
  }

  return app;
}
