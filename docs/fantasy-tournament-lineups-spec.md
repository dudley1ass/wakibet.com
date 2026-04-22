# Fantasy tournament lineups — product & technical spec

Season-long contest with **fresh selections every tournament**. Season score = **sum of WakiPoints across tournaments**; skipping a tournament = **no points** from that tournament.

---

## 1. Core principles

| Rule | Behavior |
|------|----------|
| Per tournament | User builds a **new** submission (lineup header) for that tournament only. |
| Per tournament, events optional | User may enter **0–5** “event slots” (bracket/category rows). Fewer slots = less upside, **no penalty row**. |
| Cap | **At most 5** event selections **submitted** (saved) per user per tournament. |
| WakiCash | **Fresh budget per tournament** (e.g. 100). Validates on each save. Unused budget is fine; overspend blocked. |
| Locks | **Per event** (per event bucket): once that event’s first match starts − *lockLead*, that event’s picks are immutable; other events in the same tournament may still be editable. |

---

## 2. Identity keys

### 2.1 `tournament_key` (existing)

Stable enum / string slug aligned with schedule JSON and API today, e.g. `winter_springs`, `pictona`, `jacksonville`, `bradenton`.

### 2.2 Raw vs normalized event identity

Schedule rows carry **raw** labels (`event_type`, `skill_level`, `age_bracket`, …) that can change with scraping.

**Store both:**

| Field | Purpose |
|-------|---------|
| `event_key` | **Canonical** id for API, DB uniqueness, locks, scoring joins. Stable across re-imports if mapping rules version. |
| `event_label_raw` | Snapshot of human-readable bucket as shown in source (audit, UI fallback). |
| `event_label_display` | Optional normalized display string for UI (title-cased, consistent separators). |

**Recommended `event_key` format (deterministic, versioned):**

```
evt_v1::{tournament_key}::{slug(event_type)}::{slug(skill_level)}::{slug(age_bracket)}::{format}
```

- `format`: `singles` \| `doubles` \| `unknown` — inferred from `event_type` / keywords or explicit column when available.
- `slug`: lowercase, NFKC, replace non-alphanumeric runs with `-`, collapse repeats (max length per segment, e.g. 48 chars).
- `evt_v1` prefix allows **evt_v2** if taxonomy changes; old keys remain valid for historical rows.

**Uniqueness:** `(tournament_key, event_key)` is globally unique for “one bucket in one tournament.”

**Mapping table (optional but recommended):** `TournamentEventCatalog` rows keyed by `(tournament_key, event_key)` populated from schedule ingestion, with `label_raw_last_seen`, `tier_code`, `match_count`, `entity_count`, `first_match_starts_at`, etc., so API does not re-parse JSON for every request.

---

## 3. Lineup model (recommended schema)

### 3.1 Lineup header — “tournament submission”

One row per **(user, tournament)** submission for a given season window (or simply per tournament instance if you add `season_id` later).

**`FantasyTournamentLineup`** (name up to you; avoid overloading `Lineup` if contest model exists)

| Column | Type | Notes |
|--------|------|--------|
| `id` | cuid | PK |
| `userId` | FK | |
| `tournament_key` | string | |
| `season_key` | string optional | e.g. `winter-2026` when you split seasons |
| `wakicash_budget` | int | Default 100; configurable per tournament |
| `wakicash_spent` | int | Denormalized sum of children for fast reads; recomputed on save |
| `status` | enum | `draft` \| `submitted` (optional; MVP can use implicit submitted) |
| `createdAt` / `updatedAt` | | |

**Constraint:** `@@unique([userId, tournament_key, season_key])` — one active submission per user per tournament (per season if used).

### 3.2 Lineup event selection — “slot inside tournament”

One row per **chosen** event (0–5 rows per header).

**`FantasyTournamentEventPick`** (or `FantasyLineupEvent`)

| Column | Type | Notes |
|--------|------|--------|
| `id` | cuid | PK |
| `lineupId` | FK → header | |
| `slot_index` | int 0–4 | Stable ordering in UI; **not** same as “importance” |
| `event_key` | string | Normalized; must match catalog for `tournament_key` |
| `event_label_raw` | string | Copy at save time from client or server resolution |
| `event_label_display` | string optional | |
| `format` | enum | `singles` \| `doubles` \| `unknown` |
| `captain_entity_name` | string? nullable | If doubles “one team”: store **team label** (see §4). If singles: same as sole “star” or null if no captain concept for that format |
| `tier_code_at_save` | string optional | Snapshot `A`/`B`/`C` for audit when tiers change |
| `first_match_starts_at` | DateTime? | Copied from catalog at save for lock checks |
| `locked_at` | DateTime? | Set when lock rule fires (or null if not locked) |
| `picks` | relation | Child picks (players or team pair) — see §4 |

**Constraints:**

- `@@unique([lineupId, event_key])` — **no duplicate event** in same tournament lineup.
- `@@unique([lineupId, slot_index])` — stable slots.
- Application rule: **count(rows) ≤ 5** per `lineupId`.

### 3.3 Pick rows under an event — “fantasy selection for that event”

