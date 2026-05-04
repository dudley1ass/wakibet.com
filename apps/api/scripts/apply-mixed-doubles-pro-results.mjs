/**
 * Replaces synthetic `Mixed Doubles Pro Main Draw` rows in atlanta_weekend_test_run_matches.json
 * with real bracket results (4 rows per mixed doubles match).
 *
 * Run from repo root:
 *   node apps/api/scripts/apply-mixed-doubles-pro-results.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const jsonPath = path.join(here, "..", "data", "atlanta_weekend_test_run_matches.json");

const EVENT_TYPE = "Mixed Doubles Pro Main Draw";
const SKILL = "Open";
const AGE = "All";

function teamOpp(a, b) {
  return [a, b].sort((x, y) => x.localeCompare(y)).join(" / ");
}

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
  return `Mixed Doubles ${roundLabel}`;
}

const BRACKET = [
  ["Round of 64", ["French, Brandon", "Weil, Zoey"], ["Erokhina, Genie", "Protzek, Tom"], [11, 5, 11], [8, 11, 4]],
  ["Round of 64", ["Hovenier, Blaine", "Jones, Allyce"], ["Tellez, Pablo", "Morelli, Giovanna"], [10, 11, 11], [12, 8, 4]],
  ["Round of 64", ["Waters, Anna Leigh", "Johns, Ben"], ["Barlow, Matthew", "Bui, Mya"], [11, 11], [1, 1]],
  ["Round of 64", ["Ge, Augustus", "Humberg, Mari"], ["Goins, John Lucian", "McMillan, Olivia"], [11, 11], [9, 8]],
  ["Round of 64", ["Wang, Chao Yi", "Bhatia, Armaan"], ["Johnson, Yates", "Stratman, Lauren"], [11, 11], [5, 4]],
  ["Round of 64", ["Oncins, Eric", "Pisnik, Tina"], ["Huang, Albie", "Wall, George"], [11, 11], [1, 8]],
  ["Round of 64", ["Scarpa, Anderson", "Walker, Alex"], ["Ingram, Jalina", "Loyd, Michael"], [11, 11], [8, 8]],
  ["Round of 64", ["Staksrud, Federico", "Fahey, Kate"], ["Widdershoven, Estee", "Mack, Luca"], [11, 11], [4, 3]],
  ["Round of 64", ["Kawamoto, Jackie", "Bar, Dekel"], ["Wong, Hong kit", "Wheatley, Kara"], [11, 11], [9, 1]],
  ["Round of 64", ["Rohrabacher, Rachel", "Alshon, Christian"], ["Wang-Beckvall, Xiao Yi", "Pham, Luc"], [11, 11], [3, 8]],
  ["Round of 64", ["Jakovljevic, Ivan", "Castillo, Judit"], ["Alhouni, Mohaned", "Padegimaite, Lina"], [11, 9, 12], [7, 11, 10]],
  ["Round of 64", ["Townsend, Danni-Elle", "Klinger, CJ"], ["Goldberg, Regina", "Acevedo, Nicolas"], [5, 11, 12], [11, 7, 10]],
  ["Round of 64", ["Frazier, Dylan", "Kawamoto, Jade"], ["Goodnow, Kelly", "Jacobson, Braden"], [11, 11], [3, 3]],
  ["Round of 64", ["Todd, Parris", "Daescu, Andrei"], ["Di Laura, Carlos", "Frantova, Martina"], [11, 11], [1, 0]],
  ["Round of 64", ["Chaffin, Camden", "Wei, Ting Chieh"], ["Loong, Tyler", "Kong, Lingwei"], [11, 5, 11], [4, 11, 9]],
  ["Round of 64", ["Devilliers, Jay", "Tuionetoa, Etta"], ["Roddy, Eric", "Safdar, Mehvish"], [11, 11], [6, 7]],
  ["Round of 64", ["Martinez Vich, Jaume", "Schneemann, Lacy"], ["Hewett, Rafa", "Imparato, Pierina"], [12, 7, 12], [10, 11, 10]],
  ["Round of 64", ["Johnson, Jorja", "Johnson, JW"], ["Rangelov, George", "Griffith, Ashley"], [11, 11], [4, 2]],
  ["Round of 64", ["Garnett, Connor", "Rane, Milan"], ["Rives, Paula", "Crouch, Christopher"], [11, 12], [5, 10]],
  ["Round of 64", ["Dizon, Meghan", "Johnson, Hunter"], ["Hendershot, Elsie", "Navratil, Zane"], [11, 11], [2, 2]],
  ["Round of 64", ["Parenteau, Catherine", "Tardio, Gabriel"], ["Caruso, Brooke", "Miyoshi, Kenta"], [11, 11], [2, 4]],
  ["Round of 64", ["Buckner, Brooke", "Koller, AJ"], ["Radzikowska, Ewa", "Emmrich, Martin"], [4, 11, 6], [11, 9, 11]],
  ["Round of 64", ["Truong, Alix", "Truong, Jonathan"], ["Chow, Julian", "Karina, Tya"], [11, 11], [1, 4]],
  ["Round of 64", ["Freeman, Max", "Smith, Callie"], ["Lenhard, Rafael", "Kalsarieva, Aibika"], [11, 11], [8, 8]],
  ["Round of 64", ["Bright, Anna", "Patriquin, Hayden"], ["DiMuzio, Victoria", "Powell, Clayton"], [11, 11], [4, 5]],
  ["Round of 64", ["Walker, Angie", "Young, Donald"], ["Wright, Matt", "Kovalova, Lucy"], [11, 11], [8, 8]],
  ["Round of 64", ["Christian, Kaitlyn", "Arnold, Julian"], ["Campbell, Cailyn", "MacKinnon, Will"], [5, 9], [11, 11]],
  ["Round of 64", ["Sleeth, Layne", "Newman, Riley"], ["Dennehy, Sahra", "Shimabukuro, Tama"], [3, 3], [11, 11]],
  ["Round of 64", ["Irvine, Jessie", "Khlif, Noe"], ["Alhouni, Mota", "Conard, Nicole"], [11, 11], [3, 3]],
  ["Round of 64", ["Delgado, James", "Truluck, Liz"], ["Bellamy, Roscoe", "Kunimoto, Kiora"], [6, 5], [11, 11]],
  ["Round of 64", ["Black, Tyra Hurricane", "Howells, Will"], ["Funemizu, Yuta", "Gecheva, Christa"], [11, 11], [6, 4]],
  ["Round of 64", ["Sock, Jack", "Jansen, Lea"], ["Stone, Wyatt", "Parker, Samantha"], [11, 11], [8, 4]],

  ["Round of 32", ["Waters, Anna Leigh", "Johns, Ben"], ["French, Brandon", "Weil, Zoey"], [11, 11], [1, 6]],
  ["Round of 32", ["Ge, Augustus", "Humberg, Mari"], ["Wang, Chao Yi", "Bhatia, Armaan"], [7, 11, 11], [11, 4, 4]],
  ["Round of 32", ["Oncins, Eric", "Pisnik, Tina"], ["Scarpa, Anderson", "Walker, Alex"], [11, 10, 11], [9, 12, 2]],
  ["Round of 32", ["Staksrud, Federico", "Fahey, Kate"], ["Kawamoto, Jackie", "Bar, Dekel"], [11, 11], [6, 7]],
  ["Round of 32", ["Rohrabacher, Rachel", "Alshon, Christian"], ["Jakovljevic, Ivan", "Castillo, Judit"], [11, 5, 11], [1, 11, 5]],
  ["Round of 32", ["Townsend, Danni-Elle", "Klinger, CJ"], ["Frazier, Dylan", "Kawamoto, Jade"], [11, 11], [6, 8]],
  ["Round of 32", ["Todd, Parris", "Daescu, Andrei"], ["Chaffin, Camden", "Wei, Ting Chieh"], [11, 11], [4, 5]],
  ["Round of 32", ["Devilliers, Jay", "Tuionetoa, Etta"], ["Martinez Vich, Jaume", "Schneemann, Lacy"], [11, 11], [5, 7]],
  ["Round of 32", ["Johnson, Jorja", "Johnson, JW"], ["Hovenier, Blaine", "Jones, Allyce"], [11, 11], [3, 2]],
  ["Round of 32", ["Garnett, Connor", "Rane, Milan"], ["Dizon, Meghan", "Johnson, Hunter"], [9, 11], [11, 13]],
  ["Round of 32", ["Parenteau, Catherine", "Tardio, Gabriel"], ["Radzikowska, Ewa", "Emmrich, Martin"], [11, 11], [2, 6]],
  ["Round of 32", ["Truong, Alix", "Truong, Jonathan"], ["Freeman, Max", "Smith, Callie"], [11, 11], [6, 8]],
  ["Round of 32", ["Bright, Anna", "Patriquin, Hayden"], ["Walker, Angie", "Young, Donald"], [11, 11], [1, 4]],
  ["Round of 32", ["Campbell, Cailyn", "MacKinnon, Will"], ["Dennehy, Sahra", "Shimabukuro, Tama"], [4, 6], [11, 11]],
  ["Round of 32", ["Irvine, Jessie", "Khlif, Noe"], ["Bellamy, Roscoe", "Kunimoto, Kiora"], [11, 11], [9, 6]],
  ["Round of 32", ["Black, Tyra Hurricane", "Howells, Will"], ["Sock, Jack", "Jansen, Lea"], [11, 11], [3, 3]],

  ["Round of 16", ["Waters, Anna Leigh", "Johns, Ben"], ["Ge, Augustus", "Humberg, Mari"], [11, 11], [1, 7]],
  ["Round of 16", ["Oncins, Eric", "Pisnik, Tina"], ["Staksrud, Federico", "Fahey, Kate"], [7, 9], [11, 11]],
  ["Round of 16", ["Rohrabacher, Rachel", "Alshon, Christian"], ["Townsend, Danni-Elle", "Klinger, CJ"], [11, 11], [9, 7]],
  ["Round of 16", ["Todd, Parris", "Daescu, Andrei"], ["Devilliers, Jay", "Tuionetoa, Etta"], [9, 11, 11], [11, 7, 1]],
  ["Round of 16", ["Johnson, Jorja", "Johnson, JW"], ["Dizon, Meghan", "Johnson, Hunter"], [11, 11], [5, 4]],
  ["Round of 16", ["Parenteau, Catherine", "Tardio, Gabriel"], ["Truong, Alix", "Truong, Jonathan"], [11, 11], [2, 4]],
  ["Round of 16", ["Bright, Anna", "Patriquin, Hayden"], ["Dennehy, Sahra", "Shimabukuro, Tama"], [12, 11], [10, 4]],
  ["Round of 16", ["Irvine, Jessie", "Khlif, Noe"], ["Black, Tyra Hurricane", "Howells, Will"], [9, 0], [11, 11]],

  ["Quarter Finals", ["Waters, Anna Leigh", "Johns, Ben"], ["Staksrud, Federico", "Fahey, Kate"], [11, 11], [6, 4]],
  ["Quarter Finals", ["Rohrabacher, Rachel", "Alshon, Christian"], ["Todd, Parris", "Daescu, Andrei"], [11, 11], [6, 4]],
  ["Quarter Finals", ["Johnson, Jorja", "Johnson, JW"], ["Parenteau, Catherine", "Tardio, Gabriel"], [11, 11, 4], [2, 13, 11]],
  ["Quarter Finals", ["Bright, Anna", "Patriquin, Hayden"], ["Black, Tyra Hurricane", "Howells, Will"], [11, 11], [0, 1]],

  ["Semi Finals", ["Waters, Anna Leigh", "Johns, Ben"], ["Rohrabacher, Rachel", "Alshon, Christian"], [11, 11], [4, 2]],
  ["Semi Finals", ["Parenteau, Catherine", "Tardio, Gabriel"], ["Bright, Anna", "Patriquin, Hayden"], [4, 4], [11, 11]],

  ["Championships", ["Waters, Anna Leigh", "Johns, Ben"], ["Bright, Anna", "Patriquin, Hayden"], [11, 11, 11, 0, 0], [4, 5, 4, 0, 0], { medal: "gold" }],
];

function emitFourRows(matchId, roundLabel, eventDate, t1, t2, s1, s2, extras) {
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
  };

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
    ({ pa, pb } = lastGameScores(games, wt));
  }

  const winPair = wt === 1 ? t1 : t2;
  const losePair = wt === 1 ? t2 : t1;
  const oppWin = teamOpp(losePair[0], losePair[1]);
  const oppLose = teamOpp(winPair[0], winPair[1]);

  const rowExtras = {};
  if (extras.forfeit) rowExtras.forfeit = true;
  if (extras.medal) rowExtras.medal_for_winner = extras.medal;

  const rows = [];
  winPair.forEach((p, i) => {
    rows.push({
      ...base,
      ...rowExtras,
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
      ...rowExtras,
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
let time = Date.parse("2025-11-21T22:00:00.000Z");
for (const row of BRACKET) {
  const extras = row[5] && typeof row[5] === "object" ? row[5] : {};
  const [roundLabel, t1, t2, s1, s2] = row;
  seq += 1;
  const eventDate = new Date(time).toISOString();
  time += 90_000;
  const mid = `MXPRO-2025-${String(seq).padStart(3, "0")}`;
  newRows.push(...emitFourRows(mid, roundLabel, eventDate, t1, t2, s1, s2, extras));
}

data.matches = [...kept, ...newRows];
data.per_player_matches = rebuildPerPlayer(data.matches);
if (data.summary) data.summary.matches_generated = data.matches.length;

fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2) + "\n", "utf8");
console.log(`Wrote ${newRows.length} Mixed Doubles Pro Main Draw result rows; total matches ${data.matches.length}`);
