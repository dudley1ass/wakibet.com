import type { TournamentKey } from "./winterSpringsData.js";

const EVT_PREFIX = "evt_v1";

function slugSegment(raw: string, maxLen = 48): string {
  const nfkc = raw.normalize("NFKC").trim().toLowerCase();
  const replaced = nfkc
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-");
  const s = replaced.slice(0, maxLen);
  return s.length > 0 ? s : "x";
}

export type EventFormatSlug = "singles" | "doubles" | "unknown";

export function inferFormatFromEventType(eventType: string): EventFormatSlug {
  const t = eventType.toLowerCase();
  if (t.includes("single")) return "singles";
  if (t.includes("double") || t.includes("mixed")) return "doubles";
  return "unknown";
}

/**
 * Canonical event id: `evt_v1::{tournament_key}::{event_type}::{skill}::{age}::{format}` (slugged segments).
 */
export function buildEventKeyV1(
  tournamentKey: TournamentKey,
  eventType: string,
  skillLevel: string,
  ageBracket: string,
  format: EventFormatSlug,
): string {
  return [
    EVT_PREFIX,
    tournamentKey,
    slugSegment(eventType),
    slugSegment(skillLevel),
    slugSegment(ageBracket),
    format,
  ].join("::");
}
