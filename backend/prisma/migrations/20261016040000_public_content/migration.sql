-- CreateEnum
CREATE TYPE "ContentKind" AS ENUM ('announcements', 'events', 'galleries', 'documents');

-- CreateTable
CREATE TABLE "ContentItem" (
    "id" UUID NOT NULL,
    "kind" "ContentKind" NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "content" TEXT NOT NULL,
    "status" "PublicationStatus" NOT NULL DEFAULT 'DRAFT',
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Announcement" (
    "contentId" UUID NOT NULL,
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "startsAt" TIMESTAMP(3),
    "expiredAt" TIMESTAMP(3),

    CONSTRAINT "Announcement_pkey" PRIMARY KEY ("contentId")
);

-- CreateTable
CREATE TABLE "Event" (
    "contentId" UUID NOT NULL,
    "start" TIMESTAMP(3) NOT NULL,
    "end" TIMESTAMP(3) NOT NULL,
    "location" VARCHAR(300) NOT NULL,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("contentId")
);

-- CreateTable
CREATE TABLE "Gallery" (
    "contentId" UUID NOT NULL,

    CONSTRAINT "Gallery_pkey" PRIMARY KEY ("contentId")
);

-- CreateTable
CREATE TABLE "GalleryPhoto" (
    "galleryId" UUID NOT NULL,
    "mediaId" UUID NOT NULL,
    "alt" VARCHAR(300) NOT NULL,
    "sortOrder" INTEGER NOT NULL,

    CONSTRAINT "GalleryPhoto_pkey" PRIMARY KEY ("galleryId","mediaId")
);

-- CreateTable
CREATE TABLE "PublicDocument" (
    "contentId" UUID NOT NULL,
    "category" VARCHAR(120) NOT NULL,
    "fileId" UUID NOT NULL,

    CONSTRAINT "PublicDocument_pkey" PRIMARY KEY ("contentId")
);

-- CreateIndex
CREATE INDEX "ContentItem_kind_status_updatedAt_idx" ON "ContentItem"("kind", "status", "updatedAt");

-- CreateIndex
CREATE INDEX "Event_start_end_idx" ON "Event"("start", "end");

-- AddForeignKey
ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "ContentItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "ContentItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Gallery" ADD CONSTRAINT "Gallery_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "ContentItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GalleryPhoto" ADD CONSTRAINT "GalleryPhoto_galleryId_fkey" FOREIGN KEY ("galleryId") REFERENCES "Gallery"("contentId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GalleryPhoto" ADD CONSTRAINT "GalleryPhoto_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "MediaAsset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublicDocument" ADD CONSTRAINT "PublicDocument_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "ContentItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublicDocument" ADD CONSTRAINT "PublicDocument_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "MediaAsset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
