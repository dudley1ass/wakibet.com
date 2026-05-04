/**
 * Replaces synthetic `Womens Singles Pro Main Draw` rows — one schedule row per singles match.
 *
 * Run from repo root:
 *   node apps/api/scripts/apply-womens-singles-pro-results.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const jsonPath = path.join(here, "..", "data", "atlanta_weekend_test_run_matches.json");

const EVENT_TYPE = "Womens Singles Pro Main Draw";
const SKILL = "Open";
const AGE = "All";

function zipGames(s1, s2) {
  const n = Math.max(s1.length, s2.length);
  const out = [];
  for (let i = 0; i < n; i++) {
    const a = s1[i] ?? 0;
    const b = s2[i] ?? 0;
    if (a === 0 && b === 0) break;
    out.push([a, b]);
  }
  return out;
}

function winnerTeam(games) {
  let w1 = 0;
  let w2 = 0;
  for (const [a, b] of games) {
    if (a > b) w1 += 1;
    else if (b > a) w2 += 1;
  }
  return w1 > w2 ? 1 : 2;
}

function lastGameScoresForPlayers(games, winnerTeam) {
  const g = games[games.length - 1];
  if (!g) return { pa: 11, pb: 0 };
  const [a, b] = g;
  return { pa: a, pb: b };
}

function stageField(roundLabel) {
  if (roundLabel === "Championships") return "Championships";
  return `Women's Singles ${roundLabel}`;
}

/** [round, player_a, player_b, scoresA, scoresB, extras?] */
const BRACKET = [
  ["Round of 64", "DiMuzio, Victoria", "Klokotzky, Maria", [11, 11], [5, 1]],
  ["Round of 64", "Dunlap, Isabella", "Schull, Alexa", [11, 11], [6, 1]],
  ["Round of 64", "Hones, Marcela", "Goodnow, Kelly", [11, 11], [7, 6]],
  ["Round of 64", "Jansen, Lea", "Tang, Nok Yiu", [11, 11], [4, 2]],
  ["Round of 64", "Huang, Albie", "Conard, Nicole", [11, 11], [7, 6]],
  ["Round of 64", "Castillo, Judit", "Buyckx, Samantha", [11, 11], [9, 8]],
  ["Round of 64", "Walker, Angie", "Townsend, Danni-Elle", [6, 4], [11, 11]],
  ["Round of 64", "Buckner, Brooke", "Wang, Eileen", [11, 11], [5, 4]],
  ["Round of 64", "Parker, Samantha", "Schneemann, Lacy", [11, 11], [5, 4]],
  ["Round of 64", "Johnson, Jorja", "Imparato, Pierina", [11, 11], [8, 5]],
  ["Round of 64", "Kong, Lingwei", "Bond, Cleo", [12, 8, 10], [10, 11, 12]],
  ["Round of 64", "Truluck, Liz", "Mihae, Kwon", [11, 11], [1, 5]],
  ["Round of 64", "Igleski, Chloe", "Rau, Jade", [11, 13], [9, 11]],
  ["Round of 64", "Kunimoto, Kiora", "Maguire, Caroline", [11, 11], [0, 4]],
  ["Round of 64", "Padegimaite, Lina", "Hendershot, Elsie", [11, 11], [0, 5]],
  ["Round of 64", "Bui, Mya", "Stanciu, Luana", [11, 11], [1, 8]],
  ["Round of 64", "Ingram, Jalina", "Zavarotnaya, Olga", [11, 7, 11], [4, 11, 8]],
  ["Round of 64", "Campbell, Cailyn", "Widdershoven, Estee", [11, 11], [8, 3]],
  ["Round of 64", "Parenteau, Catherine", "Grgan, Masa", [11, 11], [6, 2]],
  ["Round of 64", "Ulery, Keilly", "Libo, Polina", [11, 11], [6, 4]],
  ["Round of 64", "Dennehy, Sahra", "Simon, Victoria", [11, 11], [0, 1]],
  ["Round of 64", "Blatt, Hannah", "Yoshitomi, Aiko", [11, 10, 6], [5, 12, 11]],
  ["Round of 64", "Christian, Kaitlyn", "Cole, Lauren", [11, 11], [2, 3]],
  ["Round of 64", "Ignatowich, Ava", "Phillips, Allison", [11, 11], [1, 4]],
  ["Round of 64", "Wei, Ting Chieh", "Morelli, Giovanna", [11, 11], [4, 0]],
  ["Round of 64", "Rane, Milan", "Brown, Audrey Adele", [11, 11], [1, 1]],
  ["Round of 64", "Wang, Chao Yi", "To, Helen", [11, 11], [5, 0]],
  ["Round of 64", "Weil, Zoey", "Rives, Paula", [11, 11], [3, 3]],
  ["Round of 64", "Bouchard, Genie", "Summers, Rachel", [11, 11], [0, 2]],
  ["Round of 64", "Irvine, Jessie", "Erokhina, Genie", [9, 11, 11], [11, 6, 3]],

  ["Round of 32", "Waters, Anna Leigh", "DiMuzio, Victoria", [11, 11], [3, 4]],
  ["Round of 32", "Dunlap, Isabella", "Hones, Marcela", [11, 11], [6, 5]],
  ["Round of 32", "Jansen, Lea", "Huang, Albie", [11, 11], [8, 1]],
  ["Round of 32", "Castillo, Judit", "Townsend, Danni-Elle", [11, 11], [3, 0]],
  ["Round of 32", "Buckner, Brooke", "Parker, Samantha", [11, 11], [8, 9]],
  ["Round of 32", "Johnson, Jorja", "Bond, Cleo", [11, 11], [2, 9]],
  ["Round of 32", "Truluck, Liz", "Igleski, Chloe", [11, 11], [4, 6]],
  ["Round of 32", "Kunimoto, Kiora", "Padegimaite, Lina", [11, 13], [8, 11]],
  ["Round of 32", "Fahey, Kate", "Bui, Mya", [11, 11], [2, 1]],
  ["Round of 32", "Ingram, Jalina", "Campbell, Cailyn", [0, 0, 0], [0, 0, 0], { forfeit: true, winnerTeam: 2 }],
  ["Round of 32", "Parenteau, Catherine", "Ulery, Keilly", [11, 11], [0, 4]],
  ["Round of 32", "Dennehy, Sahra", "Yoshitomi, Aiko", [11, 11], [0, 3]],
  ["Round of 32", "Christian, Kaitlyn", "Ignatowich, Ava", [11, 11], [0, 5]],
  ["Round of 32", "Wei, Ting Chieh", "Rane, Milan", [2, 9], [11, 11]],
  ["Round of 32", "Wang, Chao Yi", "Weil, Zoey", [11, 11], [6, 5]],
  ["Round of 32", "Bouchard, Genie", "Irvine, Jessie", [11, 11], [1, 8]],

  ["Round of 16", "Waters, Anna Leigh", "Dunlap, Isabella", [11, 11], [3, 3]],
  ["Round of 16", "Jansen, Lea", "Castillo, Judit", [3, 4], [11, 11]],
  ["Round of 16", "Buckner, Brooke", "Johnson, Jorja", [11, 11], [1, 5]],
  ["Round of 16", "Truluck, Liz", "Kunimoto, Kiora", [4, 4], [11, 11]],
  ["Round of 16", "Fahey, Kate", "Campbell, Cailyn", [11, 11], [8, 4]],
  ["Round of 16", "Parenteau, Catherine", "Dennehy, Sahra", [6, 4], [11, 11]],
  ["Round of 16", "Christian, Kaitlyn", "Rane, Milan", [11, 11], [8, 4]],
  ["Round of 16", "Wang, Chao Yi", "Bouchard, Genie", [11, 11], [8, 0]],

  ["Quarter Finals", "Waters, Anna Leigh", "Castillo, Judit", [11, 11], [9, 5]],
  ["Quarter Finals", "Buckner, Brooke", "Kunimoto, Kiora", [4, 11, 3], [11, 5, 11]],
  ["Quarter Finals", "Fahey, Kate", "Dennehy, Sahra", [11, 11], [6, 2]],
  ["Quarter Finals", "Christian, Kaitlyn", "Wang, Chao Yi", [11, 11], [5, 0]],

  ["Semi Finals", "Waters, Anna Leigh", "Kunimoto, Kiora", [11, 7, 11], [3, 11, 3]],
  ["Semi Finals", "Fahey, Kate", "Christian, Kaitlyn", [11, 11], [7, 3]],

  ["Championships", "Waters, Anna Leigh", "Fahey, Kate", [12, 11], [10, 5], { medal: "gold" }],
];

