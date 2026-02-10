-- Ensure enum type exists and align column type
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ProcessedEventStatus') THEN
    CREATE TYPE "ProcessedEventStatus" AS ENUM ('PROCESSING', 'COMPLETED', 'FAILED');
  END IF;
END$$;

ALTER TABLE "ProcessedEvent"
  ALTER COLUMN "status" TYPE "ProcessedEventStatus"
  USING "status"::"ProcessedEventStatus";
