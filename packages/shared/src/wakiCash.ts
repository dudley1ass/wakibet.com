/**
 * WakiCash — lineup budget (100 per featured division roster).
 * Skill labels come from schedule / division keys (mixed formats).
 */

export const WAKICASH_BUDGET_PER_LINEUP = 100;

/** Ordered high → low; used with division anchor + player hash for stable per-player prices. */
export const WAKICASH_COST_TIERS = [40, 32, 24, 16, 10] as const;

/**
 * Map a division skill label to the canonical base tier cost (before per-player rotation).
 */
export function skillLabelToBaseWakiCash(skillLevel: string): number {
  const s = skillLevel.toLowerCase().replace(/\u2013/g, "-");
  if (s.includes("5.0")) return 40;
  if (s.includes("4.5+")) return 40;
  if (s.includes("4.0-4.5")) return 32;
  if (s.includes("4.5")) return 32;
  if (s.includes("4.0")) return 24;
  if (s.includes("3.5") && s.includes("4.0")) return 16;
  if (s.includes("3.5")) return 16;
  if (s.includes("3.0") && s.includes("3.5")) return 10;
  if (s.includes("3.0")) return 10;
  return 10;
}

function skillToTierIndex(skillLevel: string): number {
  const b = skillLabelToBaseWakiCash(skillLevel);
  const idx = (WAKICASH_COST_TIERS as readonly number[]).indexOf(b);
  return idx >= 0 ? idx : WAKICASH_COST_TIERS.length - 1;
}

function hashStringToUint(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Stable WakiCash cost for one player in a division. Rotates tier by name hash so pools
 * include multiple price points even when the whole division shares one skill label.
 */
export function playerWakiCashCost(skillLevel: string, playerName: string): number {
  const anchor = skillToTierIndex(skillLevel);
  const h = hashStringToUint(playerName.trim().toLowerCase());
  const idx = (anchor + h) % WAKICASH_COST_TIERS.length;
  return WAKICASH_COST_TIERS[idx]!;
}

export type WakiCashPickInput = {
  player_name: string;
  is_captain: boolean;
  waki_cash: number;
};

export function validateWakiCashLineup(picks: WakiCashPickInput[]): { ok: true } | { ok: false; message: string } {
  if (picks.length !== 5) {
    return { ok: false, message: "Exactly 5 picks are required." };
  }
  const captains = picks.filter((p) => p.is_captain);
  if (captains.length !== 1) {
    return { ok: false, message: "Choose exactly one captain (1.5× WakiPoints)." };
  }
  const names = picks.map((p) => p.player_name);
  if (new Set(names).size !== names.length) {
    return { ok: false, message: "Duplicate players are not allowed." };
  }
  const total = picks.reduce((s, p) => s + p.waki_cash, 0);
  if (total > WAKICASH_BUDGET_PER_LINEUP) {
    return {
      ok: false,
      message: `Roster costs ${total} WakiCash; max is ${WAKICASH_BUDGET_PER_LINEUP}.`,
    };
  }
  const elite = picks.filter((p) => p.waki_cash >= 32).length;
  if (elite > 2) {
    return { ok: false, message: "At most 2 players may cost 32+ WakiCash." };
  }
  const hasValue = picks.some((p) => p.waki_cash <= 16);
  if (!hasValue) {
    return { ok: false, message: "Include at least one player costing 16 WakiCash or less." };
  }
  return { ok: true };
}
