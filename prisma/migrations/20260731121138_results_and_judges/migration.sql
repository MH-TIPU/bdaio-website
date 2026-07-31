-- CreateEnum
CREATE TYPE "Medal" AS ENUM ('GOLD', 'SILVER', 'BRONZE', 'HONOURABLE_MENTION');

-- CreateTable
CREATE TABLE "RoundJudge" (
    "id" TEXT NOT NULL,
    "roundId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RoundJudge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Result" (
    "id" TEXT NOT NULL,
    "registrationId" TEXT NOT NULL,
    "roundId" TEXT NOT NULL,
    "marks" DOUBLE PRECISION,
    "maxMarks" DOUBLE PRECISION,
    "rank" INTEGER,
    "medal" "Medal",
    "remarks" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "scoredById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Result_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RoundJudge_userId_idx" ON "RoundJudge"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "RoundJudge_roundId_userId_key" ON "RoundJudge"("roundId", "userId");

-- CreateIndex
CREATE INDEX "Result_roundId_published_idx" ON "Result"("roundId", "published");

-- CreateIndex
CREATE UNIQUE INDEX "Result_registrationId_roundId_key" ON "Result"("registrationId", "roundId");

-- AddForeignKey
ALTER TABLE "RoundJudge" ADD CONSTRAINT "RoundJudge_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "Round"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoundJudge" ADD CONSTRAINT "RoundJudge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Result" ADD CONSTRAINT "Result_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "Registration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Result" ADD CONSTRAINT "Result_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "Round"("id") ON DELETE CASCADE ON UPDATE CASCADE;
