-- CreateTable
CREATE TABLE "FantasyTournamentLineup" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tournamentKey" TEXT NOT NULL,
    "seasonKey" TEXT NOT NULL DEFAULT '',
    "wakicashBudget" INTEGER NOT NULL DEFAULT 100,
    "wakicashSpent" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FantasyTournamentLineup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FantasyTournamentEventPick" (
    "id" TEXT NOT NULL,
    "lineupId" TEXT NOT NULL,
    "slotIndex" INTEGER NOT NULL,
    "eventKey" TEXT NOT NULL,
    "eventLabelRaw" TEXT NOT NULL,
    "eventLabelDisplay" TEXT,
    "format" TEXT NOT NULL DEFAULT 'unknown',
    "scheduleDivisionKey" TEXT NOT NULL,
    "tierCodeAtSave" TEXT,
    "firstMatchStartsAt" TIMESTAMP(3),
    "lockedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FantasyTournamentEventPick_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FantasyTournamentEventPickSlot" (
    "id" TEXT NOT NULL,
    "eventPickId" TEXT NOT NULL,
    "slotIndex" INTEGER NOT NULL,
    "playerName" TEXT NOT NULL,
    "isCaptain" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FantasyTournamentEventPickSlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TournamentEventCatalog" (
    "id" TEXT NOT NULL,
    "tournamentKey" TEXT NOT NULL,
    "eventKey" TEXT NOT NULL,
    "scheduleDivisionKey" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "skillLevel" TEXT NOT NULL,
    "ageBracket" TEXT NOT NULL,
    "labelRaw" TEXT NOT NULL,
    "labelDisplay" TEXT,
    "format" TEXT NOT NULL DEFAULT 'unknown',
    "tierCode" TEXT NOT NULL DEFAULT 'B',
    "wakicashMultiplier" DECIMAL(10,4) NOT NULL DEFAULT 1,
    "wakipointsMultiplier" DECIMAL(10,4) NOT NULL DEFAULT 1,
    "isSelectable" BOOLEAN NOT NULL DEFAULT true,
    "matchCount" INTEGER NOT NULL,
    "entityCount" INTEGER NOT NULL,
    "firstMatchStartsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TournamentEventCatalog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FantasyTournamentLineup_userId_tournamentKey_seasonKey_key" ON "FantasyTournamentLineup"("userId", "tournamentKey", "seasonKey");

-- CreateIndex
CREATE INDEX "FantasyTournamentLineup_userId_idx" ON "FantasyTournamentLineup"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "FantasyTournamentEventPick_lineupId_eventKey_key" ON "FantasyTournamentEventPick"("lineupId", "eventKey");

-- CreateIndex
CREATE UNIQUE INDEX "FantasyTournamentEventPick_lineupId_slotIndex_key" ON "FantasyTournamentEventPick"("lineupId", "slotIndex");

-- CreateIndex
CREATE INDEX "FantasyTournamentEventPick_lineupId_idx" ON "FantasyTournamentEventPick"("lineupId");

-- CreateIndex
CREATE UNIQUE INDEX "FantasyTournamentEventPickSlot_eventPickId_slotIndex_key" ON "FantasyTournamentEventPickSlot"("eventPickId", "slotIndex");

-- CreateIndex
CREATE INDEX "FantasyTournamentEventPickSlot_eventPickId_idx" ON "FantasyTournamentEventPickSlot"("eventPickId");

-- CreateIndex
CREATE UNIQUE INDEX "TournamentEventCatalog_tournamentKey_eventKey_key" ON "TournamentEventCatalog"("tournamentKey", "eventKey");

-- CreateIndex
CREATE INDEX "TournamentEventCatalog_tournamentKey_idx" ON "TournamentEventCatalog"("tournamentKey");

-- AddForeignKey
ALTER TABLE "FantasyTournamentLineup" ADD CONSTRAINT "FantasyTournamentLineup_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FantasyTournamentEventPick" ADD CONSTRAINT "FantasyTournamentEventPick_lineupId_fkey" FOREIGN KEY ("lineupId") REFERENCES "FantasyTournamentLineup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FantasyTournamentEventPickSlot" ADD CONSTRAINT "FantasyTournamentEventPickSlot_eventPickId_fkey" FOREIGN KEY ("eventPickId") REFERENCES "FantasyTournamentEventPick"("id") ON DELETE CASCADE ON UPDATE CASCADE;
