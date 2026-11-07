CREATE TABLE "PublicRequest" (
  "id" UUID NOT NULL,
  "kind" VARCHAR(20) NOT NULL,
  "name" VARCHAR(120) NOT NULL,
  "organization" VARCHAR(200),
  "email" VARCHAR(254),
  "phone" VARCHAR(30),
  "subject" VARCHAR(200) NOT NULL,
  "message" TEXT NOT NULL,
  "status" VARCHAR(20) NOT NULL DEFAULT 'NEW',
  "internalNote" TEXT NOT NULL DEFAULT '',
  "version" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PublicRequest_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PublicRequest_kind_check" CHECK ("kind" IN ('COMPLAINT','INFORMATION')),
  CONSTRAINT "PublicRequest_status_check" CHECK ("status" IN ('NEW','IN_PROGRESS','RESOLVED','ARCHIVED'))
);
CREATE INDEX "PublicRequest_kind_status_createdAt_idx" ON "PublicRequest"("kind", "status", "createdAt");

ALTER TABLE "PublicDocument" ADD COLUMN "classification" VARCHAR(20);
UPDATE "PublicDocument" d SET "classification" = 'BERKALA' FROM "ContentItem" c WHERE d."contentId" = c.id AND c.content LIKE '%Klasifikasi website lama: BERKALA.%';
UPDATE "PublicDocument" d SET "classification" = 'SETIAP_SAAT' FROM "ContentItem" c WHERE d."contentId" = c.id AND c.content LIKE '%Klasifikasi website lama: SETIAP_SAAT.%';
