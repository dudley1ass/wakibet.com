import { Prisma, type PrismaClient } from "@prisma/client";
import {
  filterMatchesForDivision,
  isFeaturedWinterDivision,
  listDivisionsFromMatches,
  parseDivisionKey,
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

function titleish(parts: { event_type: string; skill_level: string; age_bracket: string }): string {
  return [parts.event_type, parts.skill_level, parts.age_bracket].filter(Boolean).join(" · ");
}

export type TierAssignment = {
  tierCode: "A" | "B" | "C";
  wakicashMultiplier: number;
  wakipointsMultiplier: number;
  isSelectable: boolean;
};

/**
 * Phase 2: tier + multipliers + selectable flag from division shape (featured gate matches winter fantasy).
 */
export function assignTierForDivision(row: {
  event_type: string;
  skill_level: string;
  age_bracket: string;
  match_count: number;
  player_count: number;
}): TierAssignment {
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
  const divisions = listDivisionsFromMatches(data.matches);
  for (const d of divisions) {
    const fmt: EventFormatSlug = inferFormatFromEventType(d.event_type);
    const eventKey = buildEventKeyV1(tournamentKey, d.event_type, d.skill_level, d.age_bracket, fmt);
    const divMatches = filterMatchesForDivision(data.matches, d.division_key);
    const firstAt = firstMatchStartsAt(divMatches);
    const tier = assignTierForDivision(d);
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
        isSelectable: tier.isSelectable,
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
        isSelectable: tier.isSelectable,
        matchCount: d.match_count,
        entityCount: d.player_count,
        firstMatchStartsAt: firstAt,
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
