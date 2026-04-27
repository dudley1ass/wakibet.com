# Pickleball Module

Phase 1 module setup for pickleball fantasy domain.

- `lib/` re-exports existing pickleball/fantasy engine files from `apps/api/src/lib`.
- `routes/` re-exports existing pickleball route modules from `apps/api/src/routes`.

This keeps runtime behavior unchanged while creating a stable module namespace for gradual file moves and NASCAR onboarding.
