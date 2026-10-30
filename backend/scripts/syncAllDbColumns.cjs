const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Synchronizing schema columns with PostgreSQL database...');

  // trips columns
  console.log('Checking trips table columns...');
  await prisma.$executeRawUnsafe(`
    ALTER TABLE public.trips 
    ADD COLUMN IF NOT EXISTS verifier_id UUID REFERENCES public.users(id) ON DELETE SET NULL;
  `);

  // tickets columns
  console.log('Checking tickets table columns...');
  await prisma.$executeRawUnsafe(`
    ALTER TABLE public.tickets 
    ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ(6),
    ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES public.users(id) ON DELETE SET NULL;
  `);

  // ticket_verifications table
  console.log('Checking ticket_verifications table...');
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS public.ticket_verifications (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      ticket_id UUID REFERENCES public.tickets(id) ON DELETE SET NULL,
      booking_id UUID,
      trip_id UUID REFERENCES public.trips(id) ON DELETE SET NULL,
      verifier_id UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
      organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
      result VARCHAR(30) NOT NULL,
      notes TEXT,
      created_at TIMESTAMPTZ(6) NOT NULL DEFAULT now()
    );
  `);

  // feedbacks columns
  console.log('Checking feedbacks table columns...');
  await prisma.$executeRawUnsafe(`
    ALTER TABLE public.feedbacks 
    ADD COLUMN IF NOT EXISTS booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS status VARCHAR(30) DEFAULT 'PENDING';
  `);

  // trip_problem_reports table
  console.log('Checking trip_problem_reports table...');
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS public.trip_problem_reports (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
      driver_id UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
      organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
      type VARCHAR(50) NOT NULL,
      description TEXT NOT NULL,
      status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
      created_at TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
      resolved_at TIMESTAMPTZ(6),
      resolved_by UUID REFERENCES public.users(id) ON DELETE SET NULL
    );
  `);

  console.log('Database schema synchronization complete!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
