import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Schedule JSON lives under `apps/api/data` regardless of process cwd (turbo/monorepo, Render, etc.). */
function tournamentScheduleDataDir(): string {
  const here = path.dirname(fileURLToPath(import.meta.url));
  return path.join(here, "..", "..", "data");
}

export type WinterMatch = {
  match_id: string;
  event_type: string;
  skill_level: string;
  age_bracket: string;
  event_date: string;
  player_a: string;
  player_b: string;
  status: string;
};

export type WinterPerPlayer = {
  match_id: string;
  event_type: string;
  skill_level: string;
  age_bracket: string;
  event_date: string;
  opponent: string;
};

export type WinterData = {
  summary: { tournament_name: string; matches_generated: number };
  matches: WinterMatch[];
  per_player_matches: Record<string, WinterPerPlayer[]>;
};

export const TOURNAMENT_KEYS = ["winter_springs", "pictona", "jacksonville", "bradenton"] as const;
export type TournamentKey = (typeof TOURNAMENT_KEYS)[number];

const TOURNAMENT_FILES: Record<TournamentKey, string> = {
  winter_springs: "winter_springs_test_run_matches.json",
  pictona: "pictona_test_run_matches.json",
  jacksonville: "jacksonville_test_run_matches.json",
  bradenton: "bradenton_test_run_matches.json",
};

const TOURNAMENT_LABELS: Record<TournamentKey, string> = {
  winter_springs: "Winter Springs",
  pictona: "Pictona",
  jacksonville: "Jacksonville",
  bradenton: "Bradenton",
};

/** Stable division id: unlikely to appear in skill or age fields. */
export const DIVISION_KEY_DELIM = ":::";
const STORED_ROSTER_KEY_DELIM = "::TOURNEY::";

export function divisionKeyFromMatch(m: WinterMatch): string {
  return `${m.event_type}${DIVISION_KEY_DELIM}${m.skill_level}${DIVISION_KEY_DELIM}${m.age_bracket}`;
}

export function parseDivisionKey(key: string): {
  event_type: string;
  skill_level: string;
  age_bracket: string;
} | null {
  const parts = key.split(DIVISION_KEY_DELIM);
  if (parts.length !== 3) return null;
  return { event_type: parts[0], skill_level: parts[1], age_bracket: parts[2] };
}

export function isTournamentKey(value: string): value is TournamentKey {
  return (TOURNAMENT_KEYS as readonly string[]).includes(value);
}

export function listTournamentOptions(): {
  tournament_key: TournamentKey;
  label: string;
}[] {
  return TOURNAMENT_KEYS.map((k) => ({ tournament_key: k, label: TOURNAMENT_LABELS[k] }));
}

export function toStoredDivisionKey(tournamentKey: TournamentKey, divisionKey: string): string {
  return `${tournamentKey}${STORED_ROSTER_KEY_DELIM}${divisionKey}`;
}

export function parseStoredDivisionKey(storedKey: string): {
  tournament_key: TournamentKey;
  division_key: string;
} | null {
  const idx = storedKey.indexOf(STORED_ROSTER_KEY_DELIM);
  if (idx < 0) {
    // Backward compatibility with older Winter Springs rows.
    if (!parseDivisionKey(storedKey)) return null;
    return { tournament_key: "winter_springs", division_key: storedKey };
  }
  const tournamentKey = storedKey.slice(0, idx);
  const divisionKey = storedKey.slice(idx + STORED_ROSTER_KEY_DELIM.length);
  if (!isTournamentKey(tournamentKey)) return null;
  if (!parseDivisionKey(divisionKey)) return null;
  return { tournament_key: tournamentKey, division_key: divisionKey };
}

export function filterMatchesForDivision(
  matches: WinterMatch[],
  divisionKey: string,
): WinterMatch[] {
  const p = parseDivisionKey(divisionKey);
  if (!p) return [];
  return matches.filter(
    (m) =>
      m.event_type === p.event_type &&
      m.skill_level === p.skill_level &&
      m.age_bracket === p.age_bracket,
  );
}

export function uniquePlayersInMatches(matches: WinterMatch[]): string[] {
  const s = new Set<string>();
  for (const m of matches) {
    s.add(m.player_a);
    s.add(m.player_b);
  }
  return [...s].sort((a, b) => a.localeCompare(b));
}

/**
 * Featured divisions for fantasy: enough "teams" (here: distinct players) for a fair pool.
 * — at least 6 players.
 */
export const FEATURED_MIN_PLAYERS = 6;

export function isFeaturedWinterDivision(row: {
  player_count: number;
  match_count: number;
}): boolean {
  if (row.player_count >= FEATURED_MIN_PLAYERS) return true;
  return false;
}

export function listFeaturedDivisionsFromMatches(matches: WinterMatch[]): {
  division_key: string;
  event_type: string;
  skill_level: string;
  age_bracket: string;
  match_count: number;
  player_count: number;
}[] {
  return listDivisionsFromMatches(matches).filter(isFeaturedWinterDivision);
}

export function isDivisionFeaturedFromMatches(matches: WinterMatch[], divisionKey: string): boolean {
  const ms = filterMatchesForDivision(matches, divisionKey);
  if (ms.length === 0) return false;
  return isFeaturedWinterDivision({
    player_count: uniquePlayersInMatches(ms).length,
    match_count: ms.length,
  });
}

export function listDivisionsFromMatches(matches: WinterMatch[]): {
  division_key: string;
  event_type: string;
  skill_level: string;
  age_bracket: string;
  match_count: number;
  player_count: number;
}[] {
  const byKey = new Map<string, WinterMatch[]>();
  for (const m of matches) {
    const k = divisionKeyFromMatch(m);
    const arr = byKey.get(k);
    if (arr) arr.push(m);
    else byKey.set(k, [m]);
  }
  const rows: {
    division_key: string;
    event_type: string;
    skill_level: string;
    age_bracket: string;
    match_count: number;
    player_count: number;
  }[] = [];
  for (const [division_key, ms] of byKey) {
    const parsed = parseDivisionKey(division_key);
    if (!parsed) continue;
    rows.push({
      division_key,
      event_type: parsed.event_type,
      skill_level: parsed.skill_level,
      age_bracket: parsed.age_bracket,
      match_count: ms.length,
      player_count: uniquePlayersInMatches(ms).length,
    });
  }
  rows.sort((a, b) => {
    const c = a.event_type.localeCompare(b.event_type);
    if (c !== 0) return c;
    const d = a.skill_level.localeCompare(b.skill_level, undefined, { numeric: true });
    if (d !== 0) return d;
    return a.age_bracket.localeCompare(b.age_bracket);
  });
  return rows;
}

const tournamentDataPromises = new Map<TournamentKey, Promise<WinterData | null>>();

/** Load once per tournament; first caller pays parse cost. */
export function getTournamentData(tournamentKey: TournamentKey): Promise<WinterData | null> {
  const cached = tournamentDataPromises.get(tournamentKey);
  if (cached) return cached;
  const jsonPath = path.join(tournamentScheduleDataDir(), TOURNAMENT_FILES[tournamentKey]);
  const promise = readFile(jsonPath, "utf-8")
    .then((raw) => JSON.parse(raw) as WinterData)
    .catch(() => null);
  tournamentDataPromises.set(tournamentKey, promise);
  return promise;
}

/** Backward compatibility for existing call sites. */
export function getWinterData(): Promise<WinterData | null> {
  return getTournamentData("winter_springs");
}
