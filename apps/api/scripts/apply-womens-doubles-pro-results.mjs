/**
 * Replaces synthetic `Womens Doubles Pro Main Draw` rows in atlanta_weekend_test_run_matches.json
 * with real bracket results (one JSON row per player per doubles match; opponent side is `A / B`).
 *
 * Run from repo root:
 *   node apps/api/scripts/apply-womens-doubles-pro-results.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const jsonPath = path.join(here, "..", "data", "atlanta_weekend_test_run_matches.json");

const EVENT_TYPE = "Womens Doubles Pro Main Draw";
const SKILL = "Open";
const AGE = "All";

function teamOpp(a, b) {
  return [a, b].sort((x, y) => x.localeCompare(y)).join(" / ");
}

/** Pair per-game scores; drop trailing all-zero games. */
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

function lastGameScores(games, winnerTeam) {
  const g = games[games.length - 1];
  if (!g) return { pa: 11, pb: 0 };
  const [a, b] = g;
  if (winnerTeam === 1) return { pa: Math.max(a, b), pb: Math.min(a, b) };
  return { pa: Math.max(a, b), pb: Math.min(a, b) };
}

function stageField(roundLabel) {
  if (roundLabel === "Championships") return "Championships";
  return `Women's Doubles ${roundLabel}`;
}

