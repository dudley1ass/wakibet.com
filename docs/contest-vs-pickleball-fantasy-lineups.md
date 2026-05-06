# Contest / wallet vs pickleball fantasy lineups

Two parallel concepts exist in the schema:

1. **`FantasyTournamentLineup` / `FantasyTournamentEventPick`** — Production pickleball fantasy: string tournament keys, catalog-driven events, WakiCash budgets, and scoring tied to published tournament JSON. This is what `/api/v1/fantasy-tournament/*` and the dashboard fantasy UX use.

2. **`Contest` / `ContestEntry` / `Lineup`** — Salary-cap contest entries wired to `Tournament`, `Lineup`, and `WalletLedger`. These models support contest lifecycle and payouts; they are not interchangeable with `FantasyTournament*` rows.

Do not merge the two without an explicit migration design: keys, locking rules, and scoring pipelines differ. Prefer naming codepaths after `fantasy-tournament` vs `contest` to avoid accidental coupling.
