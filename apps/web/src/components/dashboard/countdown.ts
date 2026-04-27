/** Human-readable relative time until `iso` (UTC ISO string). */
export function countdownFromIso(iso: string | null, nowMs = Date.now()): string {
  if (!iso) return "—";
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "—";
  const delta = t - nowMs;
  if (delta <= 0) return "Locked";
  const sec = Math.floor(delta / 1000);
  const min = Math.floor(sec / 60);
  const hr = Math.floor(min / 60);
  const d = Math.floor(hr / 24);
  if (d >= 1) return `Locks in ${d}d ${hr % 24}h`;
  if (hr >= 1) return `Locks in ${hr}h ${min % 60}m`;
  if (min >= 1) return `Locks in ${min}m`;
  return "Locks soon";
}

export function firstPickleballLockIso(data: {
  tournament_schedules: { my_upcoming_matches: { event_date: string }[] }[];
}): string | null {
  const rows = data.tournament_schedules.flatMap((t) => t.my_upcoming_matches.map((m) => m.event_date));
  const sorted = rows.filter(Boolean).sort((a, b) => a.localeCompare(b));
  return sorted[0] ?? null;
}
