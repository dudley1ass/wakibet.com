#!/usr/bin/env node
import { promises as fs } from "node:fs";
import path from "node:path";

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith("--")) continue;
    const key = a.slice(2);
    const value = argv[i + 1];
    if (!value || value.startsWith("--")) {
      out[key] = "true";
      continue;
    }
    out[key] = value;
    i++;
  }
  return out;
}

function parseCsvLine(line) {
  const cells = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (ch === "," && !inQuotes) {
      cells.push(cur);
      cur = "";
      continue;
    }
    cur += ch;
  }
  cells.push(cur);
  return cells;
}

function toCsvLine(cells) {
  return cells
    .map((c) => {
      const value = String(c ?? "");
      if (value.includes(",") || value.includes('"') || value.includes("\n")) {
        return `"${value.replaceAll('"', '""')}"`;
      }
      return value;
    })
    .join(",");
}

function usage() {
  console.log(`Usage:
  pnpm --filter @wakibet/api exec node scripts/clone-mlp-tournament.mjs \\
    --source mlp_dallas_2026 \\
    --target mlp_orlando_2026 \\
    --name "MLP Orlando 2026" \\
    --start 2026-06-20 \\
    --end 2026-06-23 \\
    [--official-csv data/mlp_orlando_2026_official.csv] \\
    [--source-url https://www.majorleaguepickleball.net/...]
`);
}

