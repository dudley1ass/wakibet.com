/**
 * Imports PPA-style leaderboard .xlsx files from a directory into PpaResult* tables.
 * Layout: row1 = event title, row2 = headers (Teams, Rank, Round, Wins, PD %),
 * doubles = two consecutive rows per team (stats row + partner name row); singles = one row each.
 *
 * Usage:
 *   pnpm --filter @wakibet/api run db:import:ppa-xlsx -- "C:\\App\\data"
 *
 * Requires migration `20260429183000_ppa_tour_result_tables` applied.
 */
import * as fs from "node:fs";
import * as path from "node:path";
import XLSX from "xlsx";

import { prisma } from "../src/lib/prisma.js";

const DEFAULT_YEAR = 2026;

function normalizeFilename(base: string): string {
  return base
    .toLowerCase()
    .replace(/te4xas/g, "texas")
    .replace(/ncarvana/g, "carvana")
    .replace(/czimmer/g, "zimmer")
    .trim();
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

function splitCamelCase(s: string): string {
  return s
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim();
}

function parseTeamCell(raw: unknown): { displayName: string; city: string | null; state: string | null } {
  const s = String(raw ?? "").trim();
  const m = s.match(/^(.+)\(([^,]+),\s*([^)]+)\)\s*$/);
  if (m) {
    return {
      displayName: splitCamelCase(m[1].trim()),
      city: m[2].trim().replace(/\u00a0/g, " "),
      state: m[3].trim().replace(/\u00a0/g, " "),
    };
  }
  return { displayName: splitCamelCase(s), city: null, state: null };
}

function medalFromFirstCell(v: unknown): string | null {
  const t = String(v ?? "").trim().toUpperCase();
  if (t === "GLD") return "Gold";
  if (t === "SLV") return "Silver";
  if (t === "BRZ") return "Bronze";
  return null;
}

type FileMeta = {
  tournamentTitle: string;
  eventType: "Singles" | "Doubles" | "Mixed Doubles";
  genderDivision: "Men" | "Women" | "Mixed";
  defaultGender: "M" | "F" | null;
};

function parseFilenameMeta(baseNoExt: string): FileMeta | null {
  const n = normalizeFilename(baseNoExt);
  if (n.startsWith("mixed doubles ")) {
    const title = baseNoExt.slice("mixed doubles ".length).trim();
    return {
      tournamentTitle: title.replace(/\.xlsx$/i, ""),
      eventType: "Mixed Doubles",
      genderDivision: "Mixed",
      defaultGender: null,
    };
  }
  if (n.startsWith("mens doubles ")) {
    const title = baseNoExt.slice("mens doubles ".length).trim();
    return {
      tournamentTitle: title.replace(/\.xlsx$/i, ""),
      eventType: "Doubles",
      genderDivision: "Men",
      defaultGender: "M",
    };
  }
  if (n.startsWith("womens doubles ")) {
    const title = baseNoExt.slice("womens doubles ".length).trim();
    return {
      tournamentTitle: title.replace(/\.xlsx$/i, ""),
      eventType: "Doubles",
      genderDivision: "Women",
      defaultGender: "F",
    };
  }
  const mensSinglesPro = /^mens\s+singles\s+pro\s+/i;
  if (mensSinglesPro.test(baseNoExt)) {
    const title = baseNoExt.replace(mensSinglesPro, "").trim();
    return {
      tournamentTitle: title.replace(/\.xlsx$/i, ""),
      eventType: "Singles",
      genderDivision: "Men",
      defaultGender: "M",
    };
  }
  const womensSinglesPro = /^womens\s+singles\s+/i;
  if (womensSinglesPro.test(baseNoExt)) {
    const rest = baseNoExt.replace(womensSinglesPro, "").replace(/^pro\s+/i, "").trim();
    return {
      tournamentTitle: rest.replace(/\.xlsx$/i, ""),
      eventType: "Singles",
      genderDivision: "Women",
      defaultGender: "F",
    };
  }
  return null;
}

function tournamentIdFromTitle(title: string, year: number): string {
  return `ppa_${slugify(title)}_${year}`;
}

function num(v: unknown): number {
  if (v === null || v === undefined || v === "") return NaN;
  const n = Number(v);
  return Number.isFinite(n) ? n : NaN;
}

function rowHasResultStats(row: unknown[]): boolean {
  const rank = num(row[2]);
  const rounds = num(row[3]);
  const wins = num(row[4]);
  const pd = num(row[5]);
  return Number.isFinite(rank) && Number.isFinite(rounds) && Number.isFinite(wins) && Number.isFinite(pd);
}

function isLikelyDoublesPartnerRow(next: unknown[] | undefined): boolean {
  if (!next || next.length < 2) return false;
  const teams = next[1];
  if (teams === null || teams === undefined || String(teams).trim() === "") return false;
  return !Number.isFinite(num(next[2]));
}