**`FantasyTournamentEventPickSlot`** (or reuse pattern similar to `WinterFantasyPick`)

| Column | Notes |
|--------|--------|
| `eventPickId` | FK |
| `slot_index` | 0..N-1 |
| `entity_type` | `player` \| `team` |
| `player_name` | string; for doubles team mode store **both** names in one row OR two rows with `team_slot` — **recommendation:** one row `entity_type=team`, `player_a_name`, `player_b_name` for doubles; one row `entity_type=player` for singles |
| `is_captain` | bool — at most one captain **per event pick** (or per tournament; **recommend per-event** for clarity) |

**Duplicate prevention (tournament scope):**  
Enforce **no duplicate `player_name` (or team pair identity)** across **all** `FantasyTournamentEventPick` rows under the same `lineupId`, unless product explicitly allows “same person in two events” (usually **no** for fairness). Recommendation: **unique set of player identities per tournament lineup** (normalized name compare).

---

## 4. Selection unit: one team vs one player (spec recommendation)

| Format | Recommendation |
|--------|----------------|
| **Singles** | **One player** (required count = 1 or 3/5 “picks” depending on game design — MVP: align with current **5 WakiCash slots** only if singles has 5 distinct players; if singles is “one player represents you,” use **1 slot** + captain optional — **cleanest MVP:** **same slot count (5) always** = five **players** for singles events; scoring uses only matches for that player). |
| **Doubles** | **One team** = **two players fixed as a pair** for that event. UI picks “team”; store two names + optional **team captain** (1.5× on **team** WakiPoints aggregate for that event). |

**Cleanest approach for API:** `format` on the event pick drives validation:

- `doubles` → require exactly **one team** row (two names) **or** two `player` slots that must be a pair listed in schedule as a team (harder); **prefer single `TeamPick` row** with `player_a`, `player_b`.
- `singles` → **N player slots** (keep current 5 if product wants parity with WakiCash game) **or** reduce to 1 for true “one player per event” — **recommend:** keep **5 player slots per event** for consistency with WakiCash and UI; doubles store **5 “team” slots** each team = 2 players (heavy). **Simpler MVP:** doubles = **5 teams** each team = 2 players (10 names max), WakiCash per team as one priced unit **or** price each player separately (current model). **Product call:** simplest **MVP** is **keep per-event the same as today: list of player picks + captain**, and for doubles **require pairs that appear as sides in schedule** (validate against match graph). Team-as-single-entity can be Phase 2.

**Documented MVP default:** **Per event: up to 5 player picks + 1 captain** (current engine), with **doubles validation** that each pick is an individual who appears in that division; **optional later:** collapse to “team” entity.

---

## 5. WakiCash (per tournament, reset)

- `wakicash_budget` on **lineup header** (default 100).
- **Spend** = sum of priced units across **all** event picks under that header (pricing rules may multiply by `tier_code` in Phase 2).
- **Validation on save:** `spent ≤ budget`; **per-event** optional sub-cap is not required for MVP.
- **Empty events:** not stored as rows — no spend.

---

## 6. Event cap & duplicate prevention (API)

| Rule | Enforcement |
|------|-------------|
| Max 5 events | `COUNT(event_picks WHERE lineupId = ?) ≤ 5` on insert/update transaction |
| No duplicate event | `UNIQUE(lineupId, event_key)` |
| No duplicate player across tournament lineup | Transaction: load all `player_name` from all slots under lineup; assert set size = count after normalize |
| Captain | At most one `is_captain` per event pick (recommended) |

---

## 7. Locking (per event)

**Definition:** For each `event_key`, compute `first_match_starts_at` from schedule (min start among matches in that bucket).

**Lock moment:** `now() >= first_match_starts_at - lockLead` (e.g. 60 minutes — align with existing `ROSTER_EDIT_LOCK_MS` concept).

**API behavior:**

- `PUT` lineup or event pick: if **any** referenced event is locked, **reject** mutation for that event only (partial updates: allow PATCH on unlocked events).
- Return `409` with `{ "code": "EVENT_LOCKED", "event_key": "..." }`.

**Stored fields:** `first_match_starts_at` on catalog or snapshot on `FantasyTournamentEventPick`; `locked_at` set on first successful lock pass (cron or lazy on read).

---

## 8. Event tiers, weighting, fairness (Phase 2 — recommendations)

### 8.1 Should events have tiers / weights?

**Yes — Tier A / B / C** (or numeric weight 1.0–1.2) stored on **catalog**, not only inferred at runtime.

| Tier | Meaning (example policy) |
|------|---------------------------|
| **A** | Large field, high skill band, or “featured” high-upside (Open / 4.5+, deep draw) |
| **B** | Default senior/mixed brackets |
| **C** | Small N, few matches, or developmental — **discounted** or **excluded** from selection |

### 8.2 Stronger events costing more WakiCash?

**Recommendation: yes (soft).**  
`wakicash_cost_multiplier`: A = 1.15, B = 1.0, C = 0.85 applied to **base** skill price (or flat add +5 / −5). Prevents “only farm C” without hard banning.

