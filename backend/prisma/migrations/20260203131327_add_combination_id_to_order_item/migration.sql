-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "combinationId" TEXT;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_combinationId_fkey" FOREIGN KEY ("combinationId") REFERENCES "MagazineVariantCombination"("id") ON DELETE SET NULL ON UPDATE CASCADE;
