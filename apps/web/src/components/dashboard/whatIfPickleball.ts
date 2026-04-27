import { WINTER_FANTASY_RULES } from "@wakibet/shared";

export function formatRankJump(before: number | null, after: number | null): string {
  if (before == null || after == null) return "Rank TBD";
  if (before === after) return `Stay ~#${before}`;
  if (before > after) return `#${before} → #${after}`;
  return `#${before} → #${after}`;
}

export function whatIfTitle(kind: "win_next" | "lose_next", player: string): string {
  if (kind === "win_next") return `If ${player} wins next match`;
  return `If ${player} loses next match`;
}

/** One scoring-table–aligned line for every what-if (headline = player slice). */
export function whatIfScoringBlurb(
  kind: "win_next" | "lose_next",
  lineDelta: number,
  netDelta: number,
): string {
  const r = WINTER_FANTASY_RULES;
  const v = `Scoring table v${r.version}`;
  const cap = r.matchWinPoints * r.captainMultiplier;
  const plain = r.matchWinPoints;

  if (kind === "win_next") {
    if (Math.abs(lineDelta - cap) < 0.02) {
      return `${v}: match win +${r.matchWinPoints} on a captain pick ×${r.captainMultiplier} captain bonus = +${cap} WakiPoints (this player’s slice).`;
    }
    if (Math.abs(lineDelta - plain) < 0.02) {
      return `${v}: match win +${r.matchWinPoints} on a non-captain slot for this player’s slice.`;
    }
    return `${v}: this win slice totals ${lineDelta >= 0 ? "+" : ""}${lineDelta} — stacks margin, upset, playoff rounds, medals, etc. when the schedule row carries those fields (same engine as /scoring-table).`;
  }

  if (lineDelta < -0.005) {
    return `${v}: loss path for this player’s slice (${lineDelta}) — e.g. favorite upset penalty (${r.favoriteUpsetLossPenalty}) when seeds and upset flags qualify.`;
  }
  if (lineDelta > 0.005) {
    return `${v}: headline player slice still ${lineDelta >= 0 ? "+" : ""}${lineDelta} after this result (meta lines can shift); full lineup on this match is ${netDelta >= 0 ? "+" : ""}${netDelta} if a roster-mate shares it.`;
  }
  if (Math.abs(lineDelta) < 0.02 && Math.abs(netDelta) > 0.02) {
    return `${v}: this player’s slice is ~flat for this result; lineup net ${netDelta >= 0 ? "+" : ""}${netDelta} is from another rostered player in the same match.`;
  }
  return `${v}: small move on this player’s slice (${lineDelta >= 0 ? "+" : ""}${lineDelta}) once the row posts — same row-by-row rules as the published table.`;
}
