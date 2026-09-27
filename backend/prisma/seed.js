import prisma, { connectDB, disconnectDB } from '../Config/db.js';
import bcrypt from 'bcryptjs';
import { ROLES, PERMISSIONS, ROLE_PERMISSIONS_MAPPING } from '../constants/index.js';

const ROLE_DEFINITIONS = [
  { name: ROLES.ADMIN, description: 'Platform Administrator with complete system-wide access' },
  { name: ROLES.BOOKING_COORDINATOR, description: 'Manager for organization bus schedules, trips, fleet, and bookings' },
  { name: ROLES.PASSENGER, description: 'Public passenger who searches trips, books, and manages tickets' },
  { name: ROLES.TICKET_VERIFIER, description: 'Station or boarding officer who verifies passenger tickets for an organization' },
];

const PERMISSION_DEFINITIONS = [
  { name: PERMISSIONS.MANAGE_USERS, description: 'Create, update, and deactivate users' },
  { name: PERMISSIONS.VIEW_USERS, description: 'View user profiles and list users' },
  { name: PERMISSIONS.MANAGE_ORGANIZATIONS, description: 'Register, edit, and approve bus organizations' },
  { name: PERMISSIONS.VIEW_ORGANIZATIONS, description: 'View organization details' },
  { name: PERMISSIONS.MANAGE_ROLES, description: 'Assign and revoke user roles' },
  { name: PERMISSIONS.VIEW_ROLES, description: 'View roles and their assigned permissions' },
  { name: PERMISSIONS.VIEW_PERMISSIONS, description: 'View system permissions list' },
  { name: PERMISSIONS.VIEW_AUDIT_LOGS, description: 'Access security and system audit logs' },
  { name: PERMISSIONS.CREATE_TRIP, description: 'Schedule and publish bus trips' },
  { name: PERMISSIONS.UPDATE_TRIP, description: 'Modify trip schedules, pricing, and bus assignments' },
  { name: PERMISSIONS.DELETE_TRIP, description: 'Cancel scheduled trips' },
  { name: PERMISSIONS.VIEW_TRIPS, description: 'Browse and search available trips' },
  { name: PERMISSIONS.MANAGE_BUS, description: 'Add, update, and manage bus fleet' },
  { name: PERMISSIONS.VIEW_BUSES, description: 'View buses and vehicle details' },
  { name: PERMISSIONS.VIEW_BOOKINGS, description: 'View passenger bookings and passenger manifests' },
  { name: PERMISSIONS.MANAGE_BOOKINGS, description: 'Modify booking states and refund requests' },
  { name: PERMISSIONS.BOOK_TICKET, description: 'Book seats on scheduled bus trips' },
  { name: PERMISSIONS.CANCEL_TICKET, description: 'Cancel personal booking' },
  { name: PERMISSIONS.VIEW_TICKETS, description: 'View personal tickets and QR passes' },
  { name: PERMISSIONS.VERIFY_TICKET, description: 'Scan and validate boarding tickets' },
];

