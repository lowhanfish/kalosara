-- CreateTable
CREATE TABLE "NewsSlugAlias" (
    "slug" VARCHAR(180) NOT NULL,
    "newsId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NewsSlugAlias_pkey" PRIMARY KEY ("slug")
);

-- CreateTable
CREATE TABLE "CacheInvalidation" (
    "id" UUID NOT NULL,
    "tags" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deliveredAt" TIMESTAMP(3),
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CacheInvalidation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "NewsSlugAlias_newsId_idx" ON "NewsSlugAlias"("newsId");

-- CreateIndex
CREATE INDEX "CacheInvalidation_deliveredAt_nextAttemptAt_idx" ON "CacheInvalidation"("deliveredAt", "nextAttemptAt");

-- AddForeignKey
ALTER TABLE "NewsSlugAlias" ADD CONSTRAINT "NewsSlugAlias_newsId_fkey" FOREIGN KEY ("newsId") REFERENCES "News"("id") ON DELETE CASCADE ON UPDATE CASCADE;
