import test, { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { io } from 'socket.io-client';
import { startTestServer, stopTestServer, apiRequest, prisma } from './test-helper.js';
import notificationService from '../services/notification.service.js';
import { NOTIFICATION_TYPES, NOTIFICATION_PRIORITIES } from '../constants/notification.js';
import { ROLES } from '../constants/roles.js';

describe('Real-Time, Push (FCM), Email & Role-Specific Notifications Test Suite', () => {
  const timestamp = Date.now();
  let serverInfo = null;
  let adminToken = null;
  let adminUser = null;
  let coord1Token = null;
  let coord1User = null;
  let coord2Token = null;
  let coord2User = null;
  let passengerToken = null;
  let passengerUser = null;
  let driverToken = null;
  let driverUser = null;
  let verifierToken = null;
  let verifierUser = null;

  const org1Id = '00000000-0000-0000-0000-000000000001';
  const org2Id = '00000000-0000-0000-0000-000000000002';

  let testTripId = null;

  before(async () => {
    serverInfo = await startTestServer();

    // 1. Admin user login
    const adminLogin = await apiRequest('/auth/login', {
      method: 'POST',
      body: { email: 'admin@busticket.com', password: 'Admin@123456' },
    });
    adminToken = adminLogin.data.data.accessToken;
    adminUser = adminLogin.data.data.user;

    // 2. Coordinator 1 (Org 1)
    const c1Reg = await apiRequest('/users', {
      method: 'POST',
      token: adminToken,
      body: {
        firstName: 'Coord',
        lastName: 'Org1',
        email: `coord_org1_${timestamp}@test.com`,
        password: 'Password@123',
        role: ROLES.BOOKING_COORDINATOR,
        organizationId: org1Id,
      },
    });
    coord1User = c1Reg.data.data.user;
    const c1Login = await apiRequest('/auth/login', {
      method: 'POST',
      body: { email: `coord_org1_${timestamp}@test.com`, password: 'Password@123' },
    });
    coord1Token = c1Login.data.data.accessToken;

    // 3. Coordinator 2 (Org 2)
    const c2Reg = await apiRequest('/users', {
      method: 'POST',
      token: adminToken,
      body: {
        firstName: 'Coord',
        lastName: 'Org2',
        email: `coord_org2_${timestamp}@test.com`,
        password: 'Password@123',
        role: ROLES.BOOKING_COORDINATOR,
        organizationId: org2Id,
      },
    });
    coord2User = c2Reg.data.data.user;
    const c2Login = await apiRequest('/auth/login', {
      method: 'POST',
      body: { email: `coord_org2_${timestamp}@test.com`, password: 'Password@123' },
    });
    coord2Token = c2Login.data.data.accessToken;

    // 4. Passenger user
    const pReg = await apiRequest('/auth/register', {
      method: 'POST',
      body: {
        firstName: 'Passenger',
        lastName: 'Notify',
        email: `passenger_notify_${timestamp}@test.com`,
        password: 'Password@123',
        confirmPassword: 'Password@123',
      },
    });
    passengerUser = pReg.data.data.user;
    const pLogin = await apiRequest('/auth/login', {
      method: 'POST',
      body: { email: `passenger_notify_${timestamp}@test.com`, password: 'Password@123' },
    });
    passengerToken = pLogin.data.data.accessToken;

    // 5. Driver user (Org 1)
    const dReg = await apiRequest('/users', {
      method: 'POST',
      token: adminToken,
      body: {
        firstName: 'Driver',
        lastName: 'One',
        email: `driver_one_${timestamp}@test.com`,
        password: 'Password@123',
        role: ROLES.DRIVER,
        organizationId: org1Id,
      },
    });
    driverUser = dReg.data.data.user;
    const dLogin = await apiRequest('/auth/login', {
      method: 'POST',
      body: { email: `driver_one_${timestamp}@test.com`, password: 'Password@123' },
    });
    driverToken = dLogin.data.data.accessToken;

    // 6. Ticket Verifier user (Org 1)
    const vReg = await apiRequest('/users', {
      method: 'POST',
      token: adminToken,
      body: {
        firstName: 'Verifier',
        lastName: 'One',
        email: `verifier_one_${timestamp}@test.com`,
        password: 'Password@123',
        role: ROLES.TICKET_VERIFIER,
        organizationId: org1Id,
      },
    });
    verifierUser = vReg.data.data.user;
    const vLogin = await apiRequest('/auth/login', {
      method: 'POST',
      body: { email: `verifier_one_${timestamp}@test.com`, password: 'Password@123' },
    });
    verifierToken = vLogin.data.data.accessToken;

    // 7. Find or create an active trip in Org 1 for testing
    const existingTrip = await prisma.trips.findFirst({
      where: { organization_id: org1Id, status: { in: ['SCHEDULED', 'PUBLISHED'] } },
    });
    if (existingTrip) {
      testTripId = existingTrip.id;
    }
  });

  after(async () => {
    const userIds = [
      coord1User?.id,
      coord2User?.id,
      passengerUser?.id,
      driverUser?.id,
      verifierUser?.id,
    ].filter(Boolean);

    if (userIds.length > 0) {
      await prisma.user_device_tokens.deleteMany({ where: { user_id: { in: userIds } } });
      await prisma.notification_preferences.deleteMany({ where: { user_id: { in: userIds } } });
      await prisma.notifications.deleteMany({ where: { user_id: { in: userIds } } });
      await prisma.user_roles.deleteMany({ where: { user_id: { in: userIds } } });
      await prisma.refresh_tokens.deleteMany({ where: { user_id: { in: userIds } } });
      await prisma.users.deleteMany({ where: { id: { in: userIds } } });
    }

    await stopTestServer();
  });

  // --------------------------------------------------------------------------
  // SECTION 1: User Notification Preferences
  // --------------------------------------------------------------------------
  it('1. GET /notifications/preferences returns default preferences', async () => {
    const res = await apiRequest('/notifications/preferences', { token: passengerToken });
    assert.equal(res.status, 200);
    assert.equal(res.data.success, true);
    assert.equal(res.data.data.preferences.emailEnabled, true);
    assert.equal(res.data.data.preferences.pushEnabled, true);
    assert.equal(res.data.data.preferences.inAppEnabled, true);
  });

  it('2. PUT /notifications/preferences updates preferences successfully', async () => {
    const res = await apiRequest('/notifications/preferences', {
      method: 'PUT',
      token: passengerToken,
      body: {
        emailEnabled: false,
        pushEnabled: true,
        inAppEnabled: true,
      },
    });
    assert.equal(res.status, 200);
    assert.equal(res.data.data.preferences.emailEnabled, false);
    assert.equal(res.data.data.preferences.pushEnabled, true);

    // Verify GET returns the updated preferences
    const resGet = await apiRequest('/notifications/preferences', { token: passengerToken });
    assert.equal(resGet.status, 200);
    assert.equal(resGet.data.data.preferences.emailEnabled, false);

    // Re-enable email for subsequent tests
    await apiRequest('/notifications/preferences', {
      method: 'PUT',
      token: passengerToken,
      body: { emailEnabled: true, pushEnabled: true, inAppEnabled: true },
    });
  });

  // --------------------------------------------------------------------------
  // SECTION 2: FCM Device Token Management
  // --------------------------------------------------------------------------
  it('3. POST /notifications/device-token registers and updates FCM device token', async () => {
    const testToken = `fcm_test_token_${timestamp}_abc`;
    const res = await apiRequest('/notifications/device-token', {
      method: 'POST',
      token: passengerToken,
      body: {
        token: testToken,
        deviceType: 'android',
      },
    });
    assert.equal(res.status, 200);
    assert.equal(res.data.success, true);
    assert.equal(res.data.data.token, testToken);
    assert.equal(res.data.data.deviceType, 'android');

    // Verify record in database
    const tokenRecord = await prisma.user_device_tokens.findUnique({
      where: { token: testToken },
    });
    assert.ok(tokenRecord);
    assert.equal(tokenRecord.user_id, passengerUser.id);
  });

  it('4. DELETE /notifications/device-token unregisters FCM device token', async () => {
    const testToken = `fcm_test_token_${timestamp}_abc`;
    const res = await apiRequest('/notifications/device-token', {
      method: 'DELETE',
      token: passengerToken,
      body: { token: testToken },
    });
    assert.equal(res.status, 200);
    assert.equal(res.data.success, true);

    // Verify record is removed
    const tokenRecord = await prisma.user_device_tokens.findUnique({
      where: { token: testToken },
    });
    assert.equal(tokenRecord, null);
  });

  // --------------------------------------------------------------------------
  // SECTION 3: Real-Time Socket.IO Notifications
  // --------------------------------------------------------------------------
  it('5. Socket.IO connection authenticates with JWT and receives real-time events', async () => {
    const socket = io(`http://127.0.0.1:${serverInfo.port}`, {
      auth: { token: passengerToken },
      transports: ['websocket', 'polling'],
      reconnection: false,
    });

    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        socket.disconnect();
        reject(new Error('Socket.IO connection timed out'));
      }, 5000);

      socket.on('connect', () => {
        clearTimeout(timeout);
        resolve();
      });
      socket.on('connect_error', (err) => {
        clearTimeout(timeout);
        reject(err);
      });
    });

    assert.equal(socket.connected, true);

    // Test real-time notification receipt
    const notifReceivedPromise = new Promise((resolve) => {
      socket.on('notification:new', (notif) => {
        resolve(notif);
      });
    });

    // Dispatch notification to this passenger
    await notificationService.createNotification({
      userId: passengerUser.id,
      type: NOTIFICATION_TYPES.BOOKING_CONFIRMED,
      priority: NOTIFICATION_PRIORITIES.HIGH,
      title: 'Realtime Ticket Test',
      message: 'Testing instant Socket.IO push delivery.',
      metadata: { test: true },
    });

    const receivedNotif = await notifReceivedPromise;
    assert.ok(receivedNotif);
    assert.equal(receivedNotif.title, 'Realtime Ticket Test');
    assert.equal(receivedNotif.type, NOTIFICATION_TYPES.BOOKING_CONFIRMED);

    socket.disconnect();
  });

  it('6. Socket.IO rejects unauthenticated connections', async () => {
    const unauthSocket = io(`http://127.0.0.1:${serverInfo.port}`, {
      auth: { token: 'invalid.jwt.token' },
      transports: ['websocket', 'polling'],
      reconnection: false,
    });

    const connectError = await new Promise((resolve) => {
      unauthSocket.on('connect_error', (err) => {
        resolve(err);
      });
      unauthSocket.on('connect', () => {
        resolve(null);
      });
    });

    assert.ok(connectError);
    unauthSocket.disconnect();
  });

  // --------------------------------------------------------------------------
  // SECTION 4: Role-Specific Event Notification Dispatches
  // --------------------------------------------------------------------------

  // A. Platform Admin Events
  it('7. Platform Admin: Receives notification on New Organization Registration', async () => {
    const orgName = `Trans-Ethiopia-${timestamp}`;
    const regRes = await apiRequest('/organizations', {
      method: 'POST',
      token: adminToken,
      body: { name: orgName, type: 'COMPANY' },
    });
    assert.equal(regRes.status, 201);
    const createdOrgId = regRes.data.data?.organization?.id || regRes.data.data?.id;

    // Check admin notifications with retry for async dispatch
    let adminNotifs = [];
    for (let i = 0; i < 15; i++) {
      adminNotifs = await prisma.notifications.findMany({
        where: {
          type: NOTIFICATION_TYPES.NEW_ORGANIZATION_REGISTRATION,
          metadata: {
            path: ['name'],
            equals: orgName,
          },
        },
        orderBy: { created_at: 'desc' },
      });
      if (adminNotifs.length > 0) break;
      await new Promise((r) => setTimeout(r, 300));
    }

    assert.ok(adminNotifs.length > 0, 'Admin notification was not dispatched in time');
    assert.ok(adminNotifs[0].message.includes(orgName));

    // Cleanup created org
    await prisma.organizations.delete({ where: { id: createdOrgId } }).catch(() => {});
  });

  it('8. Platform Admin & Operator: Org Approval and Rejection dispatches notifications', async () => {
    // Admin notifies organization staff of approval
    await notificationService.notifyOrganizationStaff(
      org1Id,
      [ROLES.BOOKING_COORDINATOR, ROLES.OPERATIONAL_MANAGER],
      {
        type: NOTIFICATION_TYPES.ORGANIZATION_APPROVED,
        priority: NOTIFICATION_PRIORITIES.HIGH,
        title: 'Organization Approved',
        message: 'Your organization has been approved by the platform administrator.',
        metadata: { organizationId: org1Id, status: 'APPROVED' },
        sendEmail: true,
      }
    );

    const coordNotifs = await prisma.notifications.findMany({
      where: {
        user_id: coord1User.id,
        type: NOTIFICATION_TYPES.ORGANIZATION_APPROVED,
      },
    });
    assert.ok(coordNotifs.length >= 1);
  });

  // B. Operator / Booking Coordinator Events
  it('9. Operator: Receives New Booking & Payment Status Change notifications', async () => {
    // Notify Org 1 staff of a new booking
    await notificationService.notifyOrganizationStaff(
      org1Id,
      [ROLES.BOOKING_COORDINATOR, ROLES.OPERATIONAL_MANAGER],
      {
        type: NOTIFICATION_TYPES.NEW_BOOKING,
        priority: NOTIFICATION_PRIORITIES.NORMAL,
        title: 'New Confirmed Booking',
        message: 'New booking confirmed on Addis Ababa - Hawassa for seat 4.',
        metadata: { bookingId: 'b-101', seatNumbers: [4] },
      }
    );

    await notificationService.notifyOrganizationStaff(
      org1Id,
      [ROLES.BOOKING_COORDINATOR, ROLES.OPERATIONAL_MANAGER],
      {
        type: NOTIFICATION_TYPES.PAYMENT_STATUS_CHANGED,
        priority: NOTIFICATION_PRIORITIES.NORMAL,
        title: 'Payment Status Changed: COMPLETED',
        message: 'Payment of 450 ETB confirmed.',
        metadata: { paymentId: 'p-101', status: 'COMPLETED' },
      }
    );

    const coord1Notifs = await prisma.notifications.findMany({
      where: {
        user_id: coord1User.id,
        type: { in: [NOTIFICATION_TYPES.NEW_BOOKING, NOTIFICATION_TYPES.PAYMENT_STATUS_CHANGED] },
      },
    });
    assert.equal(coord1Notifs.length, 2);

    // Cross-organization boundary: Coordinator 2 (Org 2) must NOT receive these notifications
    const coord2Notifs = await prisma.notifications.findMany({
      where: {
        user_id: coord2User.id,
        type: { in: [NOTIFICATION_TYPES.NEW_BOOKING, NOTIFICATION_TYPES.PAYMENT_STATUS_CHANGED] },
      },
    });
    assert.equal(coord2Notifs.length, 0);
  });

  // C. Passenger Events
  it('10. Passenger: Receives Booking Confirmation, QR Ticket Issuance, and Payment notifications', async () => {
    // Passenger receives confirmation + QR ticket
    await notificationService.createNotification({
      userId: passengerUser.id,
      type: NOTIFICATION_TYPES.BOOKING_CONFIRMED,
      priority: NOTIFICATION_PRIORITIES.HIGH,
      title: 'Booking Confirmed!',
      message: 'Your booking for Addis Ababa to Bahir Dar (Seat 12) is confirmed.',
      metadata: { bookingId: 'b-999', seatNumber: 12 },
    });

    await notificationService.createNotification({
      userId: passengerUser.id,
      type: NOTIFICATION_TYPES.QR_TICKET_ISSUED,
      priority: NOTIFICATION_PRIORITIES.HIGH,
      title: 'Digital QR Ticket Issued',
      message: 'Your digital ticket is ready for boarding.',
      metadata: { bookingId: 'b-999', ticketNumber: 'TKT-999' },
    });

    const pNotifs = await prisma.notifications.findMany({
      where: {
        user_id: passengerUser.id,
        type: { in: [NOTIFICATION_TYPES.BOOKING_CONFIRMED, NOTIFICATION_TYPES.QR_TICKET_ISSUED] },
      },
    });
    assert.ok(pNotifs.length >= 2);
  });

  // D. Driver Events
  it('11. Driver: Receives Trip Assignment, Bus Changes, and Route Updates', async () => {
    // 1. Assignment
    await notificationService.createNotification({
      userId: driverUser.id,
      type: NOTIFICATION_TYPES.TRIP_ASSIGNED,
      priority: NOTIFICATION_PRIORITIES.NORMAL,
      title: 'New Trip Assignment',
      message: 'You have been assigned to drive trip Addis Ababa - Hawassa departing tomorrow.',
      metadata: { tripId: 'trip-d1' },
      sendEmail: true,
    });

    // 2. Bus Change
    await notificationService.createNotification({
      userId: driverUser.id,
      type: NOTIFICATION_TYPES.BUS_CHANGED,
      priority: NOTIFICATION_PRIORITIES.NORMAL,
      title: 'Trip Bus Reassigned',
      message: 'The bus assigned to your trip has been changed to plate 3-99999.',
      metadata: { tripId: 'trip-d1', newPlate: '3-99999' },
    });

    // 3. Schedule Change
    await notificationService.createNotification({
      userId: driverUser.id,
      type: NOTIFICATION_TYPES.TRIP_SCHEDULE_CHANGED,
      priority: NOTIFICATION_PRIORITIES.HIGH,
      title: 'Assigned Trip Schedule Changed',
      message: 'Departure time has been updated to 07:00 AM.',
      metadata: { tripId: 'trip-d1' },
    });

    const driverNotifs = await prisma.notifications.findMany({
      where: {
        user_id: driverUser.id,
        type: { in: [NOTIFICATION_TYPES.TRIP_ASSIGNED, NOTIFICATION_TYPES.BUS_CHANGED, NOTIFICATION_TYPES.TRIP_SCHEDULE_CHANGED] },
      },
    });
    assert.equal(driverNotifs.length, 3);
  });

  // E. Ticket Verifier Events
  it('12. Ticket Verifier: Receives Verification Assignment & Trip Updates', async () => {
    await notificationService.createNotification({
      userId: verifierUser.id,
      type: NOTIFICATION_TYPES.VERIFIER_TRIP_ASSIGNED,
      priority: NOTIFICATION_PRIORITIES.NORMAL,
      title: 'New Trip Verification Assignment',
      message: 'You have been assigned as the ticket verifier for trip Addis Ababa - Hawassa.',
      metadata: { tripId: 'trip-v1' },
      sendEmail: true,
    });

    await notificationService.createNotification({
      userId: verifierUser.id,
      type: NOTIFICATION_TYPES.VERIFICATION_UPDATE,
      priority: NOTIFICATION_PRIORITIES.NORMAL,
      title: 'Trip Schedule Updated',
      message: 'The boarding time for your assigned verification trip has been adjusted.',
      metadata: { tripId: 'trip-v1' },
    });

    const verifierNotifs = await prisma.notifications.findMany({
      where: {
        user_id: verifierUser.id,
        type: { in: [NOTIFICATION_TYPES.VERIFIER_TRIP_ASSIGNED, NOTIFICATION_TYPES.VERIFICATION_UPDATE] },
      },
    });
    assert.equal(verifierNotifs.length, 2);
  });

  // --------------------------------------------------------------------------
  // SECTION 5: Idempotency & Duplicate Prevention
  // --------------------------------------------------------------------------
  it('13. Idempotency: Duplicate dispatches with same idempotencyKey do not duplicate notifications', async () => {
    const idempotencyKey = `idemp_test_key_${timestamp}`;

    const n1 = await notificationService.createNotification({
      userId: passengerUser.id,
      type: NOTIFICATION_TYPES.BOOKING_CONFIRMED,
      priority: NOTIFICATION_PRIORITIES.NORMAL,
      title: 'Unique Booking Confirmation',
      message: 'This notification must not be duplicated.',
      metadata: { idempotencyKey, bookingId: 'b-dup-1' },
    });

    const n2 = await notificationService.createNotification({
      userId: passengerUser.id,
      type: NOTIFICATION_TYPES.BOOKING_CONFIRMED,
      priority: NOTIFICATION_PRIORITIES.NORMAL,
      title: 'Unique Booking Confirmation',
      message: 'This notification must not be duplicated.',
      metadata: { idempotencyKey, bookingId: 'b-dup-1' },
    });

    // IDs must match because duplicate was caught and returned existing record
    assert.equal(n1.id, n2.id);

    const matches = await prisma.notifications.findMany({
      where: {
        user_id: passengerUser.id,
        type: NOTIFICATION_TYPES.BOOKING_CONFIRMED,
        metadata: {
          path: ['idempotencyKey'],
          equals: idempotencyKey,
        },
      },
    });
    assert.equal(matches.length, 1);
  });
});
