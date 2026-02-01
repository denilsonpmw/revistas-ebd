-- CreateTable
CREATE TABLE "Period" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Period_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Period_code_key" ON "Period"("code");

-- Insert default period
INSERT INTO "Period" ("id", "code", "name", "startDate", "endDate", "createdAt", "updatedAt")
VALUES ('default-period', '1T2026', '1º Trimestre 2026', NOW(), NOW() + interval '3 months', NOW(), NOW());

-- AlterTable
ALTER TABLE "Order" DROP COLUMN "period",
ADD COLUMN     "periodId" TEXT NOT NULL DEFAULT 'default-period';

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "Period"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
