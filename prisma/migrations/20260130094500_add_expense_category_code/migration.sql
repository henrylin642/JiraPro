-- AlterTable
ALTER TABLE "ExpenseCategory" ADD COLUMN "code" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "ExpenseCategory_code_key" ON "ExpenseCategory"("code");
