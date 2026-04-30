import { computeWakiOdds } from "../../../lib/wakiOdds";

export type LacrossePlayerRow = {
  firstName: string;
  lastName: string;
  position: string;
  team: string;
  gamesPlayed: number;
  totalGoals: number;
  assists: number;
  shootingPct: number;
  causedTurnovers: number;
  groundballs: number;
  faceoffPct: number;
  scoresAgainstAvg: number;
  saves: number;
  savePct: number;
  penaltiesMinutes: number;
  points: number;
};

export type LacrosseTeamRating = {
  team: string;
  rating: number;
  o: number;
  d: number;
  g: number;
  f: number;
  p: number;
  s: number;
  h: number;
};

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function toNum(v: string): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function normalize(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return 50;
  if (max <= min) return 50;
  return clamp(((value - min) / (max - min)) * 100, 0, 100);
}

export function parsePllCsv(csv: string): LacrossePlayerRow[] {
  const lines = csv.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const head = lines[0]!.split(",");
  const idx = new Map(head.map((h, i) => [h.trim(), i]));

  return lines.slice(1).map((line) => {
    const cols = line.split(",");
    const get = (k: string) => cols[idx.get(k) ?? -1] ?? "";
    return {
      firstName: get("First Name"),
      lastName: get("Last Name"),
      position: get("Position"),
      team: get("Team"),
      gamesPlayed: toNum(get("Games Played")),
      totalGoals: toNum(get("Total Goals")),
      assists: toNum(get("Assists")),
      shootingPct: toNum(get("Shooting %")) * (toNum(get("Shooting %")) <= 1 ? 100 : 1),
      causedTurnovers: toNum(get("Caused Turnovers")),
      groundballs: toNum(get("Groundballs")),
      faceoffPct: toNum(get("Faceoff %")) * (toNum(get("Faceoff %")) <= 1 ? 100 : 1),
      scoresAgainstAvg: toNum(get("Scores Against Average")),
      saves: toNum(get("Saves")),
      savePct: toNum(get("Save %")) * (toNum(get("Save %")) <= 1 ? 100 : 1),
      penaltiesMinutes: toNum(get("Penalties (in minutes)")),
      points: toNum(get("Points")),
    };
  });
}

export function buildTeamRatings(rows: LacrossePlayerRow[]): LacrosseTeamRating[] {
  const byTeam = new Map<string, LacrossePlayerRow[]>();
  for (const r of rows) {
    if (!r.team) continue;
    const arr = byTeam.get(r.team) ?? [];
    arr.push(r);
    byTeam.set(r.team, arr);
  }

  const raw = Array.from(byTeam.entries()).map(([team, players]) => {
    const gPlayed = Math.max(1, players.reduce((s, p) => s + p.gamesPlayed, 0) / Math.max(players.length, 1));
    const goalsPg = players.reduce((s, p) => s + p.totalGoals, 0) / gPlayed;
    const assistsPg = players.reduce((s, p) => s + p.assists, 0) / gPlayed;
    const shootingPct = players.reduce((s, p) => s + p.shootingPct, 0) / Math.max(players.length, 1);
    const caused = players.reduce((s, p) => s + p.causedTurnovers, 0) / gPlayed;
    const penalties = players.reduce((s, p) => s + p.penaltiesMinutes, 0) / gPlayed;
    const faceoff = players.reduce((s, p) => s + p.faceoffPct, 0) / Math.max(players.length, 1);
    const gbs = players.reduce((s, p) => s + p.groundballs, 0) / gPlayed;

    const goalies = players.filter((p) => p.position.toUpperCase() === "G");
    const goalieSavePct =
      goalies.length > 0 ? goalies.reduce((s, p) => s + p.savePct, 0) / goalies.length : 50;
    const goalieSaa =
      goalies.length > 0 ? goalies.reduce((s, p) => s + p.scoresAgainstAvg, 0) / goalies.length : 12;
    const goalsAllowed = goalieSaa > 0 ? goalieSaa : 12;
    const formProxy = players.reduce((s, p) => s + p.points, 0) / gPlayed;

    return {
      team,
      goalsPg,
      assistsPg,
      shootingPct,
      caused,
      penalties,
      faceoff,
      gbs,
      goalieSavePct,
      goalieSaa,
      goalsAllowed,
      formProxy,
    };
  });

  const range = <K extends keyof (typeof raw)[number]>(k: K) => {
    const vals = raw.map((r) => r[k] as number);
    return { min: Math.min(...vals), max: Math.max(...vals) };
  };

  const rgGoals = range("goalsPg");
  const rgAst = range("assistsPg");
  const rgShoot = range("shootingPct");
  const rgAllowed = range("goalsAllowed");
  const rgCt = range("caused");
  const rgPen = range("penalties");
  const rgSave = range("goalieSavePct");
  const rgSaa = range("goalieSaa");
  const rgForm = range("formProxy");
  const rgFace = range("faceoff");
  const rgGb = range("gbs");

  return raw
    .map((r) => {
      const O = 0.5 * normalize(r.goalsPg, rgGoals.min, rgGoals.max)
        + 0.3 * normalize(r.shootingPct, rgShoot.min, rgShoot.max)
        + 0.2 * normalize(r.assistsPg, rgAst.min, rgAst.max);
      const D = 0.6 * (100 - normalize(r.goalsAllowed, rgAllowed.min, rgAllowed.max))
        + 0.25 * normalize(r.caused, rgCt.min, rgCt.max)
        + 0.15 * (100 - normalize(r.penalties, rgPen.min, rgPen.max));
      const G = 0.7 * normalize(r.goalieSavePct, rgSave.min, rgSave.max)
        + 0.3 * (100 - normalize(r.goalieSaa, rgSaa.min, rgSaa.max));
      const F = normalize(r.formProxy, rgForm.min, rgForm.max);
      const P = 0.7 * normalize(r.faceoff, rgFace.min, rgFace.max)
        + 0.3 * normalize(r.gbs, rgGb.min, rgGb.max);
      const S = 50;
      const H = 50;
      const rating = 0.3 * O + 0.25 * D + 0.15 * G + 0.1 * F + 0.1 * P + 0.05 * S + 0.05 * H;
      return { team: r.team, rating, o: O, d: D, g: G, f: F, p: P, s: S, h: H };
    })
    .sort((a, b) => b.rating - a.rating);
}

export function buildFeaturedMatchups(ratings: LacrosseTeamRating[]) {
  const sorted = [...ratings].sort((a, b) => b.rating - a.rating);
  const pairs: Array<{ teamA: LacrosseTeamRating; teamB: LacrosseTeamRating }> = [];
  for (let i = 0; i + 1 < sorted.length && pairs.length < 3; i += 2) {
    pairs.push({ teamA: sorted[i]!, teamB: sorted[i + 1]! });
  }
  return pairs.map((p) => ({
    ...p,
    odds: computeWakiOdds(1400 + p.teamA.rating * 3, 1400 + p.teamB.rating * 3),
  }));
}
