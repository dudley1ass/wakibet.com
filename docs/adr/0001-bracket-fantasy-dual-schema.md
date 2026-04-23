# ADR 0001: Bracket fantasy — dual Prisma models and migration direction

## Status

Accepted (direction set; execution is incremental).

## Context

The API and Prisma layer currently include two representations of bracket-style fantasy data:

1. **Production path (ship today)**  
   `FantasyTournamentLineup` / `FantasyTournamentEventPick` / `FantasyTournamentEventPickSlot` plus `TournamentEventCatalog`, aligned with string keys from schedule JSON (`apps/api/data/*.json`) and `winterSpringsData` helpers. Winter division rosters use `WinterFantasyRoster` / `WinterFantasyPick`. All authenticated dashboard, pick-teams, and winter-fantasy routes read and write this stack.

2. **Normalized experimental path**  
   `WfTournament`, `WfTournamentEvent`, `WfRoster`, `WfFantasyPrice`, `WfBracketMatch`, and related `Wf*` models (see `prisma/schema.prisma`). These are intended for a richer relational bracket graph and future phases; they are **not** wired into the live dashboard or roster flows in this repo snapshot.

Schema comments describe `Wf*` as evolving in parallel until merged. Continuing to add product features to both stacks without a decision increases migration cost.

## Decision

- **Canonical for the current product**: string-keyed **FantasyTournamentLineup** + **WinterFantasyRoster** + **TournamentEventCatalog**, backed by versioned JSON schedules and `syncTournamentEventCatalog` (now also run on API boot and on a timer, not only on dashboard requests).
- **Wf\* models**: treated as **forward-looking / R&D**. No new user-facing features should depend on them until an explicit cutover plan is executed. Either (a) wire a vertical slice (one tournament) through `Wf*` and prove parity, then migrate reads/writes, or (b) remove unused `Wf*` tables if the product abandons that approach.

## Consequences

- New fantasy features should extend **FantasyTournamentLineup** (and catalog) unless the team explicitly approves a `Wf*` migration project.
- Documentation and onboarding should state clearly which models power `/api/v1/fantasy-tournament/*` and `/api/v1/users/me/dashboard/*` (including split reads: `/summary`, `/rosters`, `/insights`).

## Migration outline (when merging or retiring Wf\*)

1. **Inventory**  
   List every Prisma read/write for `FantasyTournamentLineup` and `Wf*` (grep + route map). Confirm no runtime code path reads `Wf*` today.

2. **Parity matrix**  
   For one tournament key, define parity: lineup CRUD, locks, tiers, scoring inputs, catalog fields.

3. **Dual-write or backfill**  
   If moving to `Wf*`: migration script from existing lineups into `WfRoster` / selections; dual-read behind a flag until parity tests pass.

4. **Cutover**  
   Flip feature flag; remove old models in a follow-up migration after retention window.

5. **If retiring Wf\***  
   Drop tables in a migration after backing up any seed data; remove schema comments that imply merge.

## References

- `apps/api/prisma/schema.prisma` — `FantasyTournamentLineup`, `TournamentEventCatalog`, `WfTournament`, …
- `apps/api/src/lib/dashboardMaterialize.ts` — live aggregation path.
- `apps/api/src/routes/fantasyTournament.ts` — tournament lineup API.
