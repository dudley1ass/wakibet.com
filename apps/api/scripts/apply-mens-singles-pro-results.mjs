/**
 * Replaces synthetic `Mens Singles Pro Main Draw` rows — one row per singles match.
 *
 * Run from repo root:
 *   node apps/api/scripts/apply-mens-singles-pro-results.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const jsonPath = path.join(here, "..", "data", "atlanta_weekend_test_run_matches.json");

const EVENT_TYPE = "Mens Singles Pro Main Draw";
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

function lastGameScoresForPlayers(games) {
  const g = games[games.length - 1];
  if (!g) return { pa: 11, pb: 0 };
  const [a, b] = g;
  return { pa: a, pb: b };
}

function stageField(roundLabel) {
  if (roundLabel === "Championships") return "Championships";
  return `Men's Singles ${roundLabel}`;
}

/** [round, player_a, player_b, scoresA, scoresB, extras?] */
const BRACKET = [
  ["Round of 64", "Alhouni, Mota", "Braham, Anouar", [11, 11], [8, 5]],
  ["Round of 64", "Alhouni, Mohaned", "Mack, Luca", [1, 7], [11, 11]],
  ["Round of 64", "Crum, Alexander", "Barlow, Matthew", [9, 2], [11, 11]],
  ["Round of 64", "Loyd, Michael", "Perez, Edward", [11, 11], [8, 5]],
  ["Round of 64", "Rangelov, George", "Young, Donald", [3, 11, 9], [11, 8, 11]],
  ["Round of 64", "Johnson, Yates", "Pham, Luc", [2, 9], [11, 11]],
  ["Round of 64", "Hewett, Rafa", "Miyoshi, Kenta", [11, 11], [1, 8]],
  ["Round of 64", "Schwarzmann, Trevor", "French, Brandon", [2, 8], [11, 11]],
  ["Round of 64", "Rahachou, Spartak", "Ge, Augustus", [6, 8], [11, 11]],
  ["Round of 64", "Shimabukuro, Tama", "uzair sufi, Syed", [11, 11], [2, 9]],
  ["Round of 64", "Protzek, Tom", "McGuffin, Tyson", [8, 11, 11], [11, 7, 5]],
  ["Round of 64", "Campbell, Cason", "Roddy, Eric", [11, 11], [6, 9]],
  ["Round of 64", "Mogle, Connor", "Freeman, Max", [11, 11], [1, 2]],
  ["Round of 64", "Oncins, Eric", "Teoni, Pesa", [11, 11], [3, 3]],
  ["Round of 64", "Johnson, JW", "Jakovljevic, Ivan", [11, 11], [1, 5]],
  ["Round of 64", "Lenhard, Rafael", "Delgado, James", [11, 11], [2, 2]],
  ["Round of 64", "Haworth, Christopher", "MacKinnon, Will", [11, 11], [1, 0]],
  ["Round of 64", "Devilliers, Jay", "Trinh, Tam", [11, 11], [4, 5]],
  ["Round of 64", "Goins, John Lucian", "Dagnall, Indigo", [11, 11], [2, 3]],
  ["Round of 64", "Joseph, Gabriel", "Hsieh, William", [11, 11], [5, 7]],
  ["Round of 64", "Alshon, Christian", "Alhouni, Mouaad", [11, 11], [9, 8]],
  ["Round of 64", "Harvey, Adam", "Schaadt, Jasper", [11, 11], [4, 1]],
  ["Round of 64", "Garnett, Connor", "Berryman, Bret", [11, 11], [7, 3]],
  ["Round of 64", "Frazier, Dylan", "Chaffin, Camden", [4, 0], [11, 11]],
  ["Round of 64", "Staksrud, Federico", "Lohani, Aanik", [11, 11], [1, 1]],
  ["Round of 64", "Martinez Vich, Jaume", "Crouch, Christopher", [11, 11], [0, 7]],
  ["Round of 64", "Bellamy, Roscoe", "Kim, Eddy", [11, 11], [4, 9]],
  ["Round of 64", "Khlif, Noe", "Varon, Juan", [11, 11], [6, 0]],
  ["Round of 64", "Johnson, Hunter", "Morris, Jace", [11, 11], [4, 3]],
  ["Round of 64", "Wong, Hong kit", "Lewis, Dylan", [8, 11, 7], [11, 8, 11]],
  ["Round of 64", "Sock, Jack", "Hoover, Miles", [11, 11], [2, 5]],
  ["Round of 64", "Ford, Zane", "Bhatia, Armaan", [11, 11], [0, 0]],

  ["Round of 32", "Haworth, Christopher", "Alhouni, Mota", [11, 11], [8, 4]],
  ["Round of 32", "Devilliers, Jay", "Mack, Luca", [13, 5, 11], [11, 11, 8]],
  ["Round of 32", "Goins, John Lucian", "Barlow, Matthew", [7, 11, 3], [11, 8, 11]],
  ["Round of 32", "Joseph, Gabriel", "Loyd, Michael", [13, 11], [11, 4]],
  ["Round of 32", "Alshon, Christian", "Young, Donald", [5, 9], [11, 11]],
  ["Round of 32", "Harvey, Adam", "Pham, Luc", [9, 11, 2], [11, 4, 11]],
  ["Round of 32", "Garnett, Connor", "Hewett, Rafa", [11, 11], [4, 8]],
  ["Round of 32", "Chaffin, Camden", "French, Brandon", [12, 10, 11], [10, 12, 7]],
  ["Round of 32", "Staksrud, Federico", "Ge, Augustus", [11, 11], [0, 3]],
  ["Round of 32", "Martinez Vich, Jaume", "Shimabukuro, Tama", [5, 9], [11, 11]],
  ["Round of 32", "Bellamy, Roscoe", "Protzek, Tom", [6, 11, 11], [11, 9, 6]],
  ["Round of 32", "Khlif, Noe", "Campbell, Cason", [11, 11], [5, 7]],
  ["Round of 32", "Johnson, Hunter", "Mogle, Connor", [11, 11], [5, 1]],
  ["Round of 32", "Lewis, Dylan", "Oncins, Eric", [7, 2], [11, 11]],
  ["Round of 32", "Sock, Jack", "Johnson, JW", [8, 12, 7], [11, 10, 11]],
  ["Round of 32", "Ford, Zane", "Lenhard, Rafael", [11, 9, 9], [6, 11, 11]],

  ["Round of 16", "Haworth, Christopher", "Devilliers, Jay", [11, 11], [3, 2]],
  ["Round of 16", "Barlow, Matthew", "Joseph, Gabriel", [11, 3, 11], [9, 11, 5]],
  ["Round of 16", "Young, Donald", "Pham, Luc", [3, 11, 8], [11, 9, 11]],
  ["Round of 16", "Garnett, Connor", "Chaffin, Camden", [11, 11], [4, 5]],
  ["Round of 16", "Staksrud, Federico", "Shimabukuro, Tama", [11, 8, 9], [6, 11, 11]],
  ["Round of 16", "Bellamy, Roscoe", "Khlif, Noe", [9, 8], [11, 11]],
  ["Round of 16", "Johnson, Hunter", "Oncins, Eric", [11, 11], [3, 1]],
  ["Round of 16", "Johnson, JW", "Lenhard, Rafael", [6, 8], [11, 11]],

  ["Quarter Finals", "Haworth, Christopher", "Barlow, Matthew", [11, 11], [5, 5]],
  ["Quarter Finals", "Pham, Luc", "Garnett, Connor", [4, 5], [11, 11]],
  ["Quarter Finals", "Shimabukuro, Tama", "Khlif, Noe", [11, 11], [8, 4]],
  ["Quarter Finals", "Johnson, Hunter", "Lenhard, Rafael", [11, 11], [6, 4]],

  ["Semi Finals", "Haworth, Christopher", "Garnett, Connor", [11, 7, 11], [5, 11, 0]],
  ["Semi Finals", "Shimabukuro, Tama", "Johnson, Hunter", [11, 8, 11], [7, 11, 1]],

  ["Championships", "Haworth, Christopher", "Shimabukuro, Tama", [11, 11], [5, 1], { medal: "gold" }],
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
    const lg = lastGameScoresForPlayers(games);
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
let time = Date.parse("2025-11-22T04:00:00.000Z");
for (const row of BRACKET) {
  const extras = row[5] && typeof row[5] === "object" ? row[5] : {};
  const [roundLabel, playerA, playerB, s1, s2] = row;
  seq += 1;
  const eventDate = new Date(time).toISOString();
  time += 60_000;
  const mid = `MSPRO-2025-${String(seq).padStart(3, "0")}`;
  newRows.push(emitSingleRow(mid, roundLabel, eventDate, playerA, playerB, s1, s2, extras));
}

data.matches = [...kept, ...newRows];
data.per_player_matches = rebuildPerPlayer(data.matches);
if (data.summary) data.summary.matches_generated = data.matches.length;

fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2) + "\n", "utf8");
console.log(`Wrote ${newRows.length} Mens Singles Pro Main Draw result rows; total matches ${data.matches.length}`);
