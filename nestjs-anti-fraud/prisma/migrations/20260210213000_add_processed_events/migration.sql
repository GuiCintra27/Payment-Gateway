-- Create processed events table for antifraud inbox pattern
CREATE TABLE "ProcessedEvent" (
    "eventId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProcessedEvent_pkey" PRIMARY KEY ("eventId")
);

CREATE INDEX "ProcessedEvent_status_idx" ON "ProcessedEvent"("status");
