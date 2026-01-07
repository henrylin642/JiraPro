-- CreateTable
CREATE TABLE "_FeatureToOpportunity" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_FeatureToOpportunity_A_fkey" FOREIGN KEY ("A") REFERENCES "Feature" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_FeatureToOpportunity_B_fkey" FOREIGN KEY ("B") REFERENCES "Opportunity" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "_FeatureToOpportunity_AB_unique" ON "_FeatureToOpportunity"("A", "B");

-- CreateIndex
CREATE INDEX "_FeatureToOpportunity_B_index" ON "_FeatureToOpportunity"("B");
