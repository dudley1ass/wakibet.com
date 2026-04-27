import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const jsonPath = path.join(here, "..", "data", "pictona_test_run_matches.json");

const raw = fs.readFileSync(jsonPath, "utf8");
const data = JSON.parse(raw);

/** 2026 MetroHealth Super Senior at Pictona — align fantasy locks with real weekend (not Mar test export). */
function dayForEventType(eventType) {
  const t = String(eventType).toLowerCase();
  if (t.includes("women")) return 8;
  if (t.includes("mixed")) return 9;
  if (t.includes("men")) return 10;
  return 8;
}

function timeSuffixFromEventDate(eventDate) {
  const s = String(eventDate).trim();
  const m = s.match(/\d{1,2}:\d{2}\s*(AM|PM)/i);
  if (m) return m[0];
  return "8:00 AM";
}

let n = 0;
for (const m of data.matches ?? []) {
  const day = dayForEventType(m.event_type);
  const timePart = timeSuffixFromEventDate(m.event_date);
  const next = `May ${day} 2026 ${timePart}`;
  if (m.event_date !== next) n += 1;
  m.event_date = next;
}

/** per_player_matches mirrors match dates for consistency */
for (const rows of Object.values(data.per_player_matches ?? {})) {
  for (const row of rows) {
    const day = dayForEventType(row.event_type);
    const timePart = timeSuffixFromEventDate(row.event_date);
    row.event_date = `May ${day} 2026 ${timePart}`;
  }
}

if (data.summary) {
  data.summary.tournament_name = "2026 MetroHealth Super Senior Doubles Championships (50+) at Pictona";
}

fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2) + "\n", "utf8");
console.log(`Updated ${n} match rows (+ per_player_matches) in ${jsonPath}`);
