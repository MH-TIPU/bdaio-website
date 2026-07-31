-- AlterTable
ALTER TABLE "Profile" ADD COLUMN     "classGrade" TEXT;

-- CreateTable
CREATE TABLE "GuardianInfo" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "relation" TEXT,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GuardianInfo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GuardianInfo_profileId_key" ON "GuardianInfo"("profileId");

-- AddForeignKey
ALTER TABLE "GuardianInfo" ADD CONSTRAINT "GuardianInfo_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
