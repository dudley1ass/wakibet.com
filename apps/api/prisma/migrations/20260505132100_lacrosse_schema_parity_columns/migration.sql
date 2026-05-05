-- Align existing lacrosse tables with current Prisma schema fields.
-- This fixes runtime 500s like:
-- "The column `LacrosseSlate.sport` does not exist in the current database."

ALTER TABLE "LacrosseSlate"
  ADD COLUMN IF NOT EXISTS "sport" TEXT NOT NULL DEFAULT 'lacrosse',
  ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'open',
  ADD COLUMN IF NOT EXISTS "isCurrent" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "LacrosseSlateLine"
  ADD COLUMN IF NOT EXISTS "pickType" TEXT NOT NULL DEFAULT 'team_pick',
  ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "generation" INTEGER NOT NULL DEFAULT 1;
