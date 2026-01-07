-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Feature" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL,
    "riceReach" INTEGER NOT NULL DEFAULT 0,
    "riceImpact" DECIMAL NOT NULL DEFAULT 0,
    "riceConfidence" INTEGER NOT NULL DEFAULT 0,
    "riceEffort" DECIMAL NOT NULL DEFAULT 0,
    "riceScore" DECIMAL NOT NULL DEFAULT 0,
    CONSTRAINT "Feature_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Feature" ("description", "id", "productId", "status", "title") SELECT "description", "id", "productId", "status", "title" FROM "Feature";
DROP TABLE "Feature";
ALTER TABLE "new_Feature" RENAME TO "Feature";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
