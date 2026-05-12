/**
 * Client-side helpers for the Invest sport's Weekly Stock Pick'em.
 *
 * These functions operate on virtual portfolios — no real money is moved or
 * tracked. Drafts live in localStorage until server-backed contests ship.
 */

import {
  INVEST_WEEKLY_PICKEM_MAX_POSITION_PCT,
  INVEST_WEEKLY_PICKEM_PICKS,
  INVEST_WEEKLY_PICKEM_STARTING_CASH_USD,
} from "@wakibet/shared";

const DRAFTS_KEY = "wakibet_invest_lineup_drafts_v1";
const LAST_CONTEST_KEY = "wakibet_invest_lineup_last_contest_v1";

export type InvestPick = {
  symbol: string;
  allocation_pct: number;
};

export type InvestDraft = {
  picks: InvestPick[];
};

export type InvestDraftsMap = Record<string, InvestDraft>;

function isInvestPick(x: unknown): x is InvestPick {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return typeof o.symbol === "string" && typeof o.allocation_pct === "number";
}

function isInvestDraft(x: unknown): x is InvestDraft {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return Array.isArray(o.picks) && o.picks.every(isInvestPick);
}

export function loadAllInvestDrafts(): InvestDraftsMap {
  try {
    const raw = localStorage.getItem(DRAFTS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return {};
    const out: InvestDraftsMap = {};
    for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
      if (isInvestDraft(v)) out[k] = v;
    }
    return out;
  } catch {
    return {};
  }
}

export function saveAllInvestDrafts(d: InvestDraftsMap): void {
  try {
    localStorage.setItem(DRAFTS_KEY, JSON.stringify(d));
  } catch {
    /* ignore */
  }
}

export function setContestDraft(contestKey: string, draft: InvestDraft): void {
  const all = loadAllInvestDrafts();
  all[contestKey] = draft;
  saveAllInvestDrafts(all);
}

export function loadLastInvestContest(): string | null {
  try {
    return localStorage.getItem(LAST_CONTEST_KEY);
  } catch {
    return null;
  }
}

export function saveLastInvestContest(contestKey: string): void {
  try {
    localStorage.setItem(LAST_CONTEST_KEY, contestKey);
  } catch {
    /* ignore */
  }
}

/** Sum of allocation percentages across picks. */
export function totalAllocationPct(picks: ReadonlyArray<InvestPick>): number {
  return picks.reduce((s, p) => s + (Number.isFinite(p.allocation_pct) ? p.allocation_pct : 0), 0);
}

/** True if any single position exceeds the max-position rule. */
export function anyOverMaxPosition(
  picks: ReadonlyArray<InvestPick>,
  maxPct: number = INVEST_WEEKLY_PICKEM_MAX_POSITION_PCT,
): boolean {
  return picks.some((p) => p.allocation_pct > maxPct);
}

/** Returns an empty-pick array sized for the MVP roster. */
export function emptyInvestPicks(
  count: number = INVEST_WEEKLY_PICKEM_PICKS,
): InvestPick[] {
  return Array.from({ length: count }, () => ({ symbol: "", allocation_pct: 0 }));
}

/** USD value of an allocation against the starting cash bank. */
export function pctToUsd(
  pct: number,
  startingCash: number = INVEST_WEEKLY_PICKEM_STARTING_CASH_USD,
): number {
  return Math.round((pct / 100) * startingCash);
}
