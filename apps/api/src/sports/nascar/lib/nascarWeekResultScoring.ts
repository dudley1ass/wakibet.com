/** Captain multiplier (see web NASCAR scoring copy). */
export const NASCAR_CAPTAIN_MULTIPLIER = 1.5;

export type DriverRow = { driverKey: string; displayName: string };

export function foldDriverLabel(s: string): string {
  return s
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

/** Folded display label → canonical `driverKey` when the results feed uses a different spelling. */
const DISPLAY_NAME_ALIASES: Record<string, string> = {
  "john h nemechek": "john-hunter-nemechek",
};

export function resolveDisplayNameToDriverKey(
  drivers: DriverRow[],
  displayNameFromResult: string,
): string | null {
  const folded = foldDriverLabel(displayNameFromResult);
  const alias = DISPLAY_NAME_ALIASES[folded];
  if (alias) return alias;

  for (const d of drivers) {
    if (foldDriverLabel(d.displayName) === folded) return d.driverKey;
  }

  const last = folded.split(" ").pop();
  if (!last) return null;
  const cand = drivers.filter((d) => foldDriverLabel(d.displayName).split(" ").pop() === last);
  if (cand.length === 1) return cand[0]!.driverKey;
  return null;
}

export function buildDriverPointsByKey(
  drivers: DriverRow[],
  results: { displayName: string; points: number }[],
): { map: Record<string, number>; unresolved: string[] } {
  const map: Record<string, number> = {};
  const unresolved: string[] = [];
  for (const r of results) {
    const k = resolveDisplayNameToDriverKey(drivers, r.displayName);
    if (!k) {
      unresolved.push(r.displayName);
      continue;
    }
    map[k] = r.points;
  }
  return { map, unresolved };
}

export function pickFantasyPoints(params: {
  driverKey: string;
  driverPointsByKey: Record<string, number>;
  isCaptain: boolean;
}): number {
  const raw = params.driverPointsByKey[params.driverKey] ?? 0;
  const mult = params.isCaptain ? NASCAR_CAPTAIN_MULTIPLIER : 1;
  return Math.round(raw * mult * 100) / 100;
}

/** Parse `NascarWeek.driverPointsByKey` JSON; empty object → null (use fallbacks). */
export function parseDriverPointsByKey(json: unknown): Record<string, number> | null {
  if (json == null || typeof json !== "object" || Array.isArray(json)) return null;
  const rec = json as Record<string, unknown>;
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(rec)) {
    if (typeof v === "number" && Number.isFinite(v)) out[k] = v;
  }
  return Object.keys(out).length > 0 ? out : null;
}

export type NascarLineupPickForScoring = {
  isCaptain: boolean;
  points: number;
  driver: { driverKey: string };
};

/**
 * Fantasy points for one weekly lineup: prefer recomputing from official
 * `driverPointsByKey` when present so leaderboards stay correct even if
 * `totalPts` / `pick.points` were not backfilled.
 */
export function computeNascarLineupPoints(
  totalPts: number,
  weekDriverPointsJson: unknown,
  picks: NascarLineupPickForScoring[],
): number {
  const map = parseDriverPointsByKey(weekDriverPointsJson);
  if (map) {
    let sum = 0;
    for (const p of picks) {
      sum += pickFantasyPoints({
        driverKey: p.driver.driverKey,
        driverPointsByKey: map,
        isCaptain: p.isCaptain,
      });
    }
    return Math.round(sum * 100) / 100;
  }
  const fromPicks = picks.reduce((s, p) => s + p.points, 0);
  if (fromPicks > 0) return Math.round(fromPicks * 100) / 100;
  return Math.round(totalPts * 100) / 100;
}
