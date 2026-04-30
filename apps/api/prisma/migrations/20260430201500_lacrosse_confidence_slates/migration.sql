-- Lacrosse confidence-allocation fantasy slates.

CREATE TABLE "LacrosseSlate" (
    "id" TEXT NOT NULL,
    "slateKey" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "seasonYear" INTEGER NOT NULL,
    "lockAt" TIMESTAMP(3) NOT NULL,
    "isClosed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "LacrosseSlate_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "LacrosseSlate_slateKey_key" ON "LacrosseSlate"("slateKey");
CREATE INDEX "LacrosseSlate_seasonYear_lockAt_idx" ON "LacrosseSlate"("seasonYear", "lockAt");

CREATE TABLE "LacrosseSlateLine" (
    "id" TEXT NOT NULL,
    "slateId" TEXT NOT NULL,
    "lineKey" TEXT NOT NULL,
    "teamA" TEXT NOT NULL,
    "teamB" TEXT NOT NULL,
    "spreadA" DECIMAL(6,2) NOT NULL,
    "oddsA" INTEGER NOT NULL,
    "oddsB" INTEGER NOT NULL,
    "confidence" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "LacrosseSlateLine_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "LacrosseSlateLine_slateId_lineKey_key" ON "LacrosseSlateLine"("slateId", "lineKey");
CREATE INDEX "LacrosseSlateLine_slateId_idx" ON "LacrosseSlateLine"("slateId");

CREATE TABLE "LacrosseLineup" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "slateId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "spentWakiCash" INTEGER NOT NULL DEFAULT 0,
    "estReturn" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "LacrosseLineup_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "LacrosseLineup_userId_slateId_key" ON "LacrosseLineup"("userId", "slateId");
CREATE INDEX "LacrosseLineup_slateId_idx" ON "LacrosseLineup"("slateId");
CREATE INDEX "LacrosseLineup_userId_idx" ON "LacrosseLineup"("userId");

CREATE TABLE "LacrossePick" (
    "id" TEXT NOT NULL,
    "lineupId" TEXT NOT NULL,
    "lineId" TEXT NOT NULL,
    "side" TEXT NOT NULL,
    "stake" INTEGER NOT NULL,
    "oddsAtSave" INTEGER NOT NULL,
    "estReturn" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "LacrossePick_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "LacrossePick_lineupId_lineId_key" ON "LacrossePick"("lineupId", "lineId");
CREATE INDEX "LacrossePick_lineId_idx" ON "LacrossePick"("lineId");

ALTER TABLE "LacrosseSlateLine"
ADD CONSTRAINT "LacrosseSlateLine_slateId_fkey"
FOREIGN KEY ("slateId") REFERENCES "LacrosseSlate"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "LacrosseLineup"
ADD CONSTRAINT "LacrosseLineup_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "LacrosseLineup"
ADD CONSTRAINT "LacrosseLineup_slateId_fkey"
FOREIGN KEY ("slateId") REFERENCES "LacrosseSlate"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "LacrossePick"
ADD CONSTRAINT "LacrossePick_lineupId_fkey"
FOREIGN KEY ("lineupId") REFERENCES "LacrosseLineup"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "LacrossePick"
ADD CONSTRAINT "LacrossePick_lineId_fkey"
FOREIGN KEY ("lineId") REFERENCES "LacrosseSlateLine"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
