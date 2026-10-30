const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Connecting to database...');

  // 1. notifications table
  console.log('Creating notifications table if not exists...');
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS public.notifications (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
      type VARCHAR(50) NOT NULL,
      priority VARCHAR(20) NOT NULL DEFAULT 'NORMAL',
      title VARCHAR(200) NOT NULL,
      message TEXT NOT NULL,
      metadata JSONB,
      read_at TIMESTAMPTZ(6),
      created_at TIMESTAMPTZ(6) NOT NULL DEFAULT now()
    );
  `);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications(user_id, read_at);`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON public.notifications(user_id, created_at);`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);`);

  // 2. user_device_tokens table
  console.log('Creating user_device_tokens table if not exists...');
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS public.user_device_tokens (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
      token VARCHAR(500) NOT NULL UNIQUE,
      device_type VARCHAR(50) NOT NULL DEFAULT 'web',
      created_at TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT now()
    );
  `);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_device_tokens_user ON public.user_device_tokens(user_id);`);

  // 3. notification_preferences table
  console.log('Creating notification_preferences table if not exists...');
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS public.notification_preferences (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
      email_enabled BOOLEAN NOT NULL DEFAULT true,
      push_enabled BOOLEAN NOT NULL DEFAULT true,
      in_app_enabled BOOLEAN NOT NULL DEFAULT true,
      channel_preferences JSONB,
      created_at TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT now()
    );
  `);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_notif_prefs_user ON public.notification_preferences(user_id);`);

  // 4. platform_feedbacks table
  console.log('Creating platform_feedbacks table if not exists...');
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS public.platform_feedbacks (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
      rating SMALLINT NOT NULL,
      category VARCHAR(50) NOT NULL DEFAULT 'OTHER',
      comment TEXT NOT NULL,
      status VARCHAR(30) NOT NULL DEFAULT 'OPEN',
      admin_response TEXT,
      responded_by_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
      responded_at TIMESTAMPTZ(6),
      created_at TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT now()
    );
  `);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_platform_feedback_user ON public.platform_feedbacks(user_id);`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_platform_feedback_status ON public.platform_feedbacks(status);`);

  console.log('All missing tables and indexes created successfully!');
}

main()
  .catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
