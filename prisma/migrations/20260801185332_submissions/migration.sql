-- AlterTable
ALTER TABLE "Round" ADD COLUMN     "allowSubmissions" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "submissionsCloseAt" TIMESTAMP(3),
ADD COLUMN     "submissionsOpenAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "Submission" (
    "id" TEXT NOT NULL,
    "registrationId" TEXT NOT NULL,
    "roundId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Submission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Submission_roundId_idx" ON "Submission"("roundId");

-- CreateIndex
CREATE UNIQUE INDEX "Submission_registrationId_roundId_key" ON "Submission"("registrationId", "roundId");

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "Registration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "Round"("id") ON DELETE CASCADE ON UPDATE CASCADE;
