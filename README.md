# WakiBet (Option A — Phase 1)

Turborepo monorepo: **Fastify + Prisma + Postgres** API, **Vite + React** web app, **Expo** mobile shell, **shared** TypeScript (scoring rules).

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

- **Web (Vite):** `pnpm --filter @wakibet/web dev` — browser UI at **http://127.0.0.1:5173**. API calls go to `/api/...` and are proxied to the API on port 3000. Run the API in another terminal (`pnpm --filter @wakibet/api dev`).

## Useful URLs (API)

- OpenAPI JSON: [http://127.0.0.1:3000/documentation/json](http://127.0.0.1:3000/documentation/json)
- Swagger UI: [http://127.0.0.1:3000/docs](http://127.0.0.1:3000/docs)
- Health: [http://127.0.0.1:3000/api/v1/health](http://127.0.0.1:3000/api/v1/health)

## Client types from OpenAPI

After the API installs and runs, from repo root:

`pnpm generate:api-types`

This writes `openapi.json` at the monorepo root (gitignored) and refreshes `packages/shared/src/generated/api.d.ts`.

## Web app + Render Static Site

The browser UI lives in **`apps/web`** (React + Vite). The API service only serves JSON; deploy the web app as a **second** Render resource:

1. **New → Static Site**, same repo and branch `main`.
2. **Root Directory:** leave **empty** (repository root). **Do not** use `frontend` or `backend` — those paths existed only on the old app layout; this monorepo uses **`apps/web`** and the publish path below.
3. **Build Command:** `pnpm run render:build:web`
4. **Publish directory:** `apps/web/dist`
5. **Environment → Environment Variable (required for build):** `VITE_API_BASE` = your API origin, e.g. `https://wakibet-com-2.onrender.com` (no trailing slash). Vite bakes this in at build time.
6. On the **API** Web Service, set **`WAKIBET_JWT_SECRET`** to a long random string (required in production for login/register).

## Phase 1 scope (done here)

Monorepo layout, Docker Compose, Prisma schema + initial migration, Fastify app with health/meta/auth/dashboard stub, Swagger + `/documentation/json`, optional Sentry, **Vite web** (login + dashboard), Expo shell, shared scoring.

**Not in Phase 1 yet:** contest lobby, real picks/ledger beyond signup, Redis jobs, refresh-token sessions.

## Render (replace old Python service)

The repo root is the **Node + pnpm monorepo**. There is no `backend/` folder anymore.

In the Render dashboard for this Web Service:

1. **Settings → Build & Deploy → Root Directory** — delete `backend` and leave the field **empty** (repository root).
2. **Settings → Environment** — change **Environment** from **Python 3** to **Node** (pick Node **20** or newer).
3. **Build Command:** `pnpm run render:build`
4. **Start Command:** `pnpm run render:start`
5. **Environment → Environment Variables:** add **`DATABASE_URL`** from a Render PostgreSQL instance (create Postgres if needed, then use the **Internal Database URL** on the same region as the web service). Add **`WAKIBET_JWT_SECRET`** (long random string) for login/register. Optional: `SENTRY_DSN`, `NODE_ENV=production`.
6. **Settings → Deploy → Pre-Deploy Command** (recommended): `pnpm --filter @wakibet/api exec prisma migrate deploy`

Save, then **Manual Deploy**. See `RENDER.txt` for a copy-paste checklist.
