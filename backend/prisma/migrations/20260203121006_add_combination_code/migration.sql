/*
  Warnings:

  - A unique constraint covering the columns `[magazineId,code]` on the table `MagazineVariantCombination` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `code` to the `MagazineVariantCombination` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "MagazineVariantCombination" ADD COLUMN "code" TEXT;

-- Atualizar combinações existentes com códigos sequenciais
WITH numbered_combos AS (
  SELECT 
    mvc."id",
    CONCAT(
      SUBSTRING(m."code", 1, 3),
      '-',
      LPAD(ROW_NUMBER() OVER (PARTITION BY mvc."magazineId" ORDER BY mvc."createdAt")::TEXT, 3, '0')
    ) as new_code
  FROM "MagazineVariantCombination" mvc
  LEFT JOIN "Magazine" m ON m."id" = mvc."magazineId"
)
UPDATE "MagazineVariantCombination"
SET "code" = numbered_combos.new_code
FROM numbered_combos
WHERE "MagazineVariantCombination"."id" = numbered_combos."id";

-- Fazer a coluna NOT NULL após preencher os valores
ALTER TABLE "MagazineVariantCombination" ALTER COLUMN "code" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "MagazineVariantCombination_magazineId_code_key" ON "MagazineVariantCombination"("magazineId", "code");
