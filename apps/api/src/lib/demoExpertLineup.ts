export type DemoExpertPlayer = {
  player_name: string;
  display_name: string;
  projected_points: number;
  waki_cash: number;
};

export type DemoExpertLineup = {
  label: string;
  player_names: string[];
  players: DemoExpertPlayer[];
  projected_score: number;
  waki_cash_spent: number;
};

/** Greedy value lineup for "Beat the experts" on public demo contests. */
export function buildDemoExpertLineup(
  players: DemoExpertPlayer[],
  rosterSize: number,
  salaryCap: number,
  label = "WakiBet Experts",
): DemoExpertLineup | null {
  if (players.length < rosterSize) return null;

  const byValue = [...players].sort(
    (a, b) => b.projected_points / Math.max(1, b.waki_cash) - a.projected_points / Math.max(1, a.waki_cash),
  );

  const picked: DemoExpertPlayer[] = [];
  let spent = 0;

  for (const p of byValue) {
    if (picked.length >= rosterSize) break;
    if (spent + p.waki_cash > salaryCap) continue;
    picked.push(p);
    spent += p.waki_cash;
  }

  if (picked.length < rosterSize) {
    const remaining = players
      .filter((p) => !picked.some((x) => x.player_name === p.player_name))
      .sort((a, b) => a.waki_cash - b.waki_cash);
    for (const p of remaining) {
      if (picked.length >= rosterSize) break;
      if (spent + p.waki_cash > salaryCap) continue;
      picked.push(p);
      spent += p.waki_cash;
    }
  }

  if (picked.length < rosterSize) return null;

  const projected_score = Math.round(picked.reduce((s, p) => s + p.projected_points, 0) * 100) / 100;

  return {
    label,
    player_names: picked.map((p) => p.player_name),
    players: picked,
    projected_score,
    waki_cash_spent: spent,
  };
}
