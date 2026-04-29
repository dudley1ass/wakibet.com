import { Prisma, type PrismaClient } from "@prisma/client";
import { playerWakiCashCost, WAKICASH_BUDGET_PER_LINEUP, WINTER_FANTASY_ROSTER_SIZE } from "@wakibet/shared";
import {
  filterMatchesForDivision,
  isFeaturedWinterDivision,
  listDivisionsFromMatches,
  parseDivisionKey,
  uniquePlayersInMatches,
  type TournamentKey,
  type WinterData,
  type WinterMatch,
} from "./winterSpringsData.js";
import { buildEventKeyV1, inferFormatFromEventType, type EventFormatSlug } from "./fantasyEventKey.js";

function parseMatchStartMs(match: Record<string, unknown>): number | null {
  const candidates = [
    match.match_start_at,
    match.match_start_time,
    match.start_time,
    match.start_at,
  ];
  for (const c of candidates) {
    if (typeof c !== "string" || !c.trim()) continue;
    const ms = Date.parse(c);
    if (Number.isFinite(ms)) return ms;
  }
  if (typeof match.event_date === "string" && /\d:\d/.test(match.event_date)) {
    const ms = Date.parse(match.event_date);
    if (Number.isFinite(ms)) return ms;
  }
  return null;
}

function firstMatchStartsAt(matches: WinterMatch[]): Date | null {
  const starts = matches
    .map((m) => parseMatchStartMs(m as unknown as Record<string, unknown>))
    .filter((ms): ms is number => ms != null);
  if (starts.length === 0) return null;
  return new Date(Math.min(...starts));
}

function eventTypeWithDoublesLabel(eventType: string): string {
  const e = eventType.trim();
  if (e === "Mens") return "Mens Doubles";
  if (e === "Womens") return "Womens Doubles";
  if (e === "Mixed") return "Mixed Doubles";
  return e;
}

/**
 * Human-facing event label. Pictona exports use `skill_level: "Skill"` and put the real
 * bracket line in `age_bracket` as `(rating) Age: (range)` — mirror PickleballTournaments.com wording.
 */
function titleish(parts: { event_type: string; skill_level: string; age_bracket: string }): string {
  const skill = parts.skill_level?.trim() ?? "";
  const age = parts.age_bracket?.trim() ?? "";
  const et = eventTypeWithDoublesLabel(parts.event_type);
  if (skill === "Skill" && /^\([^)]+\)\s*Age:\s*\(/i.test(age)) {
    return `${et} Skill: ${age}`;
  }
  return [et, skill, age].filter(Boolean).join(" · ");
}

export type TierAssignment = {
  tierCode: "A" | "B" | "C";
  wakicashMultiplier: number;
  wakipointsMultiplier: number;
  isSelectable: boolean;
};

function isEventLineupFeasible(params: {
  skillLevel: string;
  wakicashMultiplier: number;
  players: string[];
}): boolean {
  if (params.players.length < WINTER_FANTASY_ROSTER_SIZE) return false;
  const costs = params.players
    .map((name) => Math.ceil(playerWakiCashCost(params.skillLevel, name) * params.wakicashMultiplier))
    .sort((a, b) => a - b);
  const cheapestFive = costs.slice(0, WINTER_FANTASY_ROSTER_SIZE).reduce((s, c) => s + c, 0);
  return cheapestFive <= WAKICASH_BUDGET_PER_LINEUP;
}

function isAllowedProPickleballDivision(row: {
  event_type: string;
  skill_level: string;
}): boolean {
  const event = row.event_type.toLowerCase();
  const skill = row.skill_level.toLowerCase();
  const isProSkill = skill.includes("open") || skill.includes("pro");
  if (!isProSkill) return false;

  const hasSingles = event.includes("singles");
  const hasMixed = event.includes("mixed");
  const hasMens = event.includes("mens") || event.includes("men");
  const hasWomens = event.includes("womens") || event.includes("women");
  const hasDoubles = event.includes("doubles") || event === "mens" || event === "womens" || event === "mixed";

  // Allowed only:
  // - Men's Pro Singles / Women's Pro Singles
  // - Men's Pro Doubles / Women's Pro Doubles
  // - Mixed Pro Doubles
  if (hasSingles) return (hasMens || hasWomens) && !hasMixed;
  if (hasDoubles) return (hasMens || hasWomens) || hasMixed;
  return false;
}

/**
 * Phase 2: tier + multipliers + selectable flag from division shape (featured gate matches winter fantasy).
 */
