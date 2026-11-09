-- CreateEnum
CREATE TYPE "LetterType" AS ENUM ('SKU', 'SKTM', 'DOMISILI', 'PENGANTAR_SKCK', 'BELUM_MENIKAH', 'BELUM_BEKERJA', 'PENGHASILAN', 'PENGANTAR_NIKAH', 'AHLI_WARIS', 'LAINNYA');

-- CreateEnum
CREATE TYPE "LetterStatus" AS ENUM ('SUBMITTED', 'REJECTED', 'VERIFIED', 'SIGNED');

-- CreateTable
CREATE TABLE "LetterRequest" (
    "id" UUID NOT NULL,
    "ticketNumber" VARCHAR(30) NOT NULL,
    "letterNumber" VARCHAR(60),
    "type" "LetterType" NOT NULL,
    "status" "LetterStatus" NOT NULL DEFAULT 'SUBMITTED',
    "userId" UUID NOT NULL,
    "applicantName" VARCHAR(120) NOT NULL,
    "applicantNik" VARCHAR(20) NOT NULL,
    "birthPlace" VARCHAR(100) NOT NULL,
    "birthDate" VARCHAR(20) NOT NULL,
    "gender" VARCHAR(20) NOT NULL,
    "religion" VARCHAR(30) NOT NULL,
    "maritalStatus" VARCHAR(30) NOT NULL,
    "occupation" VARCHAR(100) NOT NULL,
    "address" VARCHAR(500) NOT NULL,
    "details" JSONB NOT NULL,
    "rejectionReason" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "verifiedBy" VARCHAR(120),
    "signedAt" TIMESTAMP(3),
    "signedBy" VARCHAR(120),
    "pdfPath" VARCHAR(500),
    "qrToken" VARCHAR(64),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LetterRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LetterAttachment" (
    "id" UUID NOT NULL,
    "letterId" UUID NOT NULL,
    "originalName" VARCHAR(255) NOT NULL,
    "storagePath" VARCHAR(500) NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" VARCHAR(100) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LetterAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LetterRequest_ticketNumber_key" ON "LetterRequest"("ticketNumber");

-- CreateIndex
CREATE UNIQUE INDEX "LetterRequest_letterNumber_key" ON "LetterRequest"("letterNumber");

-- CreateIndex
CREATE UNIQUE INDEX "LetterRequest_qrToken_key" ON "LetterRequest"("qrToken");

-- CreateIndex
CREATE INDEX "LetterRequest_status_createdAt_idx" ON "LetterRequest"("status", "createdAt");

-- CreateIndex
CREATE INDEX "LetterRequest_userId_createdAt_idx" ON "LetterRequest"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "LetterRequest_type_createdAt_idx" ON "LetterRequest"("type", "createdAt");

-- CreateIndex
CREATE INDEX "LetterAttachment_letterId_idx" ON "LetterAttachment"("letterId");

-- AddForeignKey
ALTER TABLE "LetterRequest" ADD CONSTRAINT "LetterRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LetterAttachment" ADD CONSTRAINT "LetterAttachment_letterId_fkey" FOREIGN KEY ("letterId") REFERENCES "LetterRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
