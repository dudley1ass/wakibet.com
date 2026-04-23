import type { FeedPriority } from "./types";

export function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function isoPlusMs(ms: number): string {
  return new Date(Date.now() + ms).toISOString();
}

/** Visible lifetime by priority (spec: ambient 15–20s, standard 20–30, urgent 30–45). */
export function ttlMsForPriority(p: FeedPriority): number {
  switch (p) {
    case "urgent":
      return randomBetween(30_000, 45_000);
    case "high":
      return randomBetween(22_000, 32_000);
    case "medium":
      return randomBetween(18_000, 28_000);
    case "low":
    default:
      return randomBetween(15_000, 22_000);
  }
}

export function priorityRank(p: FeedPriority): number {
  switch (p) {
    case "urgent":
      return 4;
    case "high":
      return 3;
    case "medium":
      return 2;
    case "low":
    default:
      return 1;
  }
}
