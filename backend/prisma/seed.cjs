const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed...');

  // Seed main stations in Ethiopia
  const stations = [
    {
      name: 'Addis Ababa Intercity Terminal',
      city: 'Addis Ababa',
      code: 'ADD-01',
      address: 'Meskel Square, Addis Ababa, Ethiopia',
      latitude: 9.1450,
      longitude: 38.7400,
      is_active: true,
    },
    {
      name: 'Dire Dawa Bus Station',
      city: 'Dire Dawa',
      code: 'DIR-01',
      address: 'Central Bus Station, Dire Dawa, Ethiopia',
      latitude: 9.5914,
      longitude: 41.8667,
      is_active: true,
    },
    {
      name: 'Bahir Dar Terminal',
      city: 'Bahir Dar',
      code: 'BAH-01',
      address: 'Main Bus Terminal, Bahir Dar, Ethiopia',
      latitude: 11.5936,
      longitude: 37.3857,
      is_active: true,
    },
    {
      name: 'Mekelle Bus Station',
      city: 'Mekelle',
      code: 'MEK-01',
      address: 'Central Terminal, Mekelle, Ethiopia',
      latitude: 13.4967,
      longitude: 39.4625,
      is_active: true,
    },
    {
      name: 'Awassa Terminal',
      city: 'Awassa',
      code: 'AWS-01',
      address: 'Bus Terminal, Awassa, Ethiopia',
      latitude: 7.0586,
      longitude: 38.4757,
      is_active: true,
    },
    {
      name: 'Adama/Nazret Bus Station',
      city: 'Adama',
      code: 'ADM-01',
      address: 'Main Terminal, Adama, Ethiopia',
      latitude: 8.5467,
      longitude: 39.2742,
      is_active: true,
    },
    {
      name: 'Jimma Terminal',
      city: 'Jimma',
      code: 'JIM-01',
      address: 'Bus Station, Jimma, Ethiopia',
      latitude: 7.6694,
      longitude: 36.8336,
      is_active: true,
    },
    {
      name: 'Gondar Bus Station',
      city: 'Gondar',
      code: 'GON-01',
      address: 'Central Terminal, Gondar, Ethiopia',
      latitude: 12.5500,
      longitude: 37.4333,
      is_active: true,
    },
    {
      name: 'Dessie Terminal',
      city: 'Dessie',
      code: 'DES-01',
      address: 'Bus Station, Dessie, Ethiopia',
      latitude: 11.1333,
      longitude: 39.6333,
      is_active: true,
    },
    {
      name: 'Shashemene Bus Station',
      city: 'Shashemene',
      code: 'SHA-01',
      address: 'Terminal, Shashemene, Ethiopia',
      latitude: 7.1956,
      longitude: 38.6000,
      is_active: true,
    },
  ];

  for (const station of stations) {
    const existing = await prisma.stations.findUnique({
      where: { code: station.code },
    });

    if (!existing) {
      await prisma.stations.create({
        data: station,
      });
      console.log(`Created station: ${station.name} (${station.code})`);
    } else {
      console.log(`Station already exists: ${station.name} (${station.code})`);
    }
  }

  // Ensure every system role exists (DRIVER included)
  const systemRoles = [
    { name: 'ADMIN', description: 'Platform Administrator with complete system-wide access' },
    { name: 'BOOKING_COORDINATOR', description: 'Manager for organization bus schedules, trips, fleet, and bookings' },
    { name: 'OPERATIONAL_MANAGER', description: 'Operations manager for an organization' },
    { name: 'PASSENGER', description: 'Public passenger who searches trips, books, and manages tickets' },
    { name: 'TICKET_VERIFIER', description: 'Station or boarding officer who verifies passenger tickets for an organization' },
    { name: 'DRIVER', description: 'Vehicle driver assigned to operate trips and report operational problems' },
  ];

  for (const role of systemRoles) {
    const existingRole = await prisma.roles.findUnique({ where: { name: role.name } });
    if (!existingRole) {
      await prisma.roles.create({ data: role });
      console.log(`Created role: ${role.name}`);
    }
  }

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
