import prisma, { connectDB, disconnectDB } from '../Config/db.js';

const INITIAL_STATIONS = [
  { name: 'Addis Ababa (Autobis Tera Terminal)', city: 'Addis Ababa', code: 'ADD-01', address: 'Autobis Tera, Merkato, Addis Ababa' },
  { name: 'Addis Ababa (Lamberet Terminal)', city: 'Addis Ababa', code: 'ADD-02', address: 'Lamberet, Yeka Sub-City, Addis Ababa' },
  { name: 'Addis Ababa (Kality Terminal)', city: 'Addis Ababa', code: 'ADD-03', address: 'Kality, Akaki Kality, Addis Ababa' },
  { name: 'Bahir Dar (Central Bus Terminal)', city: 'Bahir Dar', code: 'BJR-01', address: 'Kebele 04, Central Station, Bahir Dar' },
  { name: 'Gondar (Azezo Terminal)', city: 'Gondar', code: 'GDR-01', address: 'Azezo Main Road, Gondar' },
  { name: 'Hawassa (City Intercity Terminal)', city: 'Hawassa', code: 'HWA-01', address: 'Piassa Area near Lake Awassa, Hawassa' },
  { name: 'Dire Dawa (Central Terminal)', city: 'Dire Dawa', code: 'DIR-01', address: 'Kebele 02, Central Station, Dire Dawa' },
  { name: 'Mekelle (Kedamay Weyane Terminal)', city: 'Mekelle', code: 'MEK-01', address: 'Kedamay Weyane, Mekelle' },
  { name: 'Jimma (Central Bus Terminal)', city: 'Jimma', code: 'JMA-01', address: 'Hermata Area, Jimma' },
  { name: 'Dessie (Piazza Terminal)', city: 'Dessie', code: 'DES-01', address: 'Piazza Central Station, Dessie' },
  { name: 'Adama (Wonji Terminal)', city: 'Adama', code: 'ADA-01', address: 'Wonji Road Terminal, Adama' },
  { name: 'Arba Minch (Sikela Terminal)', city: 'Arba Minch', code: 'ARB-01', address: 'Sikela Market Area, Arba Minch' },
  { name: 'Harar (Main Terminal)', city: 'Harar', code: 'HAR-01', address: 'Near Jugol Gate, Harar' },
  { name: 'Shashemene (Awasho Terminal)', city: 'Shashemene', code: 'SHA-01', address: 'Awasho Junction, Shashemene' },
  { name: 'Jigjiga (Central Terminal)', city: 'Jigjiga', code: 'JIG-01', address: 'Main Transport Hub, Jigjiga' },
];

async function main() {
  await connectDB();
  console.log('--- Initializing Stations & Driver Role ---');

  // 1. Create stations table if not exists
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "stations" (
      "id" UUID NOT NULL DEFAULT gen_random_uuid(),
      "name" VARCHAR(150) NOT NULL,
      "city" VARCHAR(100) NOT NULL,
      "code" VARCHAR(20),
      "address" VARCHAR(255),
      "is_active" BOOLEAN NOT NULL DEFAULT true,
      "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "stations_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "uq_stations_name" UNIQUE ("name"),
      CONSTRAINT "uq_stations_code" UNIQUE ("code")
    );
  `);
  console.log('✅ Stations table verified in PostgreSQL.');

  await prisma.$executeRawUnsafe(`
    CREATE UNIQUE INDEX IF NOT EXISTS "uq_stations_name_idx" ON "stations"("name");
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "stations_city_idx" ON "stations"("city");
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "stations_is_active_idx" ON "stations"("is_active");
  `);

  // 2. Insert/Upsert DRIVER role
  const driverRole = await prisma.roles.upsert({
    where: { name: 'DRIVER' },
    update: { description: 'Vehicle driver assigned to operate trips and report operational problems' },
    create: {
      name: 'DRIVER',
      description: 'Vehicle driver assigned to operate trips and report operational problems'
    }
  });
  console.log(`✅ DRIVER role ensured in DB (ID: ${driverRole.id}).`);

  // 3. Seed initial stations
  for (const st of INITIAL_STATIONS) {
    const existing = await prisma.$queryRawUnsafe(
      'SELECT id FROM "stations" WHERE name = $1 OR code = $2',
      st.name,
      st.code
    );
    if (existing.length === 0) {
      await prisma.$executeRawUnsafe(
        `INSERT INTO "stations" ("name", "city", "code", "address", "is_active", "created_at", "updated_at")
         VALUES ($1, $2, $3, $4, true, NOW(), NOW())`,
        st.name,
        st.city,
        st.code,
        st.address
      );
    } else {
      await prisma.$executeRawUnsafe(
        `UPDATE "stations" SET "name" = $1, "city" = $2, "address" = $3, "is_active" = true, "updated_at" = NOW() WHERE "id" = $4::uuid`,
        st.name,
        st.city,
        st.address,
        existing[0].id
      );
    }
  }
  console.log(`✅ ${INITIAL_STATIONS.length} stations initialized.`);

  // Verify counts
  const allRoles = await prisma.roles.findMany({ select: { name: true } });
  console.log('Active roles in DB:', allRoles.map(r => r.name));

  const stationCount = await prisma.$queryRawUnsafe('SELECT COUNT(*) as count FROM "stations"');
  console.log('Stations in DB count:', stationCount[0]?.count);

  await disconnectDB();
  process.exit(0);
}

main().catch((err) => {
  console.error('Setup failed:', err);
  process.exit(1);
});
