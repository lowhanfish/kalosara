-- CreateEnum
CREATE TYPE "GuestStatus" AS ENUM ('WAITING', 'SERVED', 'CANCELLED');

-- CreateTable
CREATE TABLE "GuestBookEntry" (
    "id" UUID NOT NULL,
    "ticketNumber" VARCHAR(30) NOT NULL,
    "fullName" VARCHAR(120) NOT NULL,
    "phone" VARCHAR(30) NOT NULL,
    "nik" VARCHAR(20),
    "guestType" VARCHAR(30) NOT NULL,
    "institution" VARCHAR(200),
    "addressOrRt" VARCHAR(200),
    "purpose" VARCHAR(200) NOT NULL,
    "destinationStaff" VARCHAR(200) NOT NULL,
    "notes" TEXT,
    "status" "GuestStatus" NOT NULL DEFAULT 'WAITING',
    "servedAt" TIMESTAMP(3),
    "servedBy" VARCHAR(120),
    "internalNote" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GuestBookEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GuestBookEntry_ticketNumber_key" ON "GuestBookEntry"("ticketNumber");

-- CreateIndex
CREATE INDEX "GuestBookEntry_status_createdAt_idx" ON "GuestBookEntry"("status", "createdAt");

-- CreateIndex
CREATE INDEX "GuestBookEntry_createdAt_idx" ON "GuestBookEntry"("createdAt");
