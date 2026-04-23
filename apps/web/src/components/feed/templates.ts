/** Layer 1 — reusable sentence patterns (rotate copy inside triggers). */

export const WELCOME_LINES = [
  "Welcome back. Let’s find your next angle.",
  "You’re back in the mix — here’s where you stand.",
  "New tournament, new chances to climb.",
];

export const PICK_PRAISE_LINES = [
  "That was a sharp pick.",
  "Nice read — that lineup spot is paying off.",
  "That value play is starting to hit.",
];

export const HOT_STREAK_LINES = [
  "You’re heating up — your card has real momentum.",
  "Your lineups are on a run right now.",
  "Momentum is building. Keep pressing.",
];

export const RANK_UP_LINES = (n: number) => [
  `You jumped ${n} spots.`,
  `Big climb — up ${n} on the board.`,
  `That result moved you up ${n} places.`,
];

export const RANK_NEAR_LINES = (rank: number) => [
  `You’re closing in on the top ${rank}.`,
  `One strong result could crack the next tier.`,
];

export const LOCK_LINES = (eventLabel: string, minutes: number) => [
  `${eventLabel} locks in about ${minutes} minutes.`,
  `Last call — ${eventLabel} closes soon (~${minutes} min).`,
  `Clock’s running: ${eventLabel} in ~${minutes} minutes.`,
];

export const PROJECTION_LINES = (pickName: string, n: number) => [
  `If ${pickName} wins next, you move up ~${n} spots (projection).`,
  `A win from ${pickName} could swing ~${n} ranks on this snapshot.`,
];

export const OPEN_SLOT_LINES = (n: number) => [
  `You still have ${n} roster row${n === 1 ? "" : "s"} to finish this season view.`,
  `There’s still room to tighten ${n} open slot${n === 1 ? "" : "s"}.`,
];

export const SYSTEM_HINT_LINES = [
  "You can enter up to five events per tournament — each gets a fresh 100 WakiCash pool.",
  "Stronger tiers cost a bit more WakiCash and can pay bigger WakiPoints.",
  "Scoring table is the source of truth for every line in What Happens Next.",
];

/** Shown when dashboard JSON is not ready yet — keeps the ticker from looking broken. */
export const IDLE_WHILE_LOADING_LINES = [
  "Pulling your winter fantasy snapshot… almost there.",
  "Syncing ranks and lineups with the server — one moment.",
  "Loading your pulse card — hang tight.",
];

/** Shown when data is loaded but no trigger fired (quiet board, finished lineups, etc.). */
export const IDLE_WHILE_QUIET_LINES = (firstName: string) => [
  `${firstName}, the board is quiet — next headlines land when results post.`,
  `No urgent signals right now — ${firstName}, you’re caught up until the next match.`,
  `${firstName}, lineups look set; this feed will light up again on rank and result swings.`,
  "Fantasy pulse is steady — check Pick / Edit Teams before lock if you want one more tweak.",
];

export function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}
