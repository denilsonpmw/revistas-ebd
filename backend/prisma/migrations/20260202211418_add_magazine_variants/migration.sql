-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "variantData" JSONB;

-- CreateTable
CREATE TABLE "MagazineVariantType" (
    "id" TEXT NOT NULL,
    "magazineId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "required" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MagazineVariantType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MagazineVariantOption" (
    "id" TEXT NOT NULL,
    "variantTypeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "priceAdjustment" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "position" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MagazineVariantOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MagazineVariantCombination" (
    "id" TEXT NOT NULL,
    "magazineId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "variantData" JSONB NOT NULL,
    "price" DECIMAL(65,30) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MagazineVariantCombination_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "MagazineVariantType" ADD CONSTRAINT "MagazineVariantType_magazineId_fkey" FOREIGN KEY ("magazineId") REFERENCES "Magazine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MagazineVariantOption" ADD CONSTRAINT "MagazineVariantOption_variantTypeId_fkey" FOREIGN KEY ("variantTypeId") REFERENCES "MagazineVariantType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MagazineVariantCombination" ADD CONSTRAINT "MagazineVariantCombination_magazineId_fkey" FOREIGN KEY ("magazineId") REFERENCES "Magazine"("id") ON DELETE CASCADE ON UPDATE CASCADE;
