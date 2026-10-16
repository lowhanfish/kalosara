-- CreateEnum
CREATE TYPE "PublicationStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "MediaVisibility" AS ENUM ('PUBLIC', 'PRIVATE');

-- CreateTable
CREATE TABLE "NewsCategory" (
    "id" UUID NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NewsCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "News" (
    "id" UUID NOT NULL,
    "slug" VARCHAR(180) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "excerpt" VARCHAR(1000) NOT NULL,
    "bodyHtml" TEXT NOT NULL,
    "status" "PublicationStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,
    "authorId" UUID NOT NULL,
    "categoryId" UUID NOT NULL,
    "coverId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "News_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NewsRevision" (
    "id" UUID NOT NULL,
    "newsId" UUID NOT NULL,
    "version" INTEGER NOT NULL,
    "editorId" UUID NOT NULL,
    "snapshot" JSONB NOT NULL,
    "mediaIds" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NewsRevision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MediaAsset" (
    "id" UUID NOT NULL,
    "storageKey" VARCHAR(100) NOT NULL,
    "originalName" VARCHAR(200) NOT NULL,
    "mimeType" VARCHAR(100) NOT NULL,
    "size" INTEGER NOT NULL,
    "alt" VARCHAR(300) NOT NULL,
    "caption" VARCHAR(1000) NOT NULL,
    "visibility" "MediaVisibility" NOT NULL DEFAULT 'PRIVATE',
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "ownerId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MediaAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NewsMedia" (
    "newsId" UUID NOT NULL,
    "mediaId" UUID NOT NULL,

    CONSTRAINT "NewsMedia_pkey" PRIMARY KEY ("newsId","mediaId")
);

-- CreateIndex
CREATE UNIQUE INDEX "NewsCategory_slug_key" ON "NewsCategory"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "News_slug_key" ON "News"("slug");

-- CreateIndex
CREATE INDEX "News_status_updatedAt_idx" ON "News"("status", "updatedAt");

-- CreateIndex
CREATE INDEX "News_categoryId_status_idx" ON "News"("categoryId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "NewsRevision_newsId_version_key" ON "NewsRevision"("newsId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "MediaAsset_storageKey_key" ON "MediaAsset"("storageKey");

-- CreateIndex
CREATE INDEX "MediaAsset_visibility_archived_createdAt_idx" ON "MediaAsset"("visibility", "archived", "createdAt");

-- CreateIndex
CREATE INDEX "MediaAsset_ownerId_idx" ON "MediaAsset"("ownerId");

-- AddForeignKey
ALTER TABLE "News" ADD CONSTRAINT "News_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "News" ADD CONSTRAINT "News_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "NewsCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "News" ADD CONSTRAINT "News_coverId_fkey" FOREIGN KEY ("coverId") REFERENCES "MediaAsset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NewsRevision" ADD CONSTRAINT "NewsRevision_newsId_fkey" FOREIGN KEY ("newsId") REFERENCES "News"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaAsset" ADD CONSTRAINT "MediaAsset_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NewsMedia" ADD CONSTRAINT "NewsMedia_newsId_fkey" FOREIGN KEY ("newsId") REFERENCES "News"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NewsMedia" ADD CONSTRAINT "NewsMedia_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "MediaAsset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
