import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const ROLES = [
  { name: 'PLATFORM_ADMIN', description: 'Platform Administrator with system-wide access' },
  { name: 'OPERATIONAL_MANAGER', description: 'Manager for bus company or transport association operations' },
  { name: 'PASSENGER', description: 'Public passenger who books and manages tickets' },
  { name: 'TICKET_VERIFIER', description: 'Station or boarding officer who verifies passenger tickets' },
];

const PERMISSIONS = [
  { name: 'MANAGE_USERS', description: 'Create, update, and deactivate users' },
  { name: 'MANAGE_ORGANIZATIONS', description: 'Register, edit, and approve bus organizations' },
  { name: 'VIEW_AUDIT_LOGS', description: 'Access security and system audit logs' },
  { name: 'CREATE_TRIP', description: 'Schedule and publish bus trips' },
  { name: 'UPDATE_TRIP', description: 'Modify trip schedules, pricing, and bus assignments' },
  { name: 'DELETE_TRIP', description: 'Cancel scheduled trips' },
  { name: 'VIEW_TRIPS', description: 'Browse and search available trips' },
  { name: 'MANAGE_BUS', description: 'Add, update, and manage bus fleet' },
  { name: 'VIEW_BOOKINGS', description: 'View passenger bookings and passenger manifests' },
  { name: 'MANAGE_BOOKINGS', description: 'Modify booking states and refund requests' },
  { name: 'BOOK_TICKET', description: 'Book seats on scheduled bus trips' },
  { name: 'CANCEL_TICKET', description: 'Cancel personal booking' },
  { name: 'VIEW_TICKETS', description: 'View personal tickets and QR passes' },
  { name: 'VERIFY_TICKET', description: 'Scan and validate boarding tickets' },
];

const ROLE_PERMISSIONS_MAP = {
  PLATFORM_ADMIN: PERMISSIONS.map((p) => p.name),
  OPERATIONAL_MANAGER: [
    'CREATE_TRIP',
    'UPDATE_TRIP',
    'DELETE_TRIP',
    'VIEW_TRIPS',
    'MANAGE_BUS',
    'VIEW_BOOKINGS',
    'MANAGE_BOOKINGS',
    'VERIFY_TICKET',
  ],
  TICKET_VERIFIER: ['VERIFY_TICKET', 'VIEW_TRIPS', 'VIEW_BOOKINGS'],
  PASSENGER: ['VIEW_TRIPS', 'BOOK_TICKET', 'CANCEL_TICKET', 'VIEW_TICKETS'],
};

export async function seedDatabase() {
  console.log('🌱 Starting database seed...');

  // 1. Seed Roles
  const roleMap = new Map();
  for (const roleData of ROLES) {
    const role = await prisma.roles.upsert({
      where: { name: roleData.name },
      update: { description: roleData.description },
      create: roleData,
    });
    roleMap.set(role.name, role.id);
  }
  console.log('✅ Roles seeded successfully');

  // 2. Seed Permissions
  const permissionMap = new Map();
  for (const permData of PERMISSIONS) {
    const perm = await prisma.permissions.upsert({
      where: { name: permData.name },
      update: { description: permData.description },
      create: permData,
    });
    permissionMap.set(perm.name, perm.id);
  }
  console.log('✅ Permissions seeded successfully');

  // 3. Seed Role-Permissions
  for (const [roleName, permNames] of Object.entries(ROLE_PERMISSIONS_MAP)) {
    const roleId = roleMap.get(roleName);
    if (!roleId) continue;

    for (const permName of permNames) {
      const permId = permissionMap.get(permName);
      if (!permId) continue;

      await prisma.role_permissions.upsert({
        where: {
          role_id_permission_id: {
            role_id: roleId,
            permission_id: permId,
          },
        },
        update: {},
        create: {
          role_id: roleId,
          permission_id: permId,
        },
      });
    }
  }
  console.log('✅ Role-Permissions relationships mapped');

  // 4. Seed Seed Organizations
  const selamBus = await prisma.organizations.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Selam Bus Line',
      type: 'COMPANY',
      is_active: true,
    },
  });

  const skyBus = await prisma.organizations.upsert({
    where: { id: '00000000-0000-0000-0000-000000000002' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000002',
      name: 'Sky Bus Transport System',
      type: 'COMPANY',
      is_active: true,
    },
  });
  console.log('✅ Initial organizations seeded');

  // 5. Seed Initial Admin Account
  const adminEmail = 'admin@busticket.com';
  const adminPasswordHash = await bcrypt.hash('Admin@123456', 12);
  const adminUser = await prisma.users.upsert({
    where: { email: adminEmail },
    update: { is_active: true, email_verified: true },
    create: {
      first_name: 'System',
      last_name: 'Administrator',
      email: adminEmail,
      phone: '+251911000000',
      password_hash: adminPasswordHash,
      is_active: true,
      email_verified: true,
      email_verified_at: new Date(),
    },
  });

  const adminRoleId = roleMap.get('PLATFORM_ADMIN');
  if (adminRoleId) {
    await prisma.user_roles.upsert({
      where: {
        user_id_role_id: {
          user_id: adminUser.id,
          role_id: adminRoleId,
        },
      },
      update: {},
      create: {
        user_id: adminUser.id,
        role_id: adminRoleId,
        organization_id: null,
      },
    });
  }
  console.log('✅ Default Platform Admin seeded:', adminEmail);

  console.log('🎉 Seeding complete.');
}

if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  seedDatabase()
    .catch((e) => {
      console.error('Seed error:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
