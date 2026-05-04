export type PickleballTiebreakTuple = [number, number, number, number, number];

export function mergeUserTiebreaks(slices: PickleballTiebreakTuple[]): PickleballTiebreakTuple {
  if (slices.length === 0) return [0, 0, 0, 0, 0];
  return [
    Math.max(...slices.map((s) => s[0]!)),
    Math.max(...slices.map((s) => s[1]!)),
    slices.reduce((sum, s) => sum + s[2]!, 0),
    Math.max(...slices.map((s) => s[3]!)),
    slices.reduce((sum, s) => sum + s[4]!, 0),
  ];
}

export function compareTiebreakDescending(a: PickleballTiebreakTuple, b: PickleballTiebreakTuple): number {
  for (let i = 0; i < 5; i++) {
    const d = b[i]! - a[i]!;
    if (d !== 0) return d;
  }
  return 0;
}