export async function seedDatabase() {
  await connectDB();
  console.log('🌱 Starting database seed...');

  // 1. Seed Roles
  const roleMap = new Map();
  for (const roleData of ROLE_DEFINITIONS) {
    const role = await prisma.roles.upsert({
      where: { name: roleData.name },
      update: { description: roleData.description },
      create: roleData,
    });
    roleMap.set(role.name, role.id);
  }
  console.log('✅ Roles seeded successfully:', Array.from(roleMap.keys()));

  // 2. Migrate any legacy roles (PLATFORM_ADMIN -> ADMIN, OPERATIONAL_MANAGER -> BOOKING_COORDINATOR)
  const legacyAdminRole = await prisma.roles.findUnique({ where: { name: 'PLATFORM_ADMIN' } });
  if (legacyAdminRole) {
    const newAdminId = roleMap.get(ROLES.ADMIN);
    const legacyUserRoles = await prisma.user_roles.findMany({ where: { role_id: legacyAdminRole.id } });
    for (const ur of legacyUserRoles) {
      await prisma.user_roles.delete({ where: { id: ur.id } });
      await prisma.user_roles.create({
        data: {
          user_id: ur.user_id,
          role_id: newAdminId,
          organization_id: ur.organization_id,
        },
      });
    }
    await prisma.role_permissions.deleteMany({ where: { role_id: legacyAdminRole.id } });
    await prisma.roles.delete({ where: { id: legacyAdminRole.id } });
    console.log('🔄 Migrated legacy PLATFORM_ADMIN to ADMIN');
  }

  const legacyOpManager = await prisma.roles.findUnique({ where: { name: 'OPERATIONAL_MANAGER' } });
  if (legacyOpManager) {
    const newCoordId = roleMap.get(ROLES.BOOKING_COORDINATOR);
    const legacyUserRoles = await prisma.user_roles.findMany({ where: { role_id: legacyOpManager.id } });
    for (const ur of legacyUserRoles) {
      await prisma.user_roles.delete({ where: { id: ur.id } });
      await prisma.user_roles.create({
        data: {
          user_id: ur.user_id,
          role_id: newCoordId,
          organization_id: ur.organization_id,
        },
      });
    }
    await prisma.role_permissions.deleteMany({ where: { role_id: legacyOpManager.id } });
    await prisma.roles.delete({ where: { id: legacyOpManager.id } });
    console.log('🔄 Migrated legacy OPERATIONAL_MANAGER to BOOKING_COORDINATOR');
  }

  // 3. Batch Seed Permissions
  await prisma.permissions.createMany({
    data: PERMISSION_DEFINITIONS,
    skipDuplicates: true,
  });
  const allPermissions = await prisma.permissions.findMany();
  const permissionMap = new Map(allPermissions.map((p) => [p.name, p.id]));
  console.log(`✅ Permissions verified (${allPermissions.length} total)`);

  // 4. Batch Seed Role-Permissions
  const rolePermissionRecords = [];
  for (const [roleName, permNames] of Object.entries(ROLE_PERMISSIONS_MAPPING)) {
    const roleId = roleMap.get(roleName);
    if (!roleId) continue;

    for (const permName of permNames) {
      const permId = permissionMap.get(permName);
      if (!permId) continue;
      rolePermissionRecords.push({ role_id: roleId, permission_id: permId });
    }
  }

  await prisma.role_permissions.createMany({
    data: rolePermissionRecords,
    skipDuplicates: true,
  });
  console.log(`✅ Role-Permissions mapped (${rolePermissionRecords.length} relations)`);

  // 5. Seed Organizations
  await prisma.organizations.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: { is_active: true },
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Selam Bus Line',
      type: 'COMPANY',
      is_active: true,
    },
  });

  await prisma.organizations.upsert({
    where: { id: '00000000-0000-0000-0000-000000000002' },
    update: { is_active: true },
    create: {
      id: '00000000-0000-0000-0000-000000000002',
      name: 'Sky Bus Transport System',
      type: 'COMPANY',
      is_active: true,
    },
  });
  console.log('✅ Organizations verified and seeded');

  // 6. Seed Initial Admin Account
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

  const adminRoleId = roleMap.get(ROLES.ADMIN);
  if (adminRoleId) {
    const existingUserRole = await prisma.user_roles.findFirst({
      where: {
        user_id: adminUser.id,
        role_id: adminRoleId,
      },
    });

    if (!existingUserRole) {
      await prisma.user_roles.create({
        data: {
          user_id: adminUser.id,
          role_id: adminRoleId,
          organization_id: null,
        },
      });
    }
  }
  console.log('✅ Default Platform Admin configured with ADMIN role:', adminEmail);

  console.log('🎉 Seeding complete.');
}

if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  seedDatabase()
    .catch((e) => {
      console.error('Seed error:', e);
      process.exit(1);
    })
    .finally(async () => {
      await disconnectDB();
    });
}
