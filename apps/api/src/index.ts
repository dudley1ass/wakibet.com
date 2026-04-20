import { buildApp } from "./app.js";
import { initSentry } from "./lib/sentry.js";

initSentry();

const port = Number(process.env.PORT ?? 3000);
const host = process.env.HOST ?? "0.0.0.0";

const app = await buildApp();

try {
  await app.listen({ port, host });
  app.log.info({ port, host }, "WakiBet API listening");
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