function emitSingleRow(matchId, roundLabel, eventDate, playerA, playerB, s1, s2, extras) {
  const st = stageField(roundLabel);
  let games;
  let wt;
  let pa;
  let pb;
  if (extras.forfeit) {
    wt = extras.winnerTeam;
    games = [[11, 0]];
    pa = 11;
    pb = 0;
  } else {
    games = zipGames(s1, s2);
    wt = winnerTeam(games);
    const lg = lastGameScoresForPlayers(games, wt);
    pa = lg.pa;
    pb = lg.pb;
  }
  const winner = wt === 1 ? "player_a" : "player_b";
  const row = {
    match_id: matchId,
    event_type: EVENT_TYPE,
    skill_level: SKILL,
    age_bracket: AGE,
    event_date: eventDate,
    status: "completed",
    bracket_stage: st,
    stage: st,
    player_a: playerA,
    player_b: playerB,
    winner,
    points_a: pa,
    points_b: pb,
  };
  if (extras.forfeit) row.forfeit = true;
  if (extras.medal) row.medal_for_winner = extras.medal;
  return row;
}

function rebuildPerPlayer(matches) {
  const m = {};
  for (const row of matches) {
    const pa = row.player_a;
    const pb = row.player_b;
    const entry = (name, opp) => {
      if (name.includes(" / ")) return;
      if (!m[name]) m[name] = [];
      m[name].push({
        match_id: row.match_id,
        event_type: row.event_type,
        skill_level: row.skill_level,
        age_bracket: row.age_bracket,
        event_date: row.event_date,
        opponent: opp,
      });
    };
    entry(pa, pb);
    entry(pb, pa);
  }
  return Object.fromEntries(Object.entries(m).sort(([a], [b]) => a.localeCompare(b)));
}

const raw = fs.readFileSync(jsonPath, "utf8");
const data = JSON.parse(raw);

const kept = data.matches.filter((x) => x.event_type !== EVENT_TYPE);
const newRows = [];
let seq = 0;
let time = Date.parse("2025-11-22T02:00:00.000Z");
for (const row of BRACKET) {
  const extras = row[5] && typeof row[5] === "object" ? row[5] : {};
  const [roundLabel, playerA, playerB, s1, s2] = row;
  seq += 1;
  const eventDate = new Date(time).toISOString();
  time += 60_000;
  const mid = `WSPRO-2025-${String(seq).padStart(3, "0")}`;
  newRows.push(emitSingleRow(mid, roundLabel, eventDate, playerA, playerB, s1, s2, extras));
}

data.matches = [...kept, ...newRows];
data.per_player_matches = rebuildPerPlayer(data.matches);
if (data.summary) data.summary.matches_generated = data.matches.length;

fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2) + "\n", "utf8");
console.log(`Wrote ${newRows.length} Womens Singles Pro Main Draw result rows; total matches ${data.matches.length}`);
