-- Wf* normalized bracket fantasy (phases 1–3). See Prisma models WfTournament, etc.

-- CreateTable
CREATE TABLE "WfTournament" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "location" TEXT,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "seasonYear" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'upcoming',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WfTournament_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WfTournamentEvent" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "rawLabel" TEXT NOT NULL,
    "normalizedKey" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "skillLabel" TEXT,
    "ageBracket" TEXT,
    "tier" TEXT NOT NULL DEFAULT 'B',
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "lockAt" TIMESTAMP(3),
    "matchCountEstimate" INTEGER,
    "teamCount" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'upcoming',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WfTournamentEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WfPerson" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "gender" TEXT,
    "age" INTEGER,
    "city" TEXT,
    "state" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WfPerson_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WfDoublesTeam" (
    "id" TEXT NOT NULL,
    "tournamentEventId" TEXT NOT NULL,
    "teamKey" TEXT NOT NULL,
    "player1Id" TEXT NOT NULL,
    "player2Id" TEXT,
    "displayName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WfDoublesTeam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WfPersonEventEntry" (
    "id" TEXT NOT NULL,
    "tournamentEventId" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "partnerNameRaw" TEXT,
    "teamId" TEXT,
    "sourceStatus" TEXT NOT NULL DEFAULT 'registered',
    "seed" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WfPersonEventEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WfFantasyPrice" (
    "id" TEXT NOT NULL,
    "tournamentEventId" TEXT NOT NULL,
    "personId" TEXT,
    "teamId" TEXT,
    "baseCost" INTEGER NOT NULL,
    "adjustmentCost" INTEGER NOT NULL DEFAULT 0,
    "finalCost" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WfFantasyPrice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WfRoster" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "budgetTotal" INTEGER NOT NULL DEFAULT 100,
    "budgetUsed" INTEGER NOT NULL DEFAULT 0,
    "maxEventSelections" INTEGER NOT NULL DEFAULT 5,
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WfRoster_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WfRosterSelection" (
    "id" TEXT NOT NULL,
    "rosterId" TEXT NOT NULL,
    "tournamentEventId" TEXT NOT NULL,
    "personId" TEXT,
    "teamId" TEXT,
    "costPaid" INTEGER NOT NULL,
    "isCaptain" BOOLEAN NOT NULL DEFAULT false,
    "lockedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WfRosterSelection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WfBracketMatch" (
    "id" TEXT NOT NULL,
    "tournamentEventId" TEXT NOT NULL,
    "roundLabel" TEXT NOT NULL,
    "team1Id" TEXT,
    "team2Id" TEXT,
    "player1EntryId" TEXT,
    "player2EntryId" TEXT,
    "winnerTeamId" TEXT,
    "winnerPlayerEntryId" TEXT,
    "scoreText" TEXT,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WfBracketMatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WfScoringEvent" (
    "id" TEXT NOT NULL,
    "rosterSelectionId" TEXT NOT NULL,
    "bracketMatchId" TEXT,
    "eventCode" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WfScoringEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WfRosterScore" (
    "id" TEXT NOT NULL,
    "rosterId" TEXT NOT NULL,
    "tournamentPoints" INTEGER NOT NULL DEFAULT 0,
    "rankInTournament" INTEGER,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WfRosterScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WfSeasonScore" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "seasonYear" INTEGER NOT NULL,
    "totalPoints" INTEGER NOT NULL DEFAULT 0,
    "tournamentsEntered" INTEGER NOT NULL DEFAULT 0,
    "currentRank" INTEGER,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WfSeasonScore_pkey" PRIMARY KEY ("id")
);

-- Unique indexes
CREATE UNIQUE INDEX "WfTournament_slug_key" ON "WfTournament"("slug");

CREATE UNIQUE INDEX "WfTournamentEvent_tournamentId_normalizedKey_key" ON "WfTournamentEvent"("tournamentId", "normalizedKey");

CREATE UNIQUE INDEX "WfDoublesTeam_tournamentEventId_teamKey_key" ON "WfDoublesTeam"("tournamentEventId", "teamKey");

CREATE UNIQUE INDEX "WfDoublesTeam_tournamentEventId_player1Id_player2Id_key" ON "WfDoublesTeam"("tournamentEventId", "player1Id", "player2Id");

CREATE UNIQUE INDEX "WfPersonEventEntry_tournamentEventId_personId_key" ON "WfPersonEventEntry"("tournamentEventId", "personId");

CREATE UNIQUE INDEX "WfRoster_userId_tournamentId_key" ON "WfRoster"("userId", "tournamentId");

CREATE UNIQUE INDEX "WfRosterSelection_rosterId_tournamentEventId_key" ON "WfRosterSelection"("rosterId", "tournamentEventId");

CREATE UNIQUE INDEX "WfRosterScore_rosterId_key" ON "WfRosterScore"("rosterId");

CREATE UNIQUE INDEX "WfSeasonScore_userId_seasonYear_key" ON "WfSeasonScore"("userId", "seasonYear");

-- Non-unique indexes
CREATE INDEX "WfTournament_seasonYear_idx" ON "WfTournament"("seasonYear");

CREATE INDEX "WfTournament_status_idx" ON "WfTournament"("status");

CREATE INDEX "WfTournamentEvent_tournamentId_idx" ON "WfTournamentEvent"("tournamentId");

CREATE INDEX "WfPerson_fullName_idx" ON "WfPerson"("fullName");

CREATE INDEX "WfDoublesTeam_tournamentEventId_idx" ON "WfDoublesTeam"("tournamentEventId");

CREATE INDEX "WfPersonEventEntry_tournamentEventId_idx" ON "WfPersonEventEntry"("tournamentEventId");

CREATE INDEX "WfPersonEventEntry_teamId_idx" ON "WfPersonEventEntry"("teamId");

CREATE INDEX "WfFantasyPrice_tournamentEventId_idx" ON "WfFantasyPrice"("tournamentEventId");

CREATE INDEX "WfFantasyPrice_personId_idx" ON "WfFantasyPrice"("personId");

CREATE INDEX "WfFantasyPrice_teamId_idx" ON "WfFantasyPrice"("teamId");

CREATE INDEX "WfRoster_userId_idx" ON "WfRoster"("userId");

CREATE INDEX "WfRoster_tournamentId_idx" ON "WfRoster"("tournamentId");

CREATE INDEX "WfRosterSelection_rosterId_idx" ON "WfRosterSelection"("rosterId");

CREATE INDEX "WfBracketMatch_tournamentEventId_idx" ON "WfBracketMatch"("tournamentEventId");

CREATE INDEX "WfBracketMatch_status_idx" ON "WfBracketMatch"("status");

CREATE INDEX "WfScoringEvent_rosterSelectionId_idx" ON "WfScoringEvent"("rosterSelectionId");

CREATE INDEX "WfScoringEvent_bracketMatchId_idx" ON "WfScoringEvent"("bracketMatchId");

CREATE INDEX "WfSeasonScore_seasonYear_idx" ON "WfSeasonScore"("seasonYear");

-- Foreign keys
ALTER TABLE "WfTournamentEvent" ADD CONSTRAINT "WfTournamentEvent_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "WfTournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "WfDoublesTeam" ADD CONSTRAINT "WfDoublesTeam_tournamentEventId_fkey" FOREIGN KEY ("tournamentEventId") REFERENCES "WfTournamentEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "WfDoublesTeam" ADD CONSTRAINT "WfDoublesTeam_player1Id_fkey" FOREIGN KEY ("player1Id") REFERENCES "WfPerson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "WfDoublesTeam" ADD CONSTRAINT "WfDoublesTeam_player2Id_fkey" FOREIGN KEY ("player2Id") REFERENCES "WfPerson"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "WfPersonEventEntry" ADD CONSTRAINT "WfPersonEventEntry_tournamentEventId_fkey" FOREIGN KEY ("tournamentEventId") REFERENCES "WfTournamentEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "WfPersonEventEntry" ADD CONSTRAINT "WfPersonEventEntry_personId_fkey" FOREIGN KEY ("personId") REFERENCES "WfPerson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "WfPersonEventEntry" ADD CONSTRAINT "WfPersonEventEntry_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "WfDoublesTeam"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "WfFantasyPrice" ADD CONSTRAINT "WfFantasyPrice_tournamentEventId_fkey" FOREIGN KEY ("tournamentEventId") REFERENCES "WfTournamentEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "WfFantasyPrice" ADD CONSTRAINT "WfFantasyPrice_personId_fkey" FOREIGN KEY ("personId") REFERENCES "WfPerson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "WfFantasyPrice" ADD CONSTRAINT "WfFantasyPrice_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "WfDoublesTeam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "WfRoster" ADD CONSTRAINT "WfRoster_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "WfRoster" ADD CONSTRAINT "WfRoster_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "WfTournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "WfRosterSelection" ADD CONSTRAINT "WfRosterSelection_rosterId_fkey" FOREIGN KEY ("rosterId") REFERENCES "WfRoster"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "WfRosterSelection" ADD CONSTRAINT "WfRosterSelection_tournamentEventId_fkey" FOREIGN KEY ("tournamentEventId") REFERENCES "WfTournamentEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "WfRosterSelection" ADD CONSTRAINT "WfRosterSelection_personId_fkey" FOREIGN KEY ("personId") REFERENCES "WfPerson"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "WfRosterSelection" ADD CONSTRAINT "WfRosterSelection_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "WfDoublesTeam"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "WfBracketMatch" ADD CONSTRAINT "WfBracketMatch_tournamentEventId_fkey" FOREIGN KEY ("tournamentEventId") REFERENCES "WfTournamentEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "WfBracketMatch" ADD CONSTRAINT "WfBracketMatch_team1Id_fkey" FOREIGN KEY ("team1Id") REFERENCES "WfDoublesTeam"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "WfBracketMatch" ADD CONSTRAINT "WfBracketMatch_team2Id_fkey" FOREIGN KEY ("team2Id") REFERENCES "WfDoublesTeam"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "WfBracketMatch" ADD CONSTRAINT "WfBracketMatch_player1EntryId_fkey" FOREIGN KEY ("player1EntryId") REFERENCES "WfPersonEventEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "WfBracketMatch" ADD CONSTRAINT "WfBracketMatch_player2EntryId_fkey" FOREIGN KEY ("player2EntryId") REFERENCES "WfPersonEventEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "WfBracketMatch" ADD CONSTRAINT "WfBracketMatch_winnerTeamId_fkey" FOREIGN KEY ("winnerTeamId") REFERENCES "WfDoublesTeam"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "WfBracketMatch" ADD CONSTRAINT "WfBracketMatch_winnerPlayerEntryId_fkey" FOREIGN KEY ("winnerPlayerEntryId") REFERENCES "WfPersonEventEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "WfScoringEvent" ADD CONSTRAINT "WfScoringEvent_rosterSelectionId_fkey" FOREIGN KEY ("rosterSelectionId") REFERENCES "WfRosterSelection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "WfScoringEvent" ADD CONSTRAINT "WfScoringEvent_bracketMatchId_fkey" FOREIGN KEY ("bracketMatchId") REFERENCES "WfBracketMatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "WfRosterScore" ADD CONSTRAINT "WfRosterScore_rosterId_fkey" FOREIGN KEY ("rosterId") REFERENCES "WfRoster"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "WfSeasonScore" ADD CONSTRAINT "WfSeasonScore_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Exactly one of personId / teamId on prices (singles vs doubles pricing rows)
ALTER TABLE "WfFantasyPrice" ADD CONSTRAINT "WfFantasyPrice_person_xor_team_chk" CHECK (
    ("personId" IS NOT NULL AND "teamId" IS NULL)
    OR ("personId" IS NULL AND "teamId" IS NOT NULL)
);

CREATE UNIQUE INDEX "WfFantasyPrice_event_person_uidx" ON "WfFantasyPrice"("tournamentEventId", "personId") WHERE "teamId" IS NULL;

CREATE UNIQUE INDEX "WfFantasyPrice_event_team_uidx" ON "WfFantasyPrice"("tournamentEventId", "teamId") WHERE "personId" IS NULL;

-- WfRosterSelection: enforce exactly one of personId / teamId on submit/lock in application (draft rows may be incomplete).
