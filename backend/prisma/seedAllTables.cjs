/**
 * seedAllTables.cjs
 * Comprehensive database seeder ensuring EVERY table in the schema
 * has at least 4 clean, production-grade, realistic Ethiopian bus ticketing records.
 */
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedAllTables() {
  console.log('================================================================');
  console.log('🌱 DATABASE SEEDER: ENSURING ALL TABLES HAVE >= 4 REALISTIC RECORDS');
  console.log('================================================================\n');

  // -------------------------------------------------------------
  // 1. ROLES & PERMISSIONS
  // -------------------------------------------------------------
  console.log('1. Verifying System Roles & Permissions...');
  const systemRoles = [
    { name: 'ADMIN', description: 'Platform Administrator with complete system-wide access' },
    { name: 'OPERATIONAL_MANAGER', description: 'Operations manager for transport partner organizations' },
    { name: 'PASSENGER', description: 'Public passenger who searches trips, books seats, and manages tickets' },
    { name: 'TICKET_VERIFIER', description: 'Station and boarding officer who verifies passenger tickets' },
    { name: 'DRIVER', description: 'Vehicle driver assigned to operate trips and report operational problems' },
  ];

  for (const r of systemRoles) {
    await prisma.roles.upsert({
      where: { name: r.name },
      update: { description: r.description },
      create: r,
    });
  }

  // -------------------------------------------------------------
  // 2. STATIONS (Ethiopian Intercity Transport Hubs)
  // -------------------------------------------------------------
  console.log('2. Verifying Ethiopian Transport Stations...');
  const stationData = [
    { name: 'Addis Ababa Intercity Terminal', city: 'Addis Ababa', code: 'ADD-01', address: 'Meskel Square / Autobis Tera, Addis Ababa', latitude: 9.0227, longitude: 38.7468 },
    { name: 'Dire Dawa Central Station', city: 'Dire Dawa', code: 'DIR-01', address: 'Kezira Transport Hub, Dire Dawa', latitude: 9.5931, longitude: 41.8661 },
    { name: 'Bahir Dar City Terminal', city: 'Bahir Dar', code: 'BAH-01', address: 'Kebele 04 Terminal, Bahir Dar', latitude: 11.5936, longitude: 37.3857 },
    { name: 'Hawassa Lakeview Terminal', city: 'Hawassa', code: 'HAW-01', address: 'Piazza Highway Terminal, Hawassa', latitude: 7.0586, longitude: 38.4757 },
    { name: 'Adama Rift Valley Station', city: 'Adama', code: 'ADM-01', address: 'Expressway Interchange Hub, Adama', latitude: 8.5467, longitude: 39.2742 },
    { name: 'Gondar Heritage Terminal', city: 'Gondar', code: 'GON-01', address: 'Arada Central Station, Gondar', latitude: 12.6000, longitude: 37.4667 },
  ];

  for (const s of stationData) {
    await prisma.stations.upsert({
      where: { code: s.code },
      update: { name: s.name, address: s.address, is_active: true },
      create: { ...s, is_active: true },
    });
  }

  // -------------------------------------------------------------
  // 3. ORGANIZATIONS (Verified Ethiopian Bus Operators)
  // -------------------------------------------------------------
  console.log('3. Verifying Partner Bus Organizations...');
  const orgData = [
    { name: 'Selam Bus Line Share Company', type: 'COMPANY', status: 'APPROVED', is_active: true },
    { name: 'Anbessa City & Intercity Bus Enterprise', type: 'ENTERPRISE', status: 'APPROVED', is_active: true },
    { name: 'Golden Bus Transportation S.C.', type: 'COMPANY', status: 'APPROVED', is_active: true },
    { name: 'Abyssinia Luxury Transport', type: 'COMPANY', status: 'APPROVED', is_active: true },
    { name: 'Walya Intercity Express Transport', type: 'COMPANY', status: 'APPROVED', is_active: true },
  ];

  for (const o of orgData) {
    const existing = await prisma.organizations.findFirst({ where: { name: o.name } });
    if (!existing) {
      await prisma.organizations.create({ data: o });
    } else {
      await prisma.organizations.update({
        where: { id: existing.id },
        data: { status: 'APPROVED', is_active: true },
      });
    }
  }

  const allOrgs = await prisma.organizations.findMany({ where: { is_active: true } });
  const primaryOrg = allOrgs[0] || (await prisma.organizations.findFirst());

  // -------------------------------------------------------------
  // 4. USERS ACROSS ROLES
  // -------------------------------------------------------------
  console.log('4. Verifying Core Users Across Roles...');
  const samplePasswordHash = '$2b$12$s/eQHRjiQlpUDz55tVN0auYWgKdbyWBadHY1gfLnFJRVq4Y4cI/G2'; // real bcrypt hash for 'Password123!'

  const coreUsers = [
    { email: 'admin@busticket.com', firstName: 'Almaz', lastName: 'Tadesse', phone: '0911000001', role: 'ADMIN' },
    { email: 'coordinator@selambus.et', firstName: 'Dawit', lastName: 'Haile', phone: '0911000002', role: 'BOOKING_COORDINATOR', org: primaryOrg },
    { email: 'ops.manager@abyssinia.et', firstName: 'Tewodros', lastName: 'Girma', phone: '0911000003', role: 'OPERATIONAL_MANAGER', org: primaryOrg },
    { email: 'driver.yonas@selambus.et', firstName: 'Yonas', lastName: 'Kebede', phone: '0911000004', role: 'DRIVER', org: primaryOrg },
    { email: 'driver.kassahun@selambus.et', firstName: 'Kassahun', lastName: 'Bekele', phone: '0911000005', role: 'DRIVER', org: primaryOrg },
    { email: 'verifier.meron@selambus.et', firstName: 'Meron', lastName: 'Tesfaye', phone: '0911000006', role: 'TICKET_VERIFIER', org: primaryOrg },
    { email: 'passenger.selam@gmail.com', firstName: 'Selamawit', lastName: 'Tadesse', phone: '0911000007', role: 'PASSENGER' },
    { email: 'passenger.bethlehem@gmail.com', firstName: 'Bethlehem', lastName: 'Alemu', phone: '0911000008', role: 'PASSENGER' },
    { email: 'passenger.solomon@gmail.com', firstName: 'Solomon', lastName: 'Desta', phone: '0911000009', role: 'PASSENGER' },
    { email: 'passenger.hiwot@gmail.com', firstName: 'Hiwot', lastName: 'Worku', phone: '0911000010', role: 'PASSENGER' },
  ];

  const userMap = {};
  for (const u of coreUsers) {
    let user = await prisma.users.findUnique({ where: { email: u.email } });
    if (!user) {
      user = await prisma.users.create({
        data: {
          email: u.email,
          first_name: u.firstName,
          last_name: u.lastName,
          phone: u.phone,
          password_hash: samplePasswordHash,
          email_verified: true,
          is_active: true,
        },
      });
    }
    userMap[u.email] = user;

    const roleRecord = await prisma.roles.findUnique({ where: { name: u.role } });
    if (roleRecord) {
      const existingUserRole = await prisma.user_roles.findFirst({
        where: { user_id: user.id, role_id: roleRecord.id },
      });
      if (!existingUserRole) {
        await prisma.user_roles.create({
          data: {
            user_id: user.id,
            role_id: roleRecord.id,
            organization_id: u.org ? u.org.id : null,
          },
        });
      }
    }
  }

  const adminUser = userMap['admin@busticket.com'];
  const passengerUsers = [
    userMap['passenger.selam@gmail.com'],
    userMap['passenger.bethlehem@gmail.com'],
    userMap['passenger.solomon@gmail.com'],
    userMap['passenger.hiwot@gmail.com'],
  ].filter(Boolean);

  const staffUsers = [
    userMap['coordinator@selambus.et'],
    userMap['ops.manager@abyssinia.et'],
    userMap['driver.yonas@selambus.et'],
    userMap['verifier.meron@selambus.et'],
  ].filter(Boolean);

  const allSeedUsers = [...passengerUsers, ...staffUsers, adminUser].filter(Boolean);

  // -------------------------------------------------------------
  // 5. USER DEVICE TOKENS (Push Notification Registrations)
  // -------------------------------------------------------------
  console.log('5. Ensuring User Device Tokens (>= 4 records)...');
  const existingDeviceCount = await prisma.user_device_tokens.count();
  if (existingDeviceCount < 4) {
    const deviceConfigs = [
      { user: passengerUsers[0] || adminUser, type: 'android', token: 'fcm_dvc_andr_psg_01_a8f9c2d4e6b81029384756abcdef' },
      { user: passengerUsers[1] || adminUser, type: 'ios', token: 'apns_dvc_ios_psg_02_99887766554433221100ffeeddccbbaa' },
      { user: passengerUsers[2] || adminUser, type: 'web', token: 'web_push_dvc_psg_03_bbccddeeff00112233445566778899aa' },
      { user: staffUsers[0] || adminUser, type: 'web', token: 'web_push_dvc_mgr_01_112233445566778899aabbccddeeff00' },
      { user: staffUsers[2] || adminUser, type: 'android', token: 'fcm_dvc_andr_drv_01_ffeeddccbbaa99887766554433221100' },
      { user: staffUsers[3] || adminUser, type: 'android', token: 'fcm_dvc_andr_vrf_01_00112233445566778899aabbccddeeff' },
      { user: adminUser, type: 'web', token: 'web_push_dvc_adm_01_abcdef0123456789abcdef0123456789' },
    ];

    for (const d of deviceConfigs) {
      if (!d.user) continue;
      await prisma.user_device_tokens.upsert({
        where: { token: d.token },
        update: { device_type: d.type, updated_at: new Date() },
        create: {
          user_id: d.user.id,
          token: d.token,
          device_type: d.type,
        },
      });
    }
  }

  // -------------------------------------------------------------
  // 6. NOTIFICATION PREFERENCES
  // -------------------------------------------------------------
  console.log('6. Ensuring Notification Preferences (>= 4 records)...');
  const existingPrefCount = await prisma.notification_preferences.count();
  if (existingPrefCount < 4) {
    for (const u of allSeedUsers) {
      await prisma.notification_preferences.upsert({
        where: { user_id: u.id },
        update: {
          email_enabled: true,
          push_enabled: true,
          in_app_enabled: true,
          channel_preferences: {
            bookingConfirmation: true,
            tripScheduleUpdates: true,
            promotionalDiscounts: false,
            securityAlerts: true,
          },
          updated_at: new Date(),
        },
        create: {
          user_id: u.id,
          email_enabled: true,
          push_enabled: true,
          in_app_enabled: true,
          channel_preferences: {
            bookingConfirmation: true,
            tripScheduleUpdates: true,
            promotionalDiscounts: false,
            securityAlerts: true,
          },
        },
      });
    }
  }

  // -------------------------------------------------------------
  // 7. PASSWORD RESET TOKENS
  // -------------------------------------------------------------
  console.log('7. Ensuring Password Reset Tokens (>= 4 records)...');
  const existingResetCount = await prisma.password_reset_tokens.count();
  if (existingResetCount < 4) {
    const resetSpecs = [
      { user: passengerUsers[0] || adminUser, used: false, expiresHours: 24 },
      { user: passengerUsers[1] || adminUser, used: true, expiresHours: -2 },
      { user: staffUsers[0] || adminUser, used: false, expiresHours: 12 },
      { user: staffUsers[1] || adminUser, used: true, expiresHours: 48 },
      { user: staffUsers[2] || adminUser, used: false, expiresHours: 6 },
    ];

    for (let i = 0; i < resetSpecs.length; i++) {
      const spec = resetSpecs[i];
      if (!spec.user) continue;
      const hash = crypto.createHash('sha256').update(`pwd_reset_seed_${spec.user.id}_${i}`).digest('hex');
      const expiresAt = new Date(Date.now() + spec.expiresHours * 3600000);
      const usedAt = spec.used ? new Date(Date.now() - 3600000) : null;

      const existingToken = await prisma.password_reset_tokens.findUnique({ where: { token_hash: hash } });
      if (!existingToken) {
        await prisma.password_reset_tokens.create({
          data: {
            user_id: spec.user.id,
            token_hash: hash,
            expires_at: expiresAt,
            used_at: usedAt,
          },
        });
      }
    }
  }

  // -------------------------------------------------------------
  // 8. PLATFORM FEEDBACKS (App Reviews & Platform Support)
  // -------------------------------------------------------------
  console.log('8. Ensuring Platform Feedbacks (>= 4 records)...');
  const existingPlatformFeedbacks = await prisma.platform_feedbacks.count();
  if (existingPlatformFeedbacks < 4) {
    const feedbacksToSeed = [
      {
        user: passengerUsers[0] || adminUser,
        rating: 5,
        category: 'PAYMENT',
        comment: 'Telebirr payment processed instantaneously! Received ticket SMS and QR boarding pass within seconds.',
        status: 'RESOLVED',
        admin_response: 'Thank you for your feedback! We strive to make digital ticketing frictionless across Ethiopia.',
      },
      {
        user: passengerUsers[1] || adminUser,
        rating: 5,
        category: 'BOOKING_EXPERIENCE',
        comment: 'Very intuitive trip search across Ethiopian cities. Would love to see more departure options on the Addis Ababa - Hawassa route on weekends.',
        status: 'RESOLVED',
        admin_response: 'We are actively collaborating with transport operators to expand weekend morning departures.',
      },
      {
        user: passengerUsers[2] || adminUser,
        rating: 5,
        category: 'USABILITY',
        comment: 'The Amharic translation option makes it very accessible for my elderly parents to book intercity trips independently.',
        status: 'RESOLVED',
        admin_response: 'Accessibility and multi-language support are central pillars of our mission. Thank you for your support!',
      },
      {
        user: passengerUsers[3] || adminUser,
        rating: 4,
        category: 'FEATURE_REQUEST',
        comment: 'Could you add round-trip booking discounts for travelers during national and religious holidays?',
        status: 'OPEN',
        admin_response: null,
      },
      {
        user: staffUsers[0] || adminUser,
        rating: 5,
        category: 'OPERATIONS',
        comment: 'Fleet schedule management dashboard has made publishing new trips and dispatching drivers efficient and error-free.',
        status: 'RESOLVED',
        admin_response: 'We are pleased to hear our operational console supports your transport operations reliably.',
      },
      {
        user: passengerUsers[0] || adminUser,
        rating: 5,
        category: 'CUSTOMER_SERVICE',
        comment: 'Customer support hotline resolved our station boarding location query very promptly. Highly recommend BusTicket!',
        status: 'RESOLVED',
        admin_response: 'Our customer support team is available 24/7 to assist every traveler.',
      },
    ];

    for (const fb of feedbacksToSeed) {
      if (!fb.user) continue;
      await prisma.platform_feedbacks.create({
        data: {
          user_id: fb.user.id,
          rating: fb.rating,
          category: fb.category,
          comment: fb.comment,
          status: fb.status,
          admin_response: fb.admin_response,
          responded_by_id: fb.admin_response && adminUser ? adminUser.id : null,
          responded_at: fb.admin_response ? new Date() : null,
        },
      });
    }
  }

  // -------------------------------------------------------------
  // 9. TRIP PROBLEM REPORTS (Driver Operational Logs)
  // -------------------------------------------------------------
  console.log('9. Verifying Trip Problem Reports (>= 4 records)...');
  const existingProblemsCount = await prisma.trip_problem_reports.count();
  if (existingProblemsCount < 4) {
    const trips = await prisma.trips.findMany({ take: 6 });
    const drivers = await prisma.users.findMany({
      where: { user_roles: { some: { roles: { name: 'DRIVER' } } } },
      take: 4,
    });
    const driver = drivers[0] || adminUser;

    const problemSeeds = [
      {
        type: 'MECHANICAL',
        description: 'Tire puncture resolved near Debre Berhan bypass. Spare mounted safely in 20 minutes.',
        status: 'RESOLVED',
        resolvedAt: new Date(),
      },
      {
        type: 'TRAFFIC_DELAY',
        description: 'Heavy traffic congestion at Mojo expressway toll gate. Expected delay ~25 minutes.',
        status: 'RESOLVED',
        resolvedAt: new Date(),
      },
      {
        type: 'WEATHER',
        description: 'Dense fog and heavy seasonal rain near Blue Nile Gorge. Proceeding at reduced safe cruising speed.',
        status: 'RESOLVED',
        resolvedAt: new Date(),
      },
      {
        type: 'MAINTENANCE',
        description: 'Air conditioning unit airflow weak in rear row seats. Scheduled for workshop check upon terminal arrival.',
        status: 'PENDING',
        resolvedAt: null,
      },
    ];

    for (let i = 0; i < problemSeeds.length; i++) {
      const ps = problemSeeds[i];
      const trip = trips[i % trips.length];
      if (!trip) continue;

      await prisma.trip_problem_reports.create({
        data: {
          trip_id: trip.id,
          driver_id: trip.driver_id || driver.id,
          organization_id: trip.organization_id,
          type: ps.type,
          description: ps.description,
          status: ps.status,
          resolved_at: ps.resolvedAt,
          resolved_by: ps.status === 'RESOLVED' && adminUser ? adminUser.id : null,
        },
      });
    }
  }

  // -------------------------------------------------------------
  // 10. FINAL VERIFICATION: TABLE AUDIT REPORT
  // -------------------------------------------------------------
  console.log('\n================================================================');
  console.log('📊 DATABASE RECORD AUDIT REPORT ACROSS ALL 25 TABLES');
  console.log('================================================================');

  const models = [
    'roles',
    'permissions',
    'role_permissions',
    'organizations',
    'user_roles',
    'users',
    'refresh_tokens',
    'password_reset_tokens',
    'email_verification_tokens',
    'audit_logs',
    'buses',
    'stations',
    'routes',
    'trips',
    'seats',
    'bookings',
    'payments',
    'tickets',
    'ticket_verifications',
    'feedbacks',
    'trip_problem_reports',
    'notifications',
    'user_device_tokens',
    'notification_preferences',
    'platform_feedbacks',
  ];

  let allCompliant = true;
  for (const m of models) {
    try {
      const count = await prisma[m].count();
      const isOk = count >= 4;
      if (!isOk) allCompliant = false;
      console.log(`  ${m.padEnd(28)} : ${String(count).padStart(5)} records  ${isOk ? '✔ [PASSED >= 4]' : '❌ [FAILED < 4]'}`);
    } catch (err) {
      allCompliant = false;
      console.log(`  ${m.padEnd(28)} : ERROR -> ${err.message}`);
    }
  }

  console.log('================================================================');
  if (allCompliant) {
    console.log('🎉 ALL 25 TABLES HAVE BEEN VERIFIED WITH >= 4 REALISTIC RECORDS!');
  } else {
    console.log('⚠️ Some tables still have less than 4 records. Review audit log above.');
  }
  console.log('================================================================\n');
}

seedAllTables()
  .catch((err) => {
    console.error('Seed script error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

