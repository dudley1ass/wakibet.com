-- Tiebreaker picks for NASCAR weekly lineups (win margin seconds, total caution laps).
ALTER TABLE "NascarWeeklyLineup" ADD COLUMN "tiebreakerWinMarginSeconds" INTEGER;
ALTER TABLE "NascarWeeklyLineup" ADD COLUMN "tiebreakerCautionLaps" INTEGER;
