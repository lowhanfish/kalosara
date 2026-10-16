-- CreateTable
CREATE TABLE "SiteSetting" (
    "id" TEXT NOT NULL DEFAULT 'site',
    "value" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Page" (
    "slug" VARCHAR(60) NOT NULL,
    "title" VARCHAR(160) NOT NULL,
    "content" TEXT NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Page_pkey" PRIMARY KEY ("slug")
);

-- CreateTable
CREATE TABLE "Official" (
    "id" UUID NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "position" VARCHAR(160) NOT NULL,
    "unit" VARCHAR(160) NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "photoUrl" VARCHAR(500),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "termStart" DATE,
    "termEnd" DATE,
    "status" VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Official_pkey" PRIMARY KEY ("id")
);