/** [round, team1 names catalog, team2 names, scores team1, scores team2] */
const BRACKET = [
  ["Round of 64", ["Wang-Beckvall, Xiao Yi", "Huang, Albie"], ["Bouchard, Genie", "Hones, Marcela"], [11, 11], [4, 5]],
  ["Round of 64", ["Padegimaite, Lina", "Khan, Zoeya"], ["Liang, Spencer", "Cole, Lauren"], [11, 11], [3, 2]],
  ["Round of 64", ["Frantova, Martina", "Safdar, Mehvish"], ["Stanciu, Luana", "Libo, Polina"], [11, 7, 11], [4, 11, 4]],
  ["Round of 64", ["Erokhina, Genie", "Hendershot, Elsie"], ["Goodnow, Kelly", "Cosma, Ella"], [11, 4, 11], [3, 11, 2]],
  ["Round of 64", ["Kong, Lingwei", "Koop, Andrea"], ["Ignatowich, Ava", "Brown, Audrey Adele"], [11, 11], [0, 1]],
  ["Round of 64", ["Dunlap, Isabella", "Conard, Nicole"], ["Kalsarieva, Aibika", "Wheatley, Kara"], [11, 11], [7, 6]],
  ["Round of 64", ["Igleski, Chloe", "Yeh, Ella"], ["Caruso, Brooke", "Griffith, Ashley"], [11, 12], [9, 10]],
  ["Round of 64", ["Mihae, Kwon", "Tang, Nok Yiu"], ["Ingram, Jalina", "Kunimoto, Kiora"], [11, 13], [6, 11]],
  ["Round of 64", ["Hatton, Abbigal", "Phillips, Allison"], ["Ulery, Keilly", "Minniefield, Jaeda"], [11, 7, 11], [5, 11, 9]],
  ["Round of 64", ["Parker, Samantha", "Gecheva, Christa"], ["To, Helen", "Buyckx, Samantha"], [11, 11], [2, 5]],
  ["Round of 64", ["Emmrich, Tamaryn", "Radzikowska, Ewa"], ["Bond, Cleo", "Morelli, Giovanna"], [15, 11], [13, 8]],
  ["Round of 64", ["Rives, Paula", "Bui, Mya"], ["Schull, Alexa", "Cavataio, Ava"], [14, 11], [12, 3]],
  ["Round of 64", ["Sleeth, Layne", "DiMuzio, Victoria"], ["Rettger, Rachel", "Zilveti, Camila"], [11, 11], [0, 1]],
  ["Round of 64", ["Walker, Alex", "Stratman, Lauren"], ["Courteau, Anne-Sophie", "Klokotzky, Maria"], [11, 11], [8, 6]],
  ["Round of 64", ["Yoshitomi, Aiko", "Widdershoven, Estee"], ["Blatt, Hannah", "McMillan, Olivia"], [11, 11], [0, 6]],
  ["Round of 64", ["Weil, Zoey", "Imparato, Pierina"], ["Simon, Valerie R", "Simon, Victoria"], [11, 11], [6, 0]],

  ["Round of 32", ["Bright, Anna", "Waters, Anna Leigh"], ["Wang-Beckvall, Xiao Yi", "Huang, Albie"], [11, 11], [2, 0]],
  ["Round of 32", ["Buckner, Brooke", "Rane, Milan"], ["Padegimaite, Lina", "Khan, Zoeya"], [12, 11], [10, 3]],
  ["Round of 32", ["Kawamoto, Jackie", "Kawamoto, Jade"], ["Frantova, Martina", "Safdar, Mehvish"], [11, 11], [1, 0]],
  ["Round of 32", ["Jansen, Lea", "Smith, Callie"], ["Erokhina, Genie", "Hendershot, Elsie"], [8, 11, 11], [11, 1, 9]],
  ["Round of 32", ["Rohrabacher, Rachel", "Parenteau, Catherine"], ["Kong, Lingwei", "Koop, Andrea"], [11, 11], [2, 5]],
  ["Round of 32", ["Townsend, Danni-Elle", "Dennehy, Sahra"], ["Dunlap, Isabella", "Conard, Nicole"], [11, 12], [9, 10]],
  ["Round of 32", ["Schneemann, Lacy", "Tuionetoa, Etta"], ["Igleski, Chloe", "Yeh, Ella"], [11, 11], [0, 8]],
  ["Round of 32", ["Christian, Kaitlyn", "Kovalova, Lucy"], ["Mihae, Kwon", "Tang, Nok Yiu"], [8, 11, 8], [11, 0, 11]],
  ["Round of 32", ["Johnson, Jorja", "Black, Tyra Hurricane"], ["Hatton, Abbigal", "Phillips, Allison"], [11, 11], [7, 0]],
  ["Round of 32", ["Irvine, Jessie", "Castillo, Judit"], ["Parker, Samantha", "Gecheva, Christa"], [11, 11], [0, 8]],
  ["Round of 32", ["Pisnik, Tina", "Dizon, Meghan"], ["Emmrich, Tamaryn", "Radzikowska, Ewa"], [11, 8, 11], [6, 11, 3]],
  ["Round of 32", ["Jones, Allyce", "Wei, Ting Chieh"], ["Rives, Paula", "Bui, Mya"], [12, 12], [10, 10]],
  ["Round of 32", ["Fahey, Kate", "Todd, Parris"], ["Sleeth, Layne", "DiMuzio, Victoria"], [11, 11], [2, 3]],
  ["Round of 32", ["Walker, Angie", "Campbell, Cailyn"], ["Walker, Alex", "Stratman, Lauren"], [9, 9], [11, 11]],
  ["Round of 32", ["Truong, Alix", "Wang, Chao Yi"], ["Yoshitomi, Aiko", "Widdershoven, Estee"], [11, 11], [6, 3]],
  ["Round of 32", ["Humberg, Mari", "Truluck, Liz"], ["Weil, Zoey", "Imparato, Pierina"], [11, 11], [1, 5]],

  ["Round of 16", ["Bright, Anna", "Waters, Anna Leigh"], ["Buckner, Brooke", "Rane, Milan"], [11, 11], [6, 7]],
  ["Round of 16", ["Kawamoto, Jackie", "Kawamoto, Jade"], ["Jansen, Lea", "Smith, Callie"], [11, 11], [3, 2]],
  ["Round of 16", ["Rohrabacher, Rachel", "Parenteau, Catherine"], ["Townsend, Danni-Elle", "Dennehy, Sahra"], [11, 11], [0, 4]],
  ["Round of 16", ["Schneemann, Lacy", "Tuionetoa, Etta"], ["Mihae, Kwon", "Tang, Nok Yiu"], [11, 11], [6, 8]],
  ["Round of 16", ["Johnson, Jorja", "Black, Tyra Hurricane"], ["Irvine, Jessie", "Castillo, Judit"], [11, 11], [4, 6]],
  ["Round of 16", ["Pisnik, Tina", "Dizon, Meghan"], ["Jones, Allyce", "Wei, Ting Chieh"], [11, 11], [7, 1]],
  ["Round of 16", ["Fahey, Kate", "Todd, Parris"], ["Walker, Alex", "Stratman, Lauren"], [11, 11], [0, 5]],
  ["Round of 16", ["Humberg, Mari", "Truluck, Liz"], ["Truong, Alix", "Wang, Chao Yi"], [11, 11], [1, 9]],

  ["Quarter Finals", ["Bright, Anna", "Waters, Anna Leigh"], ["Kawamoto, Jackie", "Kawamoto, Jade"], [11, 11], [3, 2]],
  ["Quarter Finals", ["Rohrabacher, Rachel", "Parenteau, Catherine"], ["Schneemann, Lacy", "Tuionetoa, Etta"], [11, 11], [9, 3]],
  ["Quarter Finals", ["Johnson, Jorja", "Black, Tyra Hurricane"], ["Pisnik, Tina", "Dizon, Meghan"], [11, 11], [0, 8]],
  ["Quarter Finals", ["Fahey, Kate", "Todd, Parris"], ["Humberg, Mari", "Truluck, Liz"], [11, 11], [4, 7]],

  ["Semi Finals", ["Bright, Anna", "Waters, Anna Leigh"], ["Rohrabacher, Rachel", "Parenteau, Catherine"], [11, 11], [4, 1]],
  ["Semi Finals", ["Johnson, Jorja", "Black, Tyra Hurricane"], ["Fahey, Kate", "Todd, Parris"], [11, 12], [4, 10]],

  ["Championships", ["Bright, Anna", "Waters, Anna Leigh"], ["Johnson, Jorja", "Black, Tyra Hurricane"], [11, 11, 11, 0, 0], [3, 4, 0, 0, 0]],
];

