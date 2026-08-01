-- AlterTable
ALTER TABLE "Profile" ADD COLUMN     "smsOptIn" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "RateLimit" (
    "bucket" TEXT NOT NULL,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RateLimit_pkey" PRIMARY KEY ("bucket","windowStart")
);

-- CreateTable
CREATE TABLE "PageViewDaily" (
    "day" DATE NOT NULL,
    "path" TEXT NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PageViewDaily_pkey" PRIMARY KEY ("day","path")
);

-- CreateTable
CREATE TABLE "VisitorDaily" (
    "day" DATE NOT NULL,
    "visitorHash" TEXT NOT NULL,

    CONSTRAINT "VisitorDaily_pkey" PRIMARY KEY ("day","visitorHash")
);

-- CreateTable
CREATE TABLE "ReferrerDaily" (
    "day" DATE NOT NULL,
    "host" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ReferrerDaily_pkey" PRIMARY KEY ("day","host")
);

-- CreateTable
CREATE TABLE "WebVitalDaily" (
    "day" DATE NOT NULL,
    "metric" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "total" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "good" INTEGER NOT NULL DEFAULT 0,
    "fair" INTEGER NOT NULL DEFAULT 0,
    "poor" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "WebVitalDaily_pkey" PRIMARY KEY ("day","metric")
);

-- CreateIndex
CREATE INDEX "RateLimit_expiresAt_idx" ON "RateLimit"("expiresAt");

-- CreateIndex
CREATE INDEX "PageViewDaily_day_idx" ON "PageViewDaily"("day");

-- CreateIndex
CREATE INDEX "VisitorDaily_day_idx" ON "VisitorDaily"("day");

-- CreateIndex
CREATE INDEX "ReferrerDaily_day_idx" ON "ReferrerDaily"("day");

-- CreateIndex
CREATE INDEX "WebVitalDaily_day_idx" ON "WebVitalDaily"("day");
