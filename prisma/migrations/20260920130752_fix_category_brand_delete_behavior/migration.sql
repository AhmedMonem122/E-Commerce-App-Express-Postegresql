-- DropForeignKey
ALTER TABLE "Brand" DROP CONSTRAINT "Brand_categoryId_fkey";

-- AlterTable
ALTER TABLE "Brand" ALTER COLUMN "categoryId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Brand" ADD CONSTRAINT "Brand_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
