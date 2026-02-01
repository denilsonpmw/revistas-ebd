/*
  Warnings:

  - You are about to drop the column `magazineType` on the `Order` table. All the data in the column will be lost.
  - Added the required column `magazineId` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Made the column `unitPrice` on table `Order` required. This step will fail if there are existing NULL values in that column.
  - Made the column `totalValue` on table `Order` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Order" DROP COLUMN "magazineType",
ADD COLUMN     "magazineId" TEXT NOT NULL,
ALTER COLUMN "unitPrice" SET NOT NULL,
ALTER COLUMN "totalValue" SET NOT NULL;

-- DropEnum
DROP TYPE "MagazineType";

-- CreateTable
CREATE TABLE "Magazine" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ageGroup" TEXT NOT NULL,
    "unitPrice" DECIMAL(65,30) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Magazine_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Magazine_code_key" ON "Magazine"("code");

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_magazineId_fkey" FOREIGN KEY ("magazineId") REFERENCES "Magazine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
