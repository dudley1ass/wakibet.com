import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { AvpBeachRegisteredTeam } from "@wakibet/shared";
import {
  accentFoldName,
  type AvpAthleteProfile,
  parseCsvFields,
} from "./loadAvpSouthBeachAthletesCsv.js";

const HB_TITLE = "AVP Huntington Beach Open";

async function readHuntingtonCsvRaw(): Promise<string | null> {
  const envRaw = process.env.AVP_HUNTINGTON_BEACH_ATHLETES_CSV?.trim();
  const moduleDir = path.dirname(fileURLToPath(import.meta.url));
  const candidates = [
    envRaw ? (path.isAbsolute(envRaw) ? envRaw : path.resolve(process.cwd(), envRaw)) : null,
    path.resolve(moduleDir, "../../../../data/avp_huntington_beach_open_athletes.csv"),
    path.resolve(process.cwd(), "data/avp_huntington_beach_open_athletes.csv"),
    path.resolve(process.cwd(), "apps/api/data/avp_huntington_beach_open_athletes.csv"),
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

function slugPart(name: string): string {
  return accentFoldName(name.replace(/\s*\([^)]*\)\s*/g, " ").trim())
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 22);
}

function teamKeyHb(prefix: "w" | "m", a: string, b: string): string {
  return `hb26-${prefix}-${slugPart(a)}-${slugPart(b)}`;
}

function parsePairCell(cell: string): [string, string] | null {
  const c = cell.trim();
  if (!c.includes(" / ")) return null;
  const parts = c.split(" / ").map((p) => p.trim());
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
  return [parts[0]!, parts[1]!];
}

type ScanMode = "athletes" | "womens_teams" | "mens_teams";

/**
 * Huntington CSV: player rows (6 columns), then `Womesn Teams` / `Mens teams` sections with `A / B,,,,,` pair lines.
 */
export async function loadHuntingtonBeachOpenTeamPool(): Promise<{
  title: string;
  teams: AvpBeachRegisteredTeam[];
  athleteMap: Map<string, AvpAthleteProfile>;
}> {
  const raw = await readHuntingtonCsvRaw();
  const athleteMap = new Map<string, AvpAthleteProfile>();
  const wTeams: AvpBeachRegisteredTeam[] = [];
  const mTeams: AvpBeachRegisteredTeam[] = [];

  if (!raw) {
    return { title: HB_TITLE, teams: [], athleteMap };
  }

  const lines = raw.trim().split(/\r?\n/);
  let mode: ScanMode = "athletes";

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]!;
    if (!line.trim()) continue;
    const row = parseCsvFields(line);
    const c0 = (row[0] ?? "").trim();
    if (!c0) continue;

    if (/^womesn teams$/i.test(c0) || /^womens teams$/i.test(c0)) {
      mode = "womens_teams";
      continue;
    }
    if (/^mens teams$/i.test(c0)) {
      mode = "mens_teams";
      continue;
    }

    if (mode === "athletes") {
      if (c0 === "Player" && (row[1] ?? "").trim() === "Position") continue;
      if (row.length < 6) continue;
      if (c0.includes(" / ") && !(row[1] ?? "").trim()) continue;
      const key = accentFoldName(c0);
      if (!athleteMap.has(key)) {
        athleteMap.set(key, {
          player: c0,
          position: (row[1] ?? "").trim(),
          height: (row[2] ?? "").trim(),
          location: (row[3] ?? "").trim(),
          usual_side: (row[4] ?? "").trim(),
          usual_defense: (row[5] ?? "").trim(),
        });
      }
      continue;
    }

    const pair = parsePairCell(c0);
    if (!pair) continue;
    const [p1, p2] = pair;
    const t: AvpBeachRegisteredTeam = {
      team_key: teamKeyHb(mode === "womens_teams" ? "w" : "m", p1, p2),
      division_code: mode === "womens_teams" ? "heritage_womens" : "heritage_mens",
      division_label: mode === "womens_teams" ? "Womens" : "Mens",
      player_one: p1,
      player_two: p2,
      team_label: `${p1} / ${p2}`,
    };
    if (mode === "womens_teams") wTeams.push(t);
    else mTeams.push(t);
  }

  return {
    title: HB_TITLE,
    teams: [...wTeams, ...mTeams],
    athleteMap,
  };
}
