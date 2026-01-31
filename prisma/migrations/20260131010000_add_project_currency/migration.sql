-- Add currency to Project
ALTER TABLE "Project" ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'TWD';
