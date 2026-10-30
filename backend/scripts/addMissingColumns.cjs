const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Adding missing columns to payments table...');
  await prisma.$executeRawUnsafe(`
    ALTER TABLE public.payments 
    ADD COLUMN IF NOT EXISTS provider VARCHAR(50),
    ADD COLUMN IF NOT EXISTS provider_transaction_id VARCHAR(150),
    ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ(6);
  `);
  console.log('Payments columns updated!');

  // Check bookings table
  console.log('Checking bookings table columns...');
  await prisma.$executeRawUnsafe(`
    ALTER TABLE public.bookings 
    ADD COLUMN IF NOT EXISTS dropoff_location VARCHAR(200),
    ADD COLUMN IF NOT EXISTS pickup_location VARCHAR(200);
  `);

  console.log('All missing columns added successfully!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
