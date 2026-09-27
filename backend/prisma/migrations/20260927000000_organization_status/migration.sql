-- AlterTable
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "status" VARCHAR(30) NOT NULL DEFAULT 'PENDING';

-- Update existing organizations to APPROVED
UPDATE "organizations" SET "status" = 'APPROVED' WHERE "status" = 'PENDING' AND "is_active" = true;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "organizations_status_idx" ON "organizations"("status");
CREATE INDEX IF NOT EXISTS "organizations_type_idx" ON "organizations"("type");