### 8.3 Stronger events scoring more WakiPoints?

**Recommendation: optional light multiplier on earned points** (e.g. A ×1.05, B ×1.0, C ×0.90) **or** keep points engine neutral and rely on **match volume** (more matches → more scoring opportunity). **Preferred:** **neutral WakiPoints engine** first; **tier only affects WakiCash** and **eligibility**. Add WakiPoints tier multiplier only if data shows C-tier farming.

### 8.4 Farming weak / tiny events

Combine:

1. **Featured-only selection** (toggle per tournament): only `tier in (A,B)` selectable; **or**
2. **Min matches / min players** on catalog (`is_selectable`, `ineligible_reason`) — same spirit as current “featured divisions.”
3. **WakiCash multiplier** on C (less efficient to stack many Cs).

### 8.5 Featured events only inside a tournament?

**Recommendation:** `is_selectable` boolean on **catalog**; default true for A/B, false for C unless tournament has few A/B. **API:** list selectable events for picker; **admin/script** can promote an event to A.

### 8.6 Too few teams / matches

Catalog fields: `player_count`, `match_count`. Rules:

- `match_count < min_matches` OR `player_count < min_players` → `is_selectable = false` (excluded).
- Between thresholds → tier **C** or selectable with warning.

### 8.7 Storage for tiers

**`TournamentEventCatalog`**

| Column | Notes |
|--------|--------|
| `tournament_key`, `event_key` | PK composite |
| `tier_code` | `A` \| `B` \| `C` |
| `wakicash_multiplier` | decimal |
| `wakipoints_multiplier` | decimal default 1 |
| `is_selectable` | bool |
| `first_match_starts_at` | for locks |
| `label_raw`, `label_display` | |
| `match_count`, `entity_count` | denormalized from schedule |

**Enforcement:** on save, server resolves `event_key` → catalog; reject if `!is_selectable`; apply multipliers in spend and (Phase 2) score.

---

## 9. Scoring linkage (results → lineup)

1. Resolve **matches** for `(tournament_key, event_key)` from schedule (same as today’s division filter, keyed by normalized bucket).
2. For each **FantasyTournamentEventPick**, run existing **per-player WakiPoints** (or team aggregate = sum of two players if team mode) over those matches.
3. **Tournament total** = sum over **saved** event picks.
4. **Season total** = sum over tournaments (only tournaments where user has a lineup row; missing tournament = 0).

**Idempotency:** store `rules_version` + `scored_through_match_id` optional for backfills.

---

## 10. API sketch (REST, names indicative)

### Phase 1

- `GET /api/v1/fantasy/tournaments/:tournamentKey/events` — list selectable catalog rows (+ tier, locks, counts).
- `GET /api/v1/fantasy/tournaments/:tournamentKey/my-lineup` — header + 0–5 event picks + picks tree.
- `PUT /api/v1/fantasy/tournaments/:tournamentKey/my-lineup` — upsert header + full replace of event picks (transaction): validate cap, duplicates, WakiCash, per-event lock.
- `PATCH /api/v1/fantasy/tournaments/:tournamentKey/my-lineup/events/:eventKey` — optional partial update for unlocked events only.

### Phase 2

- Admin/sync: `POST /internal/catalog/rebuild` (or job) from JSON.
- Leaderboard queries join new tables.

### Phase 3

- Projections: reuse engine on hypothetical outcomes scoped to `(tournament_key, event_key)`.

---

## 11. Phased delivery

### Phase 1 (implement first)

- Prisma: `FantasyTournamentLineup`, `FantasyTournamentEventPick`, pick slots (or reuse pick shape mirroring `WinterFantasyPick`).
- Build **event catalog** from existing schedule pipeline (`divisionKeyFromMatch` → propose migration path: **initial `event_key` = existing `division_key` slug** or new `evt_v1` alongside `division_key` for backward compat).
- APIs: create/update lineup, **5-event cap**, **WakiCash**, **duplicate player** across tournament, **per-event lock**.
- Deprecate direct “global division roster” UX in favor of “pick tournament → pick up to 5 events → pick players per event” (can keep old tables read-only during transition).

### Phase 2

- Tier fields, multipliers, featured filtering, doubles team model refinement, scoring aggregation across new tables for season dashboard.

### Phase 3

- What-if per event, dashboard tiles, leaderboard optimization / materialized views.

---

## 12. Migration note (current codebase)

Today: `WinterFantasyRoster` keyed by `userId + divisionKey` (string including tournament prefix). **Bridge:** treat each legacy row as **one** `FantasyTournamentEventPick` under a synthetic lineup for that tournament, `event_key` derived from stored `division_key`, until users re-save under new flow.

---

## 13. Open product decisions (resolve before Phase 1 coding)

1. **Singles/doubles slot parity:** 5 players per event always vs 1 player for singles — pick one for MVP.
2. **Captain:** per event vs per tournament (spec recommends **per event**).
3. **`season_key`:** omit until you have multiple season files; use nullable or constant `2026`.

---

*This document is the source of truth for implementation order: **schema + API spec first**, then Phase 1 coding against this file.*
