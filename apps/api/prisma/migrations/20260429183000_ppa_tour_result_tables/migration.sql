-- PPA tour result history (append-only facts). Separate from DFS Player/Tournament.

CREATE TABLE "PpaResultPlayer" (
    "id" SERIAL NOT NULL,
    "playerKey" TEXT NOT NULL,
    "playerName" TEXT NOT NULL,
    "gender" TEXT,
    "homeCity" TEXT,
    "homeState" TEXT,
    "active" TEXT NOT NULL DEFAULT 'yes',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PpaResultPlayer_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PpaResultPlayer_playerKey_key" ON "PpaResultPlayer"("playerKey");
CREATE INDEX "PpaResultPlayer_playerName_idx" ON "PpaResultPlayer"("playerName");

CREATE TABLE "PpaResultTournament" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tour" TEXT NOT NULL DEFAULT 'PPA',
    "location" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PpaResultTournament_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PpaResultEvent" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "eventName" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "genderDivision" TEXT NOT NULL,

    CONSTRAINT "PpaResultEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PpaResultEvent_tournamentId_idx" ON "PpaResultEvent"("tournamentId");

CREATE TABLE "PpaResultPlayerEvent" (
    "id" TEXT NOT NULL,
    "playerId" INTEGER NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "partnerName" TEXT,
    "rank" INTEGER NOT NULL,
    "roundsPlayed" INTEGER NOT NULL,
    "wins" INTEGER NOT NULL,
    "pd" INTEGER NOT NULL,
    "medal" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PpaResultPlayerEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PpaResultPlayerEvent_playerId_eventId_key" ON "PpaResultPlayerEvent"("playerId", "eventId");
CREATE INDEX "PpaResultPlayerEvent_tournamentId_eventId_idx" ON "PpaResultPlayerEvent"("tournamentId", "eventId");
CREATE INDEX "PpaResultPlayerEvent_playerId_createdAt_idx" ON "PpaResultPlayerEvent"("playerId", "createdAt");

ALTER TABLE "PpaResultEvent" ADD CONSTRAINT "PpaResultEvent_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "PpaResultTournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PpaResultPlayerEvent" ADD CONSTRAINT "PpaResultPlayerEvent_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "PpaResultPlayer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PpaResultPlayerEvent" ADD CONSTRAINT "PpaResultPlayerEvent_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "PpaResultTournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PpaResultPlayerEvent" ADD CONSTRAINT "PpaResultPlayerEvent_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "PpaResultEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Career aggregates (derive last-5 / hot_score / wakicash in app from these + raw rows).
CREATE OR REPLACE VIEW "PpaResultPlayerCareerStats" AS
SELECT
    pe."playerId",
    COUNT(*)::integer AS "totalEvents",
    COALESCE(SUM(pe."wins"), 0)::integer AS "totalWins",
    AVG(pe."rank")::double precision AS "averageRank",
    AVG(pe."pd"::double precision) AS "averagePd",
    COUNT(*) FILTER (WHERE pe."medal" = 'Gold')::integer AS "goldCount",
    COUNT(*) FILTER (WHERE pe."medal" = 'Silver')::integer AS "silverCount",
    COUNT(*) FILTER (WHERE pe."medal" = 'Bronze')::integer AS "bronzeCount"
FROM "PpaResultPlayerEvent" pe
GROUP BY pe."playerId";
