-- NASCAR fantasy tables (Neon / fresh DBs may never have had these; replaces prior ALTER-only attempt).

-- CreateTable
CREATE TABLE "NascarWeek" (
    "id" TEXT NOT NULL,
    "seasonYear" INTEGER NOT NULL,
    "weekKey" TEXT NOT NULL,
    "raceName" TEXT NOT NULL,
    "trackName" TEXT NOT NULL,
    "raceStartAt" TIMESTAMP(3) NOT NULL,
    "lockAt" TIMESTAMP(3) NOT NULL,
    "isClosed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NascarWeek_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NascarDriver" (
    "id" TEXT NOT NULL,
    "driverKey" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "teamName" TEXT,
    "carNumber" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "wakiCashPrice" INTEGER NOT NULL DEFAULT 0,
    "isElite" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NascarDriver_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NascarWeeklyLineup" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "weekId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "totalPts" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NascarWeeklyLineup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NascarWeeklyPick" (
    "id" TEXT NOT NULL,
    "lineupId" TEXT NOT NULL,
    "slotIndex" INTEGER NOT NULL,
    "driverId" TEXT NOT NULL,
    "isCaptain" BOOLEAN NOT NULL DEFAULT false,
    "points" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NascarWeeklyPick_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NascarWeek_weekKey_key" ON "NascarWeek"("weekKey");

-- CreateIndex
CREATE INDEX "NascarWeek_seasonYear_raceStartAt_idx" ON "NascarWeek"("seasonYear", "raceStartAt");

-- CreateIndex
CREATE UNIQUE INDEX "NascarDriver_driverKey_key" ON "NascarDriver"("driverKey");

-- CreateIndex
CREATE INDEX "NascarDriver_displayName_idx" ON "NascarDriver"("displayName");

-- CreateIndex
CREATE UNIQUE INDEX "NascarWeeklyLineup_userId_weekId_key" ON "NascarWeeklyLineup"("userId", "weekId");

-- CreateIndex
CREATE INDEX "NascarWeeklyLineup_weekId_idx" ON "NascarWeeklyLineup"("weekId");

-- CreateIndex
CREATE INDEX "NascarWeeklyLineup_userId_idx" ON "NascarWeeklyLineup"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "NascarWeeklyPick_lineupId_slotIndex_key" ON "NascarWeeklyPick"("lineupId", "slotIndex");

-- CreateIndex
CREATE UNIQUE INDEX "NascarWeeklyPick_lineupId_driverId_key" ON "NascarWeeklyPick"("lineupId", "driverId");

-- CreateIndex
CREATE INDEX "NascarWeeklyPick_driverId_idx" ON "NascarWeeklyPick"("driverId");

-- AddForeignKey
ALTER TABLE "NascarWeeklyLineup" ADD CONSTRAINT "NascarWeeklyLineup_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NascarWeeklyLineup" ADD CONSTRAINT "NascarWeeklyLineup_weekId_fkey" FOREIGN KEY ("weekId") REFERENCES "NascarWeek"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NascarWeeklyPick" ADD CONSTRAINT "NascarWeeklyPick_lineupId_fkey" FOREIGN KEY ("lineupId") REFERENCES "NascarWeeklyLineup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NascarWeeklyPick" ADD CONSTRAINT "NascarWeeklyPick_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "NascarDriver"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
