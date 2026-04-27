-- Cup roster display + sponsor / manufacturer (make) for WakiCash driver pool.
ALTER TABLE "NascarDriver" ADD COLUMN "sponsor" TEXT;
ALTER TABLE "NascarDriver" ADD COLUMN "manufacturer" TEXT;
