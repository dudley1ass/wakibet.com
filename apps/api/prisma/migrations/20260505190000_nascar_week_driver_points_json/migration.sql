-- Store per-week official fantasy points map (driverKey -> points) for lineup scoring.
ALTER TABLE "NascarWeek" ADD COLUMN "driverPointsByKey" JSONB;
