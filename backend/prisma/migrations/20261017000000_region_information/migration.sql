-- CreateTable
CREATE TABLE "StatisticSnapshot" (
    "id" UUID NOT NULL,
    "period" VARCHAR(7) NOT NULL,
    "source" VARCHAR(300) NOT NULL,
    "referenceDate" DATE NOT NULL,
    "population" INTEGER,
    "male" INTEGER,
    "female" INTEGER,
    "households" INTEGER,
    "rt" INTEGER,
    "rw" INTEGER,
    "status" "PublicationStatus" NOT NULL DEFAULT 'DRAFT',
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StatisticSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Facility" (
    "id" UUID NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "description" TEXT NOT NULL,
    "category" VARCHAR(100) NOT NULL,
    "location" VARCHAR(300) NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "photoId" UUID,
    "photoAlt" VARCHAR(300) NOT NULL,
    "status" "PublicationStatus" NOT NULL DEFAULT 'DRAFT',
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Facility_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Potential" (
    "id" UUID NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "description" TEXT NOT NULL,
    "category" VARCHAR(100) NOT NULL,
    "location" VARCHAR(300) NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "photoId" UUID,
    "photoAlt" VARCHAR(300) NOT NULL,
    "status" "PublicationStatus" NOT NULL DEFAULT 'DRAFT',
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Potential_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StatisticSnapshot_period_key" ON "StatisticSnapshot"("period");

-- CreateIndex
CREATE INDEX "StatisticSnapshot_status_period_idx" ON "StatisticSnapshot"("status", "period");

-- CreateIndex
CREATE INDEX "Facility_status_category_idx" ON "Facility"("status", "category");

-- CreateIndex
CREATE INDEX "Potential_status_category_idx" ON "Potential"("status", "category");

-- AddForeignKey
ALTER TABLE "Facility" ADD CONSTRAINT "Facility_photoId_fkey" FOREIGN KEY ("photoId") REFERENCES "MediaAsset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Potential" ADD CONSTRAINT "Potential_photoId_fkey" FOREIGN KEY ("photoId") REFERENCES "MediaAsset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
