import { buildApp } from "./app.js";
import { prisma } from "./lib/prisma.js";
import { initSentry } from "./lib/sentry.js";
import { syncAllTournamentCatalogsFromDisk } from "./lib/syncTournamentCatalogsJob.js";
import { ensureNascarCup2026Weeks } from "./sports/nascar/lib/ensureNascarCup2026Weeks.js";

initSentry();

const port = Number(process.env.PORT ?? 3000);
const host = process.env.HOST ?? "0.0.0.0";

const app = await buildApp();

try {
  const n = await ensureNascarCup2026Weeks(prisma);
  app.log.info({ weeks: n }, "nascar_cup_2026_schedule_ensured");
} catch (err) {
  app.log.error({ err }, "nascar_cup_2026_schedule_bootstrap_failed");
}

try {
  await app.listen({ port, host });
  app.log.info({ port, host }, "WakiBet API listening");
} catch (err) {
  app.log.error(err);
  process.exit(1);
}

const CATALOG_SYNC_INTERVAL_MS = 6 * 60 * 60 * 1000;

function runCatalogSync(reason: string): void {
  void syncAllTournamentCatalogsFromDisk((msg, meta) =>
    app.log.info({ ...meta, reason }, msg),
  ).catch((err) => app.log.error({ err, reason }, "tournament_catalog_sync_failed"));
}

runCatalogSync("boot");
setInterval(() => runCatalogSync("interval"), CATALOG_SYNC_INTERVAL_MS);
