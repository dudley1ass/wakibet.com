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
