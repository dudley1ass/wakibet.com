/**
 * Replaces synthetic `Mens Doubles Pro Main Draw` rows in atlanta_weekend_test_run_matches.json
 * with real bracket results (same 4-row-per-doubles-match pattern as women's).
 *
 * Run from repo root:
 *   node apps/api/scripts/apply-mens-doubles-pro-results.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const jsonPath = path.join(here, "..", "data", "atlanta_weekend_test_run_matches.json");

const EVENT_TYPE = "Mens Doubles Pro Main Draw";
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
  return `Men's Doubles ${roundLabel}`;
}

/**
 * @typedef {{ forfeit?: boolean, winnerTeam?: 1 | 2, medal?: "gold" }} Extras
 */

/** [round, t1, t2, s1, s2, extras?] — if forfeit, s1/s2 ignored */
const BRACKET = [
  ["Round of 64", ["Delgado, James", "Di Laura, Carlos"], ["Crouch, Christopher", "Mogle, Connor"], [5, 2], [11, 11]],
  [
    "Round of 64",
    ["Stone, Wyatt", "Young, Darrian"],
    ["Steiner, Eli", "Varon, Juan"],
    [0, 0, 0],
    [0, 0, 0],
    { forfeit: true, winnerTeam: 2 },
  ],
  ["Round of 64", ["Loong, Tyler", "Goins, John Lucian"], ["Alhouni, Mota", "Goldberg, Johnny"], [11, 12], [3, 10]],
  ["Round of 64", ["Brown, Marshall", "Trinh, Tam"], ["Bricker, Austin", "Roddy, Eric"], [10, 3], [12, 11]],
  ["Round of 64", ["Johnson, Yates", "Arnold, Julian"], ["Phillips, Daniel", "Shaffer, Wil"], [11, 11], [3, 5]],
  ["Round of 64", ["Loyd, Michael", "Chaffin, Camden"], ["Nemoff, Caden", "Cincola, John"], [11, 11], [5, 3]],
  ["Round of 64", ["Emmrich, Martin", "Koller, AJ"], ["Geminiani, Domenico", "Wade, Nicholas"], [11, 11], [3, 8]],
  ["Round of 64", ["Haworth, Christopher", "Johnson, Hunter"], ["Morris, Jace", "Jacobson, Braden"], [11, 9, 11], [6, 11, 6]],
  ["Round of 64", ["Campbell, Cason", "Harvey, Adam"], ["Wasson, Luke", "Perez, Edward"], [11, 11], [7, 3]],
  ["Round of 64", ["Martinez Vich, Jaume", "Truong, Jonathan"], ["Moreno, Tobias", "Shaw, Michael"], [11, 11], [0, 6]],
  ["Round of 64", ["Protzek, Tom", "Young, Donald"], ["Rangelov, George", "Crum, Alexander"], [11, 11], [2, 2]],
  ["Round of 64", ["Alhouni, Mohaned", "Smith, Patrick"], ["Jakovljevic, Ivan", "Barlow, Matthew"], [7, 9], [11, 11]],
  ["Round of 64", ["Hart, William", "Hanson, Wesley"], ["Ayotte, Jackson", "Santini Ayon, Eduardo"], [6, 11, 9], [11, 4, 11]],
  ["Round of 64", ["Funemizu, Yuta", "Shimabukuro, Tama"], ["Jagtiani, Sanil", "Serra, Oscar"], [11, 1, 11], [9, 11, 7]],
  ["Round of 64", ["Wall, George", "Miyoshi, Kenta"], ["Joseph, Gabriel", "Rahachou, Spartak"], [11, 11], [1, 0]],
  ["Round of 64", ["Scarpa, Anderson", "Dow, Gregory"], ["Howells, Will", "Powell, Clayton"], [7, 4], [11, 11]],
  ["Round of 64", ["Braham, Anouar", "Mack, Luca"], ["Ford, Zane", "Caldarella, Andrew"], [11, 11], [2, 2]],
  ["Round of 64", ["Garnett, Connor", "Bellamy, Roscoe"], ["Wong, Colin", "uzair sufi, Syed"], [11, 11], [3, 4]],
  ["Round of 64", ["Hamaguchi, Kentaro", "Waddell, Noah"], ["Wong, Hong kit", "KIM, Eunggwon"], [11, 3, 9], [9, 11, 11]],
  ["Round of 64", ["Hewett, Rafa", "Acevedo, Nicolas"], ["Lenhard, Rafael", "Pham, Luc"], [11, 11], [3, 4]],
  ["Round of 64", ["Sock, Jack", "Hovenier, Blaine"], ["Lund, Christian", "Ohrel, Braylon"], [11, 11], [3, 4]],
  ["Round of 64", ["Navratil, Zane", "MacKinnon, Will"], ["Dagnall, Indigo", "Mercado, Andre"], [11, 11], [5, 3]],

  ["Round of 32", ["Tardio, Gabriel", "Johns, Ben"], ["Crouch, Christopher", "Mogle, Connor"], [11, 6, 11], [2, 11, 5]],
  ["Round of 32", ["Steiner, Eli", "Varon, Juan"], ["Loong, Tyler", "Goins, John Lucian"], [3, 5], [11, 11]],
  ["Round of 32", ["Devilliers, Jay", "Tellez, Pablo"], ["Bricker, Austin", "Roddy, Eric"], [11, 11], [4, 5]],
  ["Round of 32", ["Ge, Augustus", "Bar, Dekel"], ["Johnson, Yates", "Arnold, Julian"], [11, 11], [2, 4]],
  ["Round of 32", ["Staksrud, Federico", "Daescu, Andrei"], ["Loyd, Michael", "Chaffin, Camden"], [11, 11], [6, 7]],
  ["Round of 32", ["Emmrich, Martin", "Koller, AJ"], ["Haworth, Christopher", "Johnson, Hunter"], [4, 11, 3], [11, 5, 11]],
  ["Round of 32", ["Oncins, Eric", "Frazier, Dylan"], ["Campbell, Cason", "Harvey, Adam"], [11, 11], [7, 7]],
  ["Round of 32", ["Martinez Vich, Jaume", "Truong, Jonathan"], ["Protzek, Tom", "Young, Donald"], [11, 5, 6], [8, 11, 11]],
  ["Round of 32", ["Alshon, Christian", "Patriquin, Hayden"], ["Jakovljevic, Ivan", "Barlow, Matthew"], [11, 11], [6, 2]],
  ["Round of 32", ["Ayotte, Jackson", "Santini Ayon, Eduardo"], ["Funemizu, Yuta", "Shimabukuro, Tama"], [4, 2], [11, 11]],
  ["Round of 32", ["Khlif, Noe", "Wright, Matt"], ["Wall, George", "Miyoshi, Kenta"], [10, 3], [12, 11]],
  ["Round of 32", ["Newman, Riley", "Bhatia, Armaan"], ["Howells, Will", "Powell, Clayton"], [11, 11], [7, 5]],
  ["Round of 32", ["Klinger, CJ", "Johnson, JW"], ["Braham, Anouar", "Mack, Luca"], [11, 11], [7, 3]],
  ["Round of 32", ["Garnett, Connor", "Bellamy, Roscoe"], ["Wong, Hong kit", "KIM, Eunggwon"], [12, 11], [10, 4]],
  ["Round of 32", ["Freeman, Max", "McGuffin, Tyson"], ["Hewett, Rafa", "Acevedo, Nicolas"], [10, 10], [12, 12]],
  ["Round of 32", ["Sock, Jack", "Hovenier, Blaine"], ["Navratil, Zane", "MacKinnon, Will"], [11, 11], [8, 5]],

  ["Round of 16", ["Tardio, Gabriel", "Johns, Ben"], ["Loong, Tyler", "Goins, John Lucian"], [11, 11], [4, 7]],
  ["Round of 16", ["Devilliers, Jay", "Tellez, Pablo"], ["Ge, Augustus", "Bar, Dekel"], [11, 11], [9, 4]],
  ["Round of 16", ["Staksrud, Federico", "Daescu, Andrei"], ["Haworth, Christopher", "Johnson, Hunter"], [11, 11], [6, 5]],
  ["Round of 16", ["Oncins, Eric", "Frazier, Dylan"], ["Protzek, Tom", "Young, Donald"], [11, 8, 11], [8, 11, 3]],
  ["Round of 16", ["Alshon, Christian", "Patriquin, Hayden"], ["Funemizu, Yuta", "Shimabukuro, Tama"], [11, 5, 8], [4, 11, 11]],
  ["Round of 16", ["Wall, George", "Miyoshi, Kenta"], ["Newman, Riley", "Bhatia, Armaan"], [4, 2], [11, 11]],
  ["Round of 16", ["Klinger, CJ", "Johnson, JW"], ["Garnett, Connor", "Bellamy, Roscoe"], [11, 10, 4], [4, 12, 11]],
  ["Round of 16", ["Hewett, Rafa", "Acevedo, Nicolas"], ["Sock, Jack", "Hovenier, Blaine"], [1, 11, 7], [11, 7, 11]],

  ["Quarter Finals", ["Tardio, Gabriel", "Johns, Ben"], ["Devilliers, Jay", "Tellez, Pablo"], [11, 11], [3, 5]],
  ["Quarter Finals", ["Staksrud, Federico", "Daescu, Andrei"], ["Oncins, Eric", "Frazier, Dylan"], [11, 11], [9, 5]],
  ["Quarter Finals", ["Funemizu, Yuta", "Shimabukuro, Tama"], ["Newman, Riley", "Bhatia, Armaan"], [13, 6, 11], [11, 11, 8]],
  ["Quarter Finals", ["Garnett, Connor", "Bellamy, Roscoe"], ["Sock, Jack", "Hovenier, Blaine"], [11, 11], [3, 6]],

  ["Semi Finals", ["Tardio, Gabriel", "Johns, Ben"], ["Staksrud, Federico", "Daescu, Andrei"], [11, 3, 11], [6, 11, 4]],
  ["Semi Finals", ["Funemizu, Yuta", "Shimabukuro, Tama"], ["Garnett, Connor", "Bellamy, Roscoe"], [8, 11, 6], [11, 0, 11]],

  ["Championships", ["Tardio, Gabriel", "Johns, Ben"], ["Garnett, Connor", "Bellamy, Roscoe"], [11, 11, 11, 0, 0], [5, 7, 2, 0, 0], { medal: "gold" }],
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
let time = Date.parse("2025-11-21T18:00:00.000Z");
for (const row of BRACKET) {
  const extras = row[5] && typeof row[5] === "object" ? row[5] : {};
  const [roundLabel, t1, t2, s1, s2] = row;
  seq += 1;
  const eventDate = new Date(time).toISOString();
  time += 90_000;
  const mid = `MDPRO-2025-${String(seq).padStart(3, "0")}`;
  const out = emitFourRows(mid, roundLabel, eventDate, t1, t2, s1, s2, extras);
  newRows.push(...out);
}

data.matches = [...kept, ...newRows];
data.per_player_matches = rebuildPerPlayer(data.matches);
if (data.summary) data.summary.matches_generated = data.matches.length;

fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2) + "\n", "utf8");
console.log(`Wrote ${newRows.length} Mens Doubles Pro Main Draw result rows; total matches ${data.matches.length}`);
