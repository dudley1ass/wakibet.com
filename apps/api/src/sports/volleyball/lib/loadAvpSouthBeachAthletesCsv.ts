import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export type AvpAthleteProfile = {
  player: string;
  position: string;
  height: string;
  location: string;
  usual_side: string;
  usual_defense: string;
};

/** Fold for matching roster strings to CSV `Player` (handles accents, quotes, spacing). */
export function accentFoldName(s: string): string {
  return s
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/"/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/** Parse one CSV line with RFC4180-style double-quoted fields (handles `""` escapes). */
export function parseCsvFields(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let i = 0;
  let inQuotes = false;
  while (i < line.length) {
    const c = line[i]!;
    if (inQuotes) {
      if (c === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i += 1;
        continue;
      }
      cur += c;
      i += 1;
    } else {
      if (c === '"') {
        inQuotes = true;
        i += 1;
        continue;
      }
      if (c === ",") {
        out.push(cur);
        cur = "";
        i += 1;
        continue;
      }
      cur += c;
      i += 1;
    }
  }
  out.push(cur);
  return out;
}

async function readAvpSouthBeachAthletesCsvRaw(): Promise<string | null> {
  const envRaw = process.env.AVP_SOUTH_BEACH_ATHLETES_CSV?.trim();
  const moduleDir = path.dirname(fileURLToPath(import.meta.url));
  const candidates = [
    envRaw ? (path.isAbsolute(envRaw) ? envRaw : path.resolve(process.cwd(), envRaw)) : null,
    path.resolve(moduleDir, "../../../../data/avp_south_beach_may_open_athletes.csv"),
    path.resolve(process.cwd(), "data/avp_south_beach_may_open_athletes.csv"),
    path.resolve(process.cwd(), "apps/api/data/avp_south_beach_may_open_athletes.csv"),
  ].filter((p): p is string => Boolean(p));

  for (const csvPath of candidates) {
    try {
      return await fs.readFile(csvPath, "utf8");
    } catch {
      continue;
    }
  }
  return null;
}

/**
 * Load `avp_south_beach_may_open_athletes.csv` into a map keyed by `accentFoldName(Player)`.
 * Multiple CSV rows with same fold key keep the first (dedupe).
 */
export async function loadAvpSouthBeachAthleteMap(): Promise<Map<string, AvpAthleteProfile>> {
  const raw = await readAvpSouthBeachAthletesCsvRaw();
  const map = new Map<string, AvpAthleteProfile>();
  if (!raw) return map;

  const lines = raw.trim().split(/\r?\n/);
  if (lines.length < 2) return map;

  for (const line of lines.slice(1)) {
    if (!line.trim()) continue;
    const row = parseCsvFields(line);
    const player = (row[0] ?? "").trim();
    if (!player) continue;
    const key = accentFoldName(player);
    if (map.has(key)) continue;
    map.set(key, {
      player,
      position: (row[1] ?? "").trim(),
      height: (row[2] ?? "").trim(),
      location: (row[3] ?? "").trim(),
      usual_side: (row[4] ?? "").trim(),
      usual_defense: (row[5] ?? "").trim(),
    });
  }
  return map;
}

export function athleteProfileForRosterName(
  map: Map<string, AvpAthleteProfile>,
  rosterName: string,
): AvpAthleteProfile | null {
  const trimmed = rosterName.trim();
  if (!trimmed) return null;
  const tryKeys = (s: string): AvpAthleteProfile | null => {
    const k0 = accentFoldName(s);
    const hit0 = map.get(k0);
    if (hit0) return hit0;
    const nickStripped = s.replace(/"[^"]*"/g, "").replace(/\s+/g, " ").trim();
    const k1 = accentFoldName(nickStripped);
    return map.get(k1) ?? null;
  };
  const hit = tryKeys(trimmed);
  if (hit) return hit;
  const frStripped = trimmed.replace(/\s*\(FR[^)]*\)\s*/gi, "").trim();
  if (frStripped !== trimmed) return tryKeys(frStripped);
  return null;
}