export function assignTierForDivision(row: {
  tournament_key?: TournamentKey;
  event_type: string;
  skill_level: string;
  age_bracket: string;
  match_count: number;
  player_count: number;
}): TierAssignment {
  if (row.tournament_key && !row.tournament_key.startsWith("mlp_") && !isAllowedProPickleballDivision(row)) {
    return { tierCode: "C", wakicashMultiplier: 0.85, wakipointsMultiplier: 0.9, isSelectable: false };
  }
  const featured = isFeaturedWinterDivision({
    player_count: row.player_count,
    match_count: row.match_count,
  });
  if (!featured) {
    return { tierCode: "C", wakicashMultiplier: 0.85, wakipointsMultiplier: 0.9, isSelectable: false };
  }
  const skill = row.skill_level.toLowerCase();
  const isOpenOrElite =
    /\bopen\b/i.test(skill) ||
    skill.includes("5.0") ||
    skill.includes("4.5+") ||
    (skill.includes("4.5") && !skill.includes("4.0"));
  if (isOpenOrElite) {
    return { tierCode: "A", wakicashMultiplier: 1.15, wakipointsMultiplier: 1.05, isSelectable: true };
  }
  const isSmallFeatured = row.player_count <= 4 && row.match_count < 10;
  if (isSmallFeatured) {
    return { tierCode: "C", wakicashMultiplier: 0.85, wakipointsMultiplier: 0.9, isSelectable: true };
  }
  return { tierCode: "B", wakicashMultiplier: 1, wakipointsMultiplier: 1, isSelectable: true };
}

export async function syncTournamentEventCatalog(
  prisma: PrismaClient,
  tournamentKey: TournamentKey,
  data: WinterData,
): Promise<void> {
  const isAtlanta = tournamentKey === "atlanta_weekend";
  const divisions = listDivisionsFromMatches(data.matches);
  const allowedEventKeys = new Set<string>();
  for (const d of divisions) {
    if (isAtlanta && !d.event_type.toLowerCase().includes("pro main draw")) {
      continue;
    }
    const fmt: EventFormatSlug = inferFormatFromEventType(d.event_type);
    const eventKey = buildEventKeyV1(tournamentKey, d.event_type, d.skill_level, d.age_bracket, fmt);
    allowedEventKeys.add(eventKey);
    const divMatches = filterMatchesForDivision(data.matches, d.division_key);
    const eventPlayers = uniquePlayersInMatches(divMatches);
    const firstAt = firstMatchStartsAt(divMatches);
    const tier = assignTierForDivision({ ...d, tournament_key: tournamentKey });
    const feasible = isEventLineupFeasible({
      skillLevel: d.skill_level,
      wakicashMultiplier: tier.wakicashMultiplier,
      players: eventPlayers,
    });
    const isSelectable = tier.isSelectable && feasible;
    const labelDisplay = titleish(d);

    await prisma.tournamentEventCatalog.upsert({
      where: { tournamentKey_eventKey: { tournamentKey, eventKey } },
      create: {
        tournamentKey,
        eventKey,
        scheduleDivisionKey: d.division_key,
        eventType: d.event_type,
        skillLevel: d.skill_level,
        ageBracket: d.age_bracket,
        labelRaw: d.division_key,
        labelDisplay,
        format: fmt,
        tierCode: tier.tierCode,
        wakicashMultiplier: new Prisma.Decimal(tier.wakicashMultiplier),
        wakipointsMultiplier: new Prisma.Decimal(tier.wakipointsMultiplier),
        isSelectable,
        matchCount: d.match_count,
        entityCount: d.player_count,
        firstMatchStartsAt: firstAt,
      },
      update: {
        scheduleDivisionKey: d.division_key,
        eventType: d.event_type,
        skillLevel: d.skill_level,
        ageBracket: d.age_bracket,
        labelRaw: d.division_key,
        labelDisplay,
        format: fmt,
        tierCode: tier.tierCode,
        wakicashMultiplier: new Prisma.Decimal(tier.wakicashMultiplier),
        wakipointsMultiplier: new Prisma.Decimal(tier.wakipointsMultiplier),
        isSelectable,
        matchCount: d.match_count,
        entityCount: d.player_count,
        firstMatchStartsAt: firstAt,
      },
    });
  }
  if (isAtlanta) {
    await prisma.tournamentEventCatalog.deleteMany({
      where: {
        tournamentKey,
        eventKey: { notIn: [...allowedEventKeys] },
      },
    });
    await prisma.fantasyTournamentEventPick.deleteMany({
      where: {
        lineup: { tournamentKey },
        eventKey: { notIn: [...allowedEventKeys] },
      },
    });
  }
  await refreshUnlockedEventPickFirstStartsFromCatalog(prisma, tournamentKey);
}

/**
 * When schedule JSON changes, unlocked event picks should pick up new first-match
 * instants so lock windows stay fair (see docs/fantasy-rules-v1.md §3).
 */
export async function refreshUnlockedEventPickFirstStartsFromCatalog(
  prisma: PrismaClient,
  tournamentKey: TournamentKey,
): Promise<void> {
  const catalog = await prisma.tournamentEventCatalog.findMany({
    where: { tournamentKey },
    select: { eventKey: true, firstMatchStartsAt: true },
  });
  for (const row of catalog) {
    await prisma.fantasyTournamentEventPick.updateMany({
      where: {
        eventKey: row.eventKey,
        lockedAt: null,
        lineup: { tournamentKey },
      },
      data: { firstMatchStartsAt: row.firstMatchStartsAt },
    });
  }
}

export function displayLabelForCatalogRow(row: {
  labelDisplay: string | null;
  labelRaw: string;
}): string {
  if (row.labelDisplay?.trim()) return row.labelDisplay;
  const parsed = parseDivisionKey(row.labelRaw);
  if (parsed) return titleish(parsed);
  return row.labelRaw;
}
