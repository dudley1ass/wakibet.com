import { prisma } from "./prisma.js";
import { syncTournamentEventCatalog } from "./fantasyTournamentCatalog.js";
import { getTournamentData, TOURNAMENT_KEYS } from "./winterSpringsData.js";

/** Upsert `TournamentEventCatalog` from on-disk schedule JSON for every known tournament key. */
export async function syncAllTournamentCatalogsFromDisk(
  log?: (msg: string, meta?: Record<string, unknown>) => void,
): Promise<void> {
  for (const k of TOURNAMENT_KEYS) {
    const d = await getTournamentData(k);
    if (d) {
      await syncTournamentEventCatalog(prisma, k, d);
      log?.("tournament_catalog_synced", { tournamentKey: k });
    }
  }
}
