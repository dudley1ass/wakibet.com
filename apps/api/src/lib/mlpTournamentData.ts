import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

type MlpCsvRow = {
  event_id: string;
  event_name: string;
  event_start: string;
  event_end: string;
  team: string;
  player: string;
  gender_guess: string;
  roster_slot: string;
  acquisition: string;
  buy_type: string;
  wakicash_base_price: string;
  source_note: string;
};

export type MlpPlayerRow = {
  player_name: string;
  gender: "M" | "F";
  team: string;
  tier: "S+" | "S" | "A" | "B" | "C" | "D";
  waki_cash: number;
};

function tournamentDataDir(): string {
  const here = path.dirname(fileURLToPath(import.meta.url));
  return path.join(here, "..", "..", "data");
}

function parseCsvLine(line: string): string[] {
  return line.split(",").map((c) => c.trim());
}

function priceFromBase(basePrice: number): number {
  if (basePrice >= 9500) return 30;
  if (basePrice >= 8500) return 26;
  if (basePrice >= 7500) return 22;
  if (basePrice >= 6500) return 18;
  if (basePrice >= 5500) return 14;
  return 10;
}

function tierFromPrice(price: number): "S+" | "S" | "A" | "B" | "C" | "D" {
  if (price >= 30) return "S+";
  if (price >= 26) return "S";
  if (price >= 22) return "A";
  if (price >= 18) return "B";
  if (price >= 14) return "C";
  return "D";
}

const mlpPlayersPromiseByKey = new Map<string, Promise<MlpPlayerRow[]>>();

export function getMlpPlayersForTournament(tournamentKey: string): Promise<MlpPlayerRow[]> {
  const cached = mlpPlayersPromiseByKey.get(tournamentKey);
  if (cached) return cached;
  const csvPath = path.join(tournamentDataDir(), `${tournamentKey}_players_wakicash.csv`);
  const promise = readFile(csvPath, "utf-8")
    .then((raw) => {
      const lines = raw
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean);
      if (lines.length < 2) return [] as MlpPlayerRow[];
      const header = parseCsvLine(lines[0]!);
      const index = Object.fromEntries(header.map((h, i) => [h, i]));
      const rows: MlpPlayerRow[] = [];
      for (const line of lines.slice(1)) {
        const cols = parseCsvLine(line);
        const row = {
          event_id: cols[index.event_id] ?? "",
          team: cols[index.team] ?? "",
          player: cols[index.player] ?? "",
          gender_guess: cols[index.gender_guess] ?? "",
          wakicash_base_price: cols[index.wakicash_base_price] ?? "",
        } as MlpCsvRow;
        if (row.event_id !== tournamentKey || !row.player) continue;
        const basePrice = Number.parseInt(row.wakicash_base_price, 10);
        const waki_cash = Number.isFinite(basePrice) ? priceFromBase(basePrice) : 10;
        const gender = row.gender_guess.toUpperCase().startsWith("F") ? "F" : "M";
        rows.push({
          player_name: row.player,
          team: row.team,
          gender,
          tier: tierFromPrice(waki_cash),
          waki_cash,
        });
      }
      return rows;
    })
    .catch(() => []);
  mlpPlayersPromiseByKey.set(tournamentKey, promise);
  return promise;
}

export function isMlpTournament(tournamentKey: string): boolean {
  return tournamentKey.startsWith("mlp_");
}