function emitFourRows(matchId, roundLabel, eventDate, t1, t2, s1, s2, extras) {
  const games = zipGames(s1, s2);
  const wt = winnerTeam(games);
  const winPair = wt === 1 ? t1 : t2;
  const losePair = wt === 1 ? t2 : t1;
  const { pa, pb } = lastGameScores(games, wt);
  const oppWin = teamOpp(losePair[0], losePair[1]);
  const oppLose = teamOpp(winPair[0], winPair[1]);
  const st = stageField(roundLabel);
  const base = {
    match_id: matchId,
    event_type: EVENT_TYPE,
    skill_level: SKILL,
    age_bracket: AGE,
    event_date: eventDate,
    status: "completed",
    bracket_stage: st,
    stage: st,
    ...extras,
  };

  const rows = [];
  winPair.forEach((p, i) => {
    rows.push({
      ...base,
      match_id: `${matchId}-w${i}`,
      player_a: p,
      player_b: oppWin,
      winner: "player_a",
      points_a: pa,
      points_b: pb,
    });
  });
  losePair.forEach((p, i) => {
    rows.push({
      ...base,
      match_id: `${matchId}-l${i}`,
      player_a: p,
      player_b: oppLose,
      winner: "player_b",
      points_a: pa,
      points_b: pb,
    });
  });
  return rows;
}

function rebuildPerPlayer(matches) {
  /** @type {Record<string, unknown[]>} */
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
let time = Date.parse("2025-11-21T14:00:00.000Z");
for (const row of BRACKET) {
  const [roundLabel, t1, t2, s1, s2] = row;
  seq += 1;
  const eventDate = new Date(time).toISOString();
  time += 90_000;
  const mid = `WDPRO-2025-${String(seq).padStart(3, "0")}`;
  const extras = {};
  if (roundLabel === "Championships") {
    extras.medal_for_winner = "gold";
  }
  newRows.push(...emitFourRows(mid, roundLabel, eventDate, t1, t2, s1, s2, extras));
}

data.matches = [...kept, ...newRows];
data.per_player_matches = rebuildPerPlayer(data.matches);

if (data.summary) {
  data.summary.matches_generated = data.matches.length;
}

fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2) + "\n", "utf8");
console.log(`Wrote ${newRows.length} Womens Doubles Pro Main Draw result rows; total matches ${data.matches.length}`);
