-- AlterTable
ALTER TABLE "user_roles" ADD COLUMN IF NOT EXISTS "id" UUID NOT NULL DEFAULT gen_random_uuid();

-- AlterPrimaryKey
ALTER TABLE "user_roles" DROP CONSTRAINT IF EXISTS "user_roles_pkey";
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "user_roles_user_role_org_unique" 
ON "user_roles"("user_id", "role_id", COALESCE("organization_id", '00000000-0000-0000-0000-000000000000'::uuid));
