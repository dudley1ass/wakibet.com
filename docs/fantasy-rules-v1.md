# Fantasy rules v1 (authoritative)

This document **nails down hard rules** for tournament fantasy and how they interact with season scoring. Implementation must match this file; the longer design history lives in `fantasy-tournament-lineups-spec.md`.

---

## 1. What is selected in each event (MVP)

| Rule | Value |
|------|--------|
| **Selection unit** | **Five distinct players** named in the schedule for that event’s division (same shape as legacy winter fantasy). |
| **Singles vs doubles** | **No separate “team object” in v1.** Doubles divisions still pick **five individual player names** who appear as `player_a` / `player_b` in that division’s matches. |
| **Captain** | **Exactly one captain per saved event** (1.5× WakiPoints for that captain on that event only). |
| **Same player in multiple events (same tournament)** | **Not allowed.** One normalized name cannot appear in two different saved events under the same tournament lineup. |
| **Empty event slots** | **Allowed.** User may save **0–5** events. Unused slots are not stored. **No minimum** number of events required. |
| **Incomplete event** | An event is either **saved with exactly five picks and one captain** or **not submitted** for that slot. Partial picks are rejected on save. |

*Deferred (not v1): stable doubles team IDs, single-player singles mode, per-event roster size other than five.*

---

## 2. WakiCash (tournament scope)

| Rule | Value |
|------|--------|
| **Budget** | **100 WakiCash per tournament lineup** (header), refreshed each tournament. |
| **Spend** | Sum of **tier-adjusted** per-player prices across **all saved events** in that tournament. |
| **Overspend** | **Rejected** on save. |
| **Pricing base** | Skill-based table + hash rotation (shared `playerWakiCashCost`), multiplied by catalog **`wakicash_multiplier`** for that event. |

---

## 3. Event lock (per event, same tournament)

| Rule | Value |
|------|--------|
| **Lock moment** | When `now >= first_match_starts_at - ROSTER_EDIT_LOCK`, where **`ROSTER_EDIT_LOCK = 60 minutes`**, same as legacy winter fantasy. |
| **Source of `first_match_starts_at`** | **Minimum** parsed start time across schedule rows in that event’s division in the **current ingested JSON** (see §7). Stored on catalog and **snapshotted on the event pick** at save; **unlocked** rows are **refreshed from catalog** on each catalog sync so schedule corrections apply until lock. |
| **After lock** | That event’s picks are **immutable** (`locked_at` set). API returns **409 `EVENT_LOCKED`** if a client attempts to change locked picks. |
| **Other events** | Events that are **not** yet locked remain **editable** independently. |
| **Timezone / truth** | All comparisons use **UTC instants** (`Date` in Node). Schedule strings are parsed with **`Date.parse`**; ambiguous strings are treated as whatever ECMAScript yields—**ingestion should prefer ISO-8601 with offset** when enriching data. |
| **If first match time moves earlier** | Unlocked rows pick up the new time on catalog sync; if the user is now inside the lock window, the next save attempt may fail or persist as locked. |
| **If time moves later** | Unlocked lineups gain edit window back until the new lock moment. |
| **Once `locked_at` is set** | **Never cleared** by automated jobs in v1 (admin tooling out of scope). |

---

## 4. Event quality & eligibility

| Rule | Value |
|------|--------|
| **Catalog** | Each schedulable bucket has `is_selectable`, `tier_code`, counts, and multipliers. |
| **Non-featured / tiny pools** | **`is_selectable = false`** when the division fails the same featured heuristic as winter fantasy (not enough players/matches). **Cannot be saved.** |
| **Tiers A / B / C** | **A**: stronger brackets (policy in code). **B**: default featured. **C**: discounted multipliers; may still be selectable if featured but small. |
| **Bad or incomplete results** | Scoring uses whatever matches exist; **no picks** on non-selectable buckets. |

---

## 5. Season standings (global, v1)

| Rule | Value |
|------|--------|
| **Season score** | **Sum of WakiPoints** across all **featured** division/event rows the user has submitted (legacy winter **or** tournament fantasy, **not both** for the same `tournament_key`—tournament lineup wins when present). |
| **Skipped tournament** | **0 points** for that tournament (no penalty row). |
| **Best X of Y** | **Not used in v1**; **every** planned tournament in the season order counts as **0 until played and scored**. |
| **Tie-breakers (leaderboard)** | **1)** Higher total WakiPoints **2)** `display_name` ascending (case-insensitive) **3)** `user_id` ascending — stable ordering. **Competition ranking:** users with equal points share the same rank; next rank skips (1,1,3…). |
| **Normalized points** | **Not used in v1**; raw summed WakiPoints only. |

---

## 6. API enforcement checklist (must hold)

1. **≤ 5** saved events per tournament lineup.  
2. **Unique `event_key`** per lineup.  
3. **No duplicate player** (normalized) across all saved events in that lineup.  
4. **Spend ≤ budget** for that tournament.  
5. **No mutation** to locked events (409).  
6. **Every player** in an event must appear in that division’s player pool from schedule JSON.  
7. **Exactly one captain** per saved event; **five** picks per saved event.  
8. **Reject** saves when catalog row **`is_selectable`** is false or missing.

---

## 7. Data & admin (v1 expectations)

- **Import path:** Schedule JSON per `tournament_key` → rebuild `TournamentEventCatalog` → refresh unlocked `first_match_starts_at` snapshots.  
- **Manual overrides:** Tier / `is_selectable` adjustments are **DB or script** operations until an admin UI exists.  
- **Re-score:** Re-running scoring after data fixes is **idempotent** on match-derived inputs; no separate v1 score ledger required beyond current engine.

---

## 8. Out of scope for v1 (explicit)

- Private leagues, invite contests, multiple paid formats.  
- Push notifications.  
- Full popularity / recent-form pricing (see pricing note in §2 — skill + tier only).  
- Rich projection UX (“you move up 8 ranks”) beyond existing what-if style deltas.

---

*Version: **v1**. Bump version when any breaking rule changes.*
