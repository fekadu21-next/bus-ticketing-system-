import prisma, { connectDB, disconnectDB } from '../Config/db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function run() {
  await connectDB();
  console.log('Connected to DB. Applying notifications migration...');
  const migrationPath = path.join(__dirname, '../prisma/migrations/20261017000000_add_notifications_model/migration.sql');
  const sql = fs.readFileSync(migrationPath, 'utf8');

  // Split into statements safely
  const statements = [
    `CREATE TABLE IF NOT EXISTS "notifications" (
        "id" UUID NOT NULL DEFAULT gen_random_uuid(),
        "user_id" UUID NOT NULL,
        "type" VARCHAR(50) NOT NULL,
        "priority" VARCHAR(20) NOT NULL DEFAULT 'NORMAL',
        "title" VARCHAR(200) NOT NULL,
        "message" TEXT NOT NULL,
        "metadata" JSONB,
        "read_at" TIMESTAMPTZ(6),
        "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
    );`,
    `CREATE INDEX IF NOT EXISTS "notifications_user_id_idx" ON "notifications"("user_id");`,
    `CREATE INDEX IF NOT EXISTS "notifications_user_id_read_at_idx" ON "notifications"("user_id", "read_at");`,
    `CREATE INDEX IF NOT EXISTS "notifications_user_id_created_at_idx" ON "notifications"("user_id", "created_at");`,
    `CREATE INDEX IF NOT EXISTS "notifications_type_idx" ON "notifications"("type");`,
    `DO $$
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'notifications_user_id_fkey' OR conname = 'fk_notifications_user') THEN
            ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
    END $$;`
  ];

  for (const stmt of statements) {
    try {
      await prisma.$executeRawUnsafe(stmt);
      console.log('Executed statement successfully');
    } catch (err) {
      console.error('Error executing statement:', stmt, err.message);
      throw err;
    }
  }

  console.log('Notifications migration applied successfully!');
  await disconnectDB();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
