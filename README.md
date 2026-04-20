# WakiBet (Option A — Phase 1)

Turborepo monorepo: **Fastify + Prisma + Postgres** API, **Expo** mobile shell, **shared** TypeScript (scoring rules).

## Prerequisites

- Node 20+
- [pnpm](https://pnpm.io/) 9 (`packageManager` in root `package.json`)
- Docker (for Postgres / Redis): optional but recommended

## First-time setup

1. Copy environment file:

   `cp .env.example .env` (or copy `.env.example` to `.env` on Windows).

2. Start databases:

   `docker compose up -d`

3. Install dependencies (from this folder):

   `pnpm install`

   If installs fail on Windows with `EBUSY` / rename errors under `node_modules`, exclude this directory from sync/AV scanning or move the repo to a short local path (not under OneDrive), delete `node_modules`, and retry.

4. Apply the database schema:

   `pnpm db:migrate`

   (Uses `apps/api/prisma/migrations/20260420120000_init`.)

5. Regenerate Prisma client if needed:

   `pnpm db:generate`

## Run

- **API + shared (watch):** from repo root, `pnpm dev` runs Turbo `dev` for workspaces (shared is built first).

- **API only:** `pnpm --filter @wakibet/api dev` — listens on `PORT` (default **3000**).

- **Mobile:** `pnpm --filter @wakibet/mobile dev` — Expo dev server. Set `EXPO_PUBLIC_API_URL` (e.g. `http://127.0.0.1:3000`) so the Home screen health check can reach your machine from a device/emulator.

## Useful URLs (API)

- OpenAPI JSON: [http://127.0.0.1:3000/documentation/json](http://127.0.0.1:3000/documentation/json)
- Swagger UI: [http://127.0.0.1:3000/docs](http://127.0.0.1:3000/docs)
- Health: [http://127.0.0.1:3000/api/v1/health](http://127.0.0.1:3000/api/v1/health)

## Client types from OpenAPI

After the API installs and runs, from repo root:

`pnpm generate:api-types`

This writes `openapi.json` at the monorepo root (gitignored) and refreshes `packages/shared/src/generated/api.d.ts`.

## Phase 1 scope (done here)

Monorepo layout, Docker Compose, Prisma schema + initial migration, Fastify app with health/meta, Swagger + `/documentation/json`, optional Sentry, Expo app with React Navigation, React Query, Zustand, and a minimal Home screen.

**Not in Phase 1:** auth routes, contests, jobs, Redis usage beyond Compose, production deploy wiring.