async function ensurePlayer(
  displayName: string,
  gender: "M" | "F" | null,
  city: string | null,
  state: string | null,
): Promise<number> {
  const g = gender ?? "U";
  const playerKey = `${g}:${slugify(displayName)}`;
  const row = await prisma.ppaResultPlayer.upsert({
    where: { playerKey },
    create: {
      playerKey,
      playerName: displayName,
      gender,
      homeCity: city,
      homeState: state,
      active: "yes",
    },
    update: {
      playerName: displayName,
      homeCity: city ?? undefined,
      homeState: state ?? undefined,
      gender: gender ?? undefined,
    },
  });
  return row.id;
}

async function main(): Promise<void> {
  const dir = process.argv[2] ?? "C:\\App\\data";
  const year = Number(process.argv[3]) || DEFAULT_YEAR;
  if (!fs.existsSync(dir)) {
    console.error(`Directory not found: ${dir}`);
    process.exit(1);
  }

  const files = fs
    .readdirSync(dir)
    .filter((f) => f.toLowerCase().endsWith(".xlsx"))
    .map((f) => path.join(dir, f));

  let filesOk = 0;
  let rowsInserted = 0;

  for (const filePath of files) {
    const base = path.basename(filePath);
    const meta = parseFilenameMeta(base.replace(/\.xlsx$/i, ""));
    if (!meta) {
      console.warn(`Skip (unrecognized name pattern): ${base}`);
      continue;
    }

    const wb = XLSX.readFile(filePath);
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: null, raw: false }) as unknown[][];

    const eventNameFromSheet = String(rows[0]?.[0] ?? "").trim() || `${meta.genderDivision} ${meta.eventType} Pro Main Draw`;
    const tournamentId = tournamentIdFromTitle(meta.tournamentTitle, year);
    const eventId = `${tournamentId}_${slugify(eventNameFromSheet)}`;

    await prisma.ppaResultTournament.upsert({
      where: { id: tournamentId },
      create: {
        id: tournamentId,
        name: meta.tournamentTitle.replace(/\.xlsx$/i, ""),
        tour: "PPA",
        location: meta.tournamentTitle,
      },
      update: {
        name: meta.tournamentTitle.replace(/\.xlsx$/i, ""),
        location: meta.tournamentTitle,
      },
    });

    await prisma.ppaResultEvent.upsert({
      where: { id: eventId },
      create: {
        id: eventId,
        tournamentId,
        eventName: eventNameFromSheet,
        eventType: meta.eventType,
        genderDivision: meta.genderDivision,
      },
      update: {
        eventName: eventNameFromSheet,
        eventType: meta.eventType,
        genderDivision: meta.genderDivision,
      },
    });

    const batch: {
      playerId: number;
      tournamentId: string;
      eventId: string;
      partnerName: string | null;
      rank: number;
      roundsPlayed: number;
      wins: number;
      pd: number;
      medal: string | null;
    }[] = [];

    let i = 2;
    while (i < rows.length) {
      const row = rows[i];
      if (!Array.isArray(row) || row.length < 6) {
        i += 1;
        continue;
      }
      const teamsCell = row[1];
      if (teamsCell === null || teamsCell === undefined || String(teamsCell).trim() === "") {
        i += 1;
        continue;
      }

      if (!rowHasResultStats(row)) {
        i += 1;
        continue;
      }

      const rank = Math.trunc(num(row[2]));
      const roundsPlayed = Math.trunc(num(row[3]));
      const wins = Math.trunc(num(row[4]));
      const pd = Math.trunc(num(row[5]));
      const medal = medalFromFirstCell(row[0]);

      const isDoubles = meta.eventType === "Doubles" || meta.eventType === "Mixed Doubles";
      const next = rows[i + 1];
      if (isDoubles && isLikelyDoublesPartnerRow(Array.isArray(next) ? next : undefined)) {
        const p1 = parseTeamCell(row[1]);
        const p2 = parseTeamCell((next as unknown[])[1]);
        const id1 = await ensurePlayer(p1.displayName, meta.defaultGender, p1.city, p1.state);
        const id2 = await ensurePlayer(p2.displayName, meta.defaultGender, p2.city, p2.state);
        batch.push({
          playerId: id1,
          tournamentId,
          eventId,
          partnerName: p2.displayName,
          rank,
          roundsPlayed,
          wins,
          pd,
          medal,
        });
        batch.push({
          playerId: id2,
          tournamentId,
          eventId,
          partnerName: p1.displayName,
          rank,
          roundsPlayed,
          wins,
          pd,
          medal,
        });
        i += 2;
      } else {
        const p = parseTeamCell(row[1]);
        const id = await ensurePlayer(p.displayName, meta.defaultGender, p.city, p.state);
        batch.push({
          playerId: id,
          tournamentId,
          eventId,
          partnerName: null,
          rank,
          roundsPlayed,
          wins,
          pd,
          medal,
        });
        i += 1;
      }
    }

    if (batch.length === 0) {
      console.warn(`No rows parsed: ${base}`);
      continue;
    }

    const res = await prisma.ppaResultPlayerEvent.createMany({
      data: batch,
      skipDuplicates: true,
    });

    filesOk += 1;
    rowsInserted += res.count;
    console.log(`${base}: upserted event ${eventId}, inserted ${res.count} result row(s) (skipped duplicates not counted in batch size ${batch.length})`);
  }

  console.log(`Done. Files parsed: ${filesOk}, rows inserted (new only): ${rowsInserted}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => void prisma.$disconnect());
