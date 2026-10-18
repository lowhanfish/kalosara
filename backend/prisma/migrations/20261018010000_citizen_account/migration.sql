ALTER TABLE "UserProfile" ADD COLUMN "address" VARCHAR(500);
CREATE TABLE "ContactChange" (
  "id" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "newEmail" VARCHAR(254),
  "newPhone" VARCHAR(20),
  "baseContactHash" CHAR(64) NOT NULL,
  "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ContactChange_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ContactChange_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ContactChange_has_contact" CHECK ("newEmail" IS NOT NULL OR "newPhone" IS NOT NULL)
);
CREATE UNIQUE INDEX "ContactChange_userId_key" ON "ContactChange"("userId");
CREATE INDEX "ContactChange_expiresAt_idx" ON "ContactChange"("expiresAt");
