/*
  Warnings:

  - You are about to drop the column `ageGroup` on the `Magazine` table. All the data in the column will be lost.
  - Added the required column `ageRange` to the `Magazine` table without a default value. This is not possible if the table is not empty.
  - Added the required column `className` to the `Magazine` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Magazine" 
ADD COLUMN     "className" TEXT,
ADD COLUMN     "ageRange" TEXT;

-- Populate className with ageGroup values (they were the same)
UPDATE "Magazine" SET "className" = "ageGroup" WHERE "className" IS NULL;
UPDATE "Magazine" SET "ageRange" = '0' WHERE "ageRange" IS NULL;

-- Now make them NOT NULL
ALTER TABLE "Magazine" 
ALTER COLUMN "className" SET NOT NULL,
ALTER COLUMN "ageRange" SET NOT NULL;

-- Drop old column
ALTER TABLE "Magazine" DROP COLUMN "ageGroup";