function num(v, fallback = 0) {
  const n = Number.parseInt(String(v ?? ""), 10);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeName(v) {
  return String(v ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function isInactiveOrSub(value) {
  const s = String(value ?? "").toLowerCase();
  return s.includes("inactive") || s.includes("sub") || s.includes("bench");
}

function scoreAdjustment(row, changeType) {
  let delta = 0;
  const notes = `${row.source_note ?? ""} ${row.acquisition ?? ""}`.toLowerCase();
  if (notes.includes("strong")) delta += 2;
  if (notes.includes("poor")) delta -= 2;
  if (changeType === "added" && num(row.roster_slot, 99) <= 4) delta += 3;
  if (isInactiveOrSub(row.acquisition) || num(row.roster_slot, 99) > 4) delta -= 3;
  return delta;
}

function clampPrice(price) {
  return Math.max(3000, Math.min(10000, price));
}

async function loadRows(filePath) {
  const raw = await fs.readFile(filePath, "utf8");
  const lines = raw.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) throw new Error(`CSV has no rows: ${filePath}`);
  const header = parseCsvLine(lines[0]);
  const idx = Object.fromEntries(header.map((h, i) => [h, i]));
  const rows = lines.slice(1).map((line) => {
    const cols = parseCsvLine(line);
    return Object.fromEntries(header.map((h, i) => [h, cols[i] ?? ""]));
  });
  return { header, idx, rows };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const source = args.source;
  const target = args.target;
  const name = args.name;
  const start = args.start;
  const end = args.end;
  const officialCsv = args["official-csv"];
  const sourceUrl = args["source-url"] ?? "";

  if (!source || !target || !name || !start || !end) {
    usage();
    process.exit(1);
  }

  const dataDir = path.resolve(process.cwd(), "data");
  const sourceFile = path.join(dataDir, `${source}_players_wakicash.csv`);
  const targetFile = path.join(dataDir, `${target}_players_wakicash.csv`);
  const checklistFile = path.join(dataDir, `${target}_replacement_checklist.txt`);
  const mlpTablesDir = path.join(dataDir, "mlp_tables", target);
  const sourceRowsObj = await loadRows(sourceFile);
  const header = sourceRowsObj.header;
  const idx = sourceRowsObj.idx;
  const sourceRows = sourceRowsObj.rows;

  const required = ["event_id", "event_name", "event_start", "event_end", "team", "player"];
  for (const col of required) {
    if (idx[col] == null) throw new Error(`Missing required column "${col}" in ${sourceFile}`);
  }

  const incomingRows = officialCsv
    ? (await loadRows(path.isAbsolute(officialCsv) ? officialCsv : path.resolve(process.cwd(), officialCsv))).rows
    : sourceRows.map((r) => ({ ...r }));

  const oldByPlayer = new Map(sourceRows.map((r) => [normalizeName(r.player), r]));
  const oldTeamByPlayer = new Map(sourceRows.map((r) => [normalizeName(r.player), r.team]));
  const newTeamByPlayer = new Map(incomingRows.map((r) => [normalizeName(r.player), r.team]));

  const finalRows = incomingRows.map((r) => {
    const prev = oldByPlayer.get(normalizeName(r.player));
    const keptPrice = prev ? num(prev.wakicash_base_price, num(r.wakicash_base_price, 5000)) : num(r.wakicash_base_price, 5000);
    const playerKey = normalizeName(r.player);
    const inOld = oldByPlayer.has(playerKey);
    const changeType = inOld ? "none" : "added";
    const adjusted = clampPrice(keptPrice + scoreAdjustment(r, changeType));
    return {
      ...r,
      event_id: target,
      event_name: name,
      event_start: start,
      event_end: end,
      wakicash_base_price: String(adjusted),
    };
  });

  const oldPlayers = new Set(sourceRows.map((r) => normalizeName(r.player)));
  const newPlayers = new Set(finalRows.map((r) => normalizeName(r.player)));
  const detectedAt = new Date().toISOString();
  const rosterChanges = [];

  for (const p of oldPlayers) {
    if (!newPlayers.has(p)) {
      const row = oldByPlayer.get(p);
      rosterChanges.push({
        event_id: target,
        team_id: row?.team ?? "",
        old_player_id: row?.player ?? "",
        new_player_id: "",
        change_type: "player_removed",
        reason: "Missing from incoming event roster snapshot",
        source_url: sourceUrl,
        detected_at: detectedAt,
      });
    }
  }
  for (const row of finalRows) {
    const p = normalizeName(row.player);
    if (!oldPlayers.has(p)) {
      rosterChanges.push({
        event_id: target,
        team_id: row.team,
        old_player_id: "",
        new_player_id: row.player,
        change_type: "player_added",
        reason: "Present in incoming event roster snapshot",
        source_url: sourceUrl,
        detected_at: detectedAt,
      });
    } else {
      const oldTeam = oldTeamByPlayer.get(p);
      const newTeam = newTeamByPlayer.get(p);
      if (oldTeam && newTeam && oldTeam !== newTeam) {
        rosterChanges.push({
          event_id: target,
          team_id: newTeam,
          old_player_id: row.player,
          new_player_id: row.player,
          change_type: "team_changed",
          reason: `${oldTeam} -> ${newTeam}`,
          source_url: sourceUrl,
          detected_at: detectedAt,
        });
      }
    }
    if (isInactiveOrSub(row.acquisition)) {
      rosterChanges.push({
        event_id: target,
        team_id: row.team,
        old_player_id: row.player,
        new_player_id: row.player,
        change_type: "inactive_substitute_status",
        reason: row.acquisition || "Marked inactive/substitute",
        source_url: sourceUrl,
        detected_at: detectedAt,
      });
    }
  }

  const outCsv =
    [toCsvLine(header), ...finalRows.map((row) => toCsvLine(header.map((h) => row[h] ?? "")))].join("\n") + "\n";
  await fs.writeFile(targetFile, outCsv, "utf8");

  const teams = new Map();
  for (const row of finalRows) {
    const team = row.team;
    const player = row.player;
    if (!teams.has(team)) teams.set(team, []);
    teams.get(team).push(player);
  }

  const teamNames = [...teams.keys()].sort((a, b) => a.localeCompare(b));
  const checklist = [];
  checklist.push(`Tournament: ${name}`);
  checklist.push(`Key: ${target}`);
  checklist.push(`Dates: ${start} -> ${end}`);
  checklist.push("");
  checklist.push("Replacement checklist (compare against latest official roster):");
  checklist.push("");
  for (const team of teamNames) {
    checklist.push(`- ${team}`);
    const players = [...teams.get(team)].sort((a, b) => a.localeCompare(b));
    for (const p of players) checklist.push(`  - [ ] ${p}`);
    checklist.push("");
  }
  await fs.writeFile(checklistFile, checklist.join("\n"), "utf8");

  await fs.mkdir(mlpTablesDir, { recursive: true });
  const eventsTableHeader = ["event_id", "event_name", "event_start", "event_end"];
  const teamsTableHeader = ["team_id", "team_name"];
  const playersTableHeader = ["player_id", "player_name", "gender"];
  const eventPlayersHeader = ["event_id", "team_id", "player_id", "status", "wakicash_price", "tier"];
  const rosterChangesHeader = [
    "event_id",
    "team_id",
    "old_player_id",
    "new_player_id",
    "change_type",
    "reason",
    "source_url",
    "detected_at",
  ];

  const uniqueTeams = [...new Set(finalRows.map((r) => r.team))].sort((a, b) => a.localeCompare(b));
  const uniquePlayers = [...new Map(finalRows.map((r) => [normalizeName(r.player), r])).values()];
  const eventsTable = [eventsTableHeader, [target, name, start, end]];
  const teamsTable = [teamsTableHeader, ...uniqueTeams.map((t) => [t, t])];
  const playersTable = [playersTableHeader, ...uniquePlayers.map((r) => [r.player, r.player, r.gender_guess || ""])];
  const eventPlayersTable = [
    eventPlayersHeader,
    ...finalRows.map((r) => [
      target,
      r.team,
      r.player,
      isInactiveOrSub(r.acquisition) ? "inactive_sub" : "active",
      r.wakicash_base_price,
      "",
    ]),
  ];
  const rosterChangesTable = [
    rosterChangesHeader,
    ...rosterChanges.map((r) => [
      r.event_id,
      r.team_id,
      r.old_player_id,
      r.new_player_id,
      r.change_type,
      r.reason,
      r.source_url,
      r.detected_at,
    ]),
  ];

  await fs.writeFile(path.join(mlpTablesDir, "events.csv"), eventsTable.map(toCsvLine).join("\n") + "\n", "utf8");
  await fs.writeFile(path.join(mlpTablesDir, "teams.csv"), teamsTable.map(toCsvLine).join("\n") + "\n", "utf8");
  await fs.writeFile(path.join(mlpTablesDir, "players.csv"), playersTable.map(toCsvLine).join("\n") + "\n", "utf8");
  await fs.writeFile(
    path.join(mlpTablesDir, "event_players.csv"),
    eventPlayersTable.map(toCsvLine).join("\n") + "\n",
    "utf8",
  );
  await fs.writeFile(
    path.join(mlpTablesDir, "roster_changes.csv"),
    rosterChangesTable.map(toCsvLine).join("\n") + "\n",
    "utf8",
  );

  console.log(`Created ${path.basename(targetFile)}`);
  console.log(`Created ${path.basename(checklistFile)}`);
  console.log(`Created table snapshots in ${mlpTablesDir}`);
  console.log(`Roster changes detected: ${rosterChanges.length}`);
  console.log(`Teams: ${teamNames.length}`);
  console.log(`Players: ${finalRows.length}`);
}

main().catch((err) => {
  console.error(err?.message ?? err);
  process.exit(1);
});

