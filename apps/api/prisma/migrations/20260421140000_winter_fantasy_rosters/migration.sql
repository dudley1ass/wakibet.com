-- CreateTable
CREATE TABLE "WinterFantasyRoster" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "divisionKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WinterFantasyRoster_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WinterFantasyPick" (
    "id" TEXT NOT NULL,
    "rosterId" TEXT NOT NULL,
    "slotIndex" INTEGER NOT NULL,
    "playerName" TEXT NOT NULL,
    "isCaptain" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WinterFantasyPick_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WinterFantasyRoster_userId_divisionKey_key" ON "WinterFantasyRoster"("userId", "divisionKey");

-- CreateIndex
CREATE INDEX "WinterFantasyRoster_userId_idx" ON "WinterFantasyRoster"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "WinterFantasyPick_rosterId_slotIndex_key" ON "WinterFantasyPick"("rosterId", "slotIndex");

-- CreateIndex
CREATE INDEX "WinterFantasyPick_rosterId_idx" ON "WinterFantasyPick"("rosterId");

-- AddForeignKey
ALTER TABLE "WinterFantasyRoster" ADD CONSTRAINT "WinterFantasyRoster_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WinterFantasyPick" ADD CONSTRAINT "WinterFantasyPick_rosterId_fkey" FOREIGN KEY ("rosterId") REFERENCES "WinterFantasyRoster"("id") ON DELETE CASCADE ON UPDATE CASCADE;
