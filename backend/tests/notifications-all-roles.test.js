import test, { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startTestServer, stopTestServer, apiRequest, prisma } from './test-helper.js';
import { NOTIFICATION_TYPES, NOTIFICATION_PRIORITIES } from '../constants/notification.js';
import { ROLES } from '../constants/roles.js';

describe('All Roles Notifications & Endpoints End-to-End Suite', () => {
  const ts = Date.now();
  let adminToken = null;
  let adminUser = null;
  let coordToken = null;
  let coordUser = null;
  let driverToken = null;
  let driverUser = null;
  let verifierToken = null;
  let verifierUser = null;
  let passengerToken = null;
  let passengerUser = null;

  const orgId = '00000000-0000-0000-0000-000000000001';
  let createdTripId = null;

  before(async () => {
    await startTestServer();

    // 1. Admin login
    const adminLogin = await apiRequest('/auth/login', {
      method: 'POST',
      body: { email: 'admin@busticket.com', password: 'Admin@123456' },
    });
    adminToken = adminLogin.data.data.accessToken;
    adminUser = adminLogin.data.data.user;

    // 2. Coordinator login
    const coordLogin = await apiRequest('/auth/login', {
      method: 'POST',
      body: { email: 'coordinator@busticket.com', password: 'Coordinator@123456' },
    });
    coordToken = coordLogin.data.data.accessToken;
    coordUser = coordLogin.data.data.user;

    // 3. Driver login
    const driverLogin = await apiRequest('/auth/login', {
      method: 'POST',
      body: { email: 'driver@busticket.com', password: 'Driver@123456' },
    });
    driverToken = driverLogin.data.data.accessToken;
    driverUser = driverLogin.data.data.user;

    // 4. Verifier login
    const verifierLogin = await apiRequest('/auth/login', {
      method: 'POST',
      body: { email: 'verifier@busticket.com', password: 'Verifier@123456' },
    });
    verifierToken = verifierLogin.data.data.accessToken;
    verifierUser = verifierLogin.data.data.user;

    // 5. Passenger registration and login
    const passengerEmail = `passenger_notif_${ts}@test.com`;
    await apiRequest('/auth/register', {
      method: 'POST',
      body: {
        firstName: 'Notify',
        lastName: 'Passenger',
        email: passengerEmail,
        password: 'Password@123456',
        confirmPassword: 'Password@123456',
        phone: `09${String(ts).slice(-8)}`,
      },
    });

    const passLogin = await apiRequest('/auth/login', {
      method: 'POST',
      body: { email: passengerEmail, password: 'Password@123456' },
    });
    passengerToken = passLogin.data.data.accessToken;
    passengerUser = passLogin.data.data.user;
  });

  after(async () => {
    await stopTestServer();
  });

  it('1. Coordinator assigns Driver & Verifier to Trip -> Driver & Verifier receive notifications', async () => {
    // Fetch routes and buses in org
    const routesRes = await apiRequest('/coordinator/routes', { token: coordToken });
    const busesRes = await apiRequest('/coordinator/buses', { token: coordToken });

    const routeId = routesRes.data.data.routes?.[0]?.id;
    const busId = busesRes.data.data.buses?.[0]?.id;

    assert.ok(routeId, 'Route exists');
    assert.ok(busId, 'Bus exists');

    const uniqueFutureOffset = Date.now() + 86400000 * 30 + Math.floor(Math.random() * 500000000);
    const depTime = new Date(uniqueFutureOffset).toISOString();
    const arrTime = new Date(uniqueFutureOffset + 14400000).toISOString();

    const tripRes = await apiRequest('/coordinator/trips', {
      method: 'POST',
      token: coordToken,
      body: {
        busId,
        routeId,
        driverId: driverUser.id,
        verifierId: verifierUser.id,
        departureTime: depTime,
        arrivalTime: arrTime,
        fare: 450,
      },
    });

    assert.equal(tripRes.status, 201, 'Trip created');
    createdTripId = tripRes.data.data.trip.id;

    // Verify Driver notification
    const driverNotifs = await apiRequest('/notifications', { token: driverToken });
    assert.equal(driverNotifs.status, 200);
    const driverHasAssigned = driverNotifs.data.data.notifications.some(
      (n) => n.type === NOTIFICATION_TYPES.TRIP_ASSIGNED
    );
    assert.ok(driverHasAssigned, 'Driver received TRIP_ASSIGNED notification');

    // Verify Verifier notification
    const verifierNotifs = await apiRequest('/notifications', { token: verifierToken });
    assert.equal(verifierNotifs.status, 200);
    const verifierHasAssigned = verifierNotifs.data.data.notifications.some(
      (n) => n.type === NOTIFICATION_TYPES.VERIFIER_TRIP_ASSIGNED
    );
    assert.ok(verifierHasAssigned, 'Verifier received VERIFIER_TRIP_ASSIGNED notification');
  });

  it('2. Driver reports operational problem -> Operator receives DRIVER_PROBLEM_REPORT', async () => {
    const reportRes = await apiRequest(`/driver/trips/${createdTripId}/problems`, {
      method: 'POST',
      token: driverToken,
      body: {
        type: 'OTHER',
        description: 'Tire pressure sensor warning light illuminated before departure.',
      },
    });

    assert.equal(reportRes.status, 201, 'Problem report created');

    // Operator notification check
    const coordNotifs = await apiRequest('/notifications', { token: coordToken });
    assert.equal(coordNotifs.status, 200);
    const coordHasProblemReport = coordNotifs.data.data.notifications.some(
      (n) => n.type === NOTIFICATION_TYPES.DRIVER_PROBLEM_REPORT || n.type === NOTIFICATION_TYPES.TRIP_PROBLEM_REPORTED
    );
    assert.ok(coordHasProblemReport, 'Coordinator/Operator received DRIVER_PROBLEM_REPORT');
  });

  it('3. Driver reports CRITICAL breakdown -> Platform Admin receives CRITICAL_PLATFORM_ISSUE', async () => {
    const criticalReport = await apiRequest(`/driver/trips/${createdTripId}/problems`, {
      method: 'POST',
      token: driverToken,
      body: {
        type: 'ACCIDENT',
        description: 'Minor traffic collision on highway requiring platform incident report.',
      },
    });

    assert.equal(criticalReport.status, 201);

    // Admin notification check
    const adminNotifs = await apiRequest('/notifications', { token: adminToken });
    assert.equal(adminNotifs.status, 200);
    const adminHasCritical = adminNotifs.data.data.notifications.some(
      (n) => n.type === NOTIFICATION_TYPES.CRITICAL_PLATFORM_ISSUE
    );
    assert.ok(adminHasCritical, 'Admin received CRITICAL_PLATFORM_ISSUE notification');
  });

  it('4. Passenger Payment & Ticket issuance -> Passenger & Operator receive notifications', async () => {
    // Initialize payment for seat 1
    const initRes = await apiRequest('/passenger/payments/initialize', {
      method: 'POST',
      token: passengerToken,
      body: {
        tripId: createdTripId,
        seatNumbers: [1],
        paymentMethod: 'TELEBIRR',
        phoneNumber: '0911223344',
      },
    });

    assert.equal(initRes.status, 200);
    const bookingId = initRes.data.data.bookingId || initRes.data.data.booking?.id;
    const txRef = initRes.data.data.transactionReference;

    // Verify/Complete payment
    const verifyRes = await apiRequest('/passenger/payments/verify', {
      method: 'POST',
      token: passengerToken,
      body: {
        bookingId,
        transactionReference: txRef,
        paymentMethod: 'TELEBIRR',
      },
    });

    assert.equal(verifyRes.status, 200);

    // Passenger receives BOOKING_CONFIRMED, PAYMENT_SUCCESS, QR_TICKET_ISSUED
    const passengerNotifs = await apiRequest('/notifications', { token: passengerToken });
    assert.equal(passengerNotifs.status, 200);

    const types = passengerNotifs.data.data.notifications.map((n) => n.type);
    assert.ok(types.includes(NOTIFICATION_TYPES.BOOKING_CONFIRMED), 'Passenger received BOOKING_CONFIRMED');
    assert.ok(types.includes(NOTIFICATION_TYPES.PAYMENT_SUCCESS), 'Passenger received PAYMENT_SUCCESS');
    assert.ok(types.includes(NOTIFICATION_TYPES.QR_TICKET_ISSUED), 'Passenger received QR_TICKET_ISSUED');

    // Operator receives NEW_BOOKING
    const coordNotifs = await apiRequest('/notifications', { token: coordToken });
    const coordHasNewBooking = coordNotifs.data.data.notifications.some(
      (n) => n.type === NOTIFICATION_TYPES.NEW_BOOKING
    );
    assert.ok(coordHasNewBooking, 'Operator received NEW_BOOKING notification');
  });

  it('5. Ticket Verifier scans Passenger Ticket -> Passenger receives TICKET_VERIFIED', async () => {
    // Get ticket for passenger booking
    const bookingsRes = await apiRequest('/passenger/bookings', { token: passengerToken });
    const firstBooking = bookingsRes.data.data.bookings[0];
    const ticketNumber = firstBooking.ticketNumber || firstBooking.ticket?.ticketNumber;

    assert.ok(ticketNumber, 'Ticket number exists');

    // Verifier scans ticket
    const scanRes = await apiRequest('/verifier/tickets/verify', {
      method: 'POST',
      token: verifierToken,
      body: {
        qrCode: ticketNumber,
        tripId: createdTripId,
      },
    });

    assert.equal(scanRes.status, 200);
    assert.equal(scanRes.data.data.valid, true);

    // Passenger receives TICKET_VERIFIED
    const passengerNotifs = await apiRequest('/notifications', { token: passengerToken });
    const hasTicketVerified = passengerNotifs.data.data.notifications.some(
      (n) => n.type === NOTIFICATION_TYPES.TICKET_VERIFIED
    );
    assert.ok(hasTicketVerified, 'Passenger received TICKET_VERIFIED notification');
  });

  it('6. Notification REST APIs: unread count, read single, read all', async () => {
    // Check unread count
    const unreadRes = await apiRequest('/notifications/unread-count', { token: passengerToken });
    assert.equal(unreadRes.status, 200);
    assert.ok(typeof unreadRes.data.data.unreadCount === 'number');
    assert.ok(unreadRes.data.data.unreadCount > 0);

    // List notifications
    const listRes = await apiRequest('/notifications?limit=5', { token: passengerToken });
    assert.equal(listRes.status, 200);
    const firstNotif = listRes.data.data.notifications[0];
    assert.ok(firstNotif);

    // Mark single notification as read
    const readSingle = await apiRequest(`/notifications/${firstNotif.id}/read`, {
      method: 'PATCH',
      token: passengerToken,
    });
    assert.equal(readSingle.status, 200);
    assert.equal(readSingle.data.data.notification?.isRead ?? readSingle.data.data.isRead, true);

    // Mark all as read
    const readAll = await apiRequest('/notifications/read-all', {
      method: 'PATCH',
      token: passengerToken,
    });
    assert.equal(readAll.status, 200);

    // Verify unread count is now 0
    const finalUnread = await apiRequest('/notifications/unread-count', { token: passengerToken });
    assert.equal(finalUnread.data.data.unreadCount, 0);
  });
});
