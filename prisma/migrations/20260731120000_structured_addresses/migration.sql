-- Structured addresses: division → district → upazila → street, for both a
-- present and a permanent address. Institutions gain the same geo fields.
--
-- Written by hand rather than generated so the existing single-line address and
-- district values are CARRIED OVER into the new present-address columns instead
-- of being dropped.

-- AlterTable: Institution gains division + upazila
ALTER TABLE "Institution" ADD COLUMN "division" TEXT,
                          ADD COLUMN "upazila" TEXT;

-- AlterTable: Profile gains the structured address columns
ALTER TABLE "Profile" ADD COLUMN "presentDivision" TEXT,
                      ADD COLUMN "presentDistrict" TEXT,
                      ADD COLUMN "presentUpazila" TEXT,
                      ADD COLUMN "presentAddress" TEXT,
                      ADD COLUMN "permanentDivision" TEXT,
                      ADD COLUMN "permanentDistrict" TEXT,
                      ADD COLUMN "permanentUpazila" TEXT,
                      ADD COLUMN "permanentAddress" TEXT,
                      ADD COLUMN "sameAddress" BOOLEAN NOT NULL DEFAULT false;

-- Preserve existing data: the old free-text district/address become the present
-- address. Districts that do not match a known name are left for the user to
-- re-pick rather than guessed at.
UPDATE "Profile" SET "presentDistrict" = "district" WHERE "district" IS NOT NULL;
UPDATE "Profile" SET "presentAddress" = "addressLine" WHERE "addressLine" IS NOT NULL;

-- Only now drop the superseded columns.
ALTER TABLE "Profile" DROP COLUMN "addressLine",
                      DROP COLUMN "district";
