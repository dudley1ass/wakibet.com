import { readFile } from "node:fs/promises";
import path from "node:path";

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

/** Stable division id: unlikely to appear in skill or age fields. */
export const DIVISION_KEY_DELIM = ":::";

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

let winterDataPromise: Promise<WinterData | null> | null = null;

/** Load once; first caller pays parse cost (not at process boot). */
export function getWinterData(): Promise<WinterData | null> {
  if (!winterDataPromise) {
    const jsonPath = path.join(process.cwd(), "data", "winter_springs_test_run_matches.json");
    winterDataPromise = readFile(jsonPath, "utf-8")
      .then((raw) => JSON.parse(raw) as WinterData)
      .catch(() => null);
  }
  return winterDataPromise;
}
