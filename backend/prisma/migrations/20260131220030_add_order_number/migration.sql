/*
  Warnings:

  - You are about to drop the column `deliveryDate` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `magazineId` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `quantity` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `totalValue` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `unitPrice` on the `Order` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_magazineId_fkey";

-- AlterTable
ALTER TABLE "Order" DROP COLUMN "deliveryDate",
DROP COLUMN "magazineId",
DROP COLUMN "quantity",
DROP COLUMN "totalValue",
DROP COLUMN "unitPrice",
ADD COLUMN     "number" SERIAL NOT NULL,
ALTER COLUMN "periodId" DROP DEFAULT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "magazineId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL(65,30) NOT NULL,
    "totalValue" DECIMAL(65,30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_magazineId_fkey" FOREIGN KEY ("magazineId") REFERENCES "Magazine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
