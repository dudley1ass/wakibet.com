import { buildApp } from "./app.js";
import { initSentry } from "./lib/sentry.js";
import { syncAllTournamentCatalogsFromDisk } from "./lib/syncTournamentCatalogsJob.js";

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

const CATALOG_SYNC_INTERVAL_MS = 6 * 60 * 60 * 1000;

function runCatalogSync(reason: string): void {
  void syncAllTournamentCatalogsFromDisk((msg, meta) =>
    app.log.info({ ...meta, reason }, msg),
  ).catch((err) => app.log.error({ err, reason }, "tournament_catalog_sync_failed"));
}

runCatalogSync("boot");
setInterval(() => runCatalogSync("interval"), CATALOG_SYNC_INTERVAL_MS);
