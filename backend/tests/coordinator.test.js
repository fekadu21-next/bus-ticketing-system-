import test, { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startTestServer, stopTestServer, apiRequest, prisma } from './test-helper.js';
import { ROLES } from '../constants/index.js';

describe('4. Booking Coordinator Operational Suite & Boundary Enforcement', () => {
  const timestamp = Date.now();
  let adminToken = null;
  let coord1Token = null;
  let coord1User = null;
  let coord2Token = null;
  let coord2User = null;
  let passengerToken = null;
  let passengerUser = null;

  const org1Id = '00000000-0000-0000-0000-000000000001'; // Selam Bus Line
  const org2Id = '00000000-0000-0000-0000-000000000002'; // Sky Bus Transport System

  let bus1Id = null;
  let bus2Id = null;
  let route1Id = null;
  let route2Id = null;
  let trip1Id = null;
  let seat1Id = null;
  let booking1Id = null;
  let payment1Id = null;

  before(async () => {
    await startTestServer();

    // 1. Admin login
    const adminLogin = await apiRequest('/auth/login', {
      method: 'POST',
      body: { email: 'admin@busticket.com', password: 'Admin@123456' },
    });
    adminToken = adminLogin.data.data.accessToken;

    // 2. Coordinator 1 (Org 1)
    const c1 = await apiRequest('/users', {
      method: 'POST',
      token: adminToken,
      body: {
        firstName: 'Selam',
        lastName: 'Coordinator',
        email: `selam_coord_${timestamp}@test.com`,
        password: 'Password@123',
        role: ROLES.BOOKING_COORDINATOR,
        organizationId: org1Id,
      },
    });
    coord1User = c1.data.data.user;
    const c1Login = await apiRequest('/auth/login', {
      method: 'POST',
      body: { email: `selam_coord_${timestamp}@test.com`, password: 'Password@123' },
    });
    coord1Token = c1Login.data.data.accessToken;

    // 3. Coordinator 2 (Org 2)
    const c2 = await apiRequest('/users', {
      method: 'POST',
      token: adminToken,
      body: {
        firstName: 'Sky',
        lastName: 'Coordinator',
        email: `sky_coord_${timestamp}@test.com`,
        password: 'Password@123',
        role: ROLES.BOOKING_COORDINATOR,
        organizationId: org2Id,
      },
    });
    coord2User = c2.data.data.user;
    const c2Login = await apiRequest('/auth/login', {
      method: 'POST',
      body: { email: `sky_coord_${timestamp}@test.com`, password: 'Password@123' },
    });
    coord2Token = c2Login.data.data.accessToken;

    // 4. Passenger User
    const p = await apiRequest('/auth/register', {
      method: 'POST',
      body: {
        firstName: 'Traveler',
        lastName: 'One',
        email: `passenger_coord_${timestamp}@test.com`,
        password: 'Password@123',
        confirmPassword: 'Password@123',
      },
    });
    const pLogin = await apiRequest('/auth/login', {
      method: 'POST',
      body: { email: `passenger_coord_${timestamp}@test.com`, password: 'Password@123' },
    });
    passengerToken = pLogin.data.data.accessToken;
    passengerUser = pLogin.data.data.user;
  });

  after(async () => {
    await stopTestServer();
  });

  // ==========================================
  // 1. BUS MANAGEMENT & BOUNDARY TESTS
  // ==========================================
  describe('Bus Management', () => {
    it('Coordinator 1 should create a bus for Org 1', async () => {
      const res = await apiRequest(`/organizations/${org1Id}/buses`, {
        method: 'POST',
        token: coord1Token,
        body: {
          plateNumber: `AA-${timestamp}`,
          model: 'Volvo 9700 Luxury',
          capacity: 45,
        },
      });
      assert.equal(res.status, 201);
      assert.equal(res.data.success, true);
      assert.equal(res.data.data.bus.plate_number, `AA-${timestamp}`);
      assert.equal(res.data.data.bus.organization_id, org1Id);
      bus1Id = res.data.data.bus.id;
    });

    it('Coordinator 2 should create a bus for Org 2', async () => {
      const res = await apiRequest(`/organizations/${org2Id}/buses`, {
        method: 'POST',
        token: coord2Token,
        body: {
          plateNumber: `SKY-${timestamp}`,
          model: 'Scania Touring',
          capacity: 50,
        },
      });
      assert.equal(res.status, 201);
      bus2Id = res.data.data.bus.id;
    });

    it('Coordinator 1 cannot create duplicate plate number in Org 1 (409 Conflict)', async () => {
      const res = await apiRequest(`/organizations/${org1Id}/buses`, {
        method: 'POST',
        token: coord1Token,
        body: {
          plateNumber: `AA-${timestamp}`,
          model: 'Another Bus',
          capacity: 40,
        },
      });
      assert.equal(res.status, 409);
    });

    it('Coordinator 1 listing buses should see only Org 1 buses', async () => {
      const res = await apiRequest(`/organizations/${org1Id}/buses`, {
        method: 'GET',
        token: coord1Token,
      });
      assert.equal(res.status, 200);
      assert.ok(res.data.data.buses.length >= 1);
      const allBelongToOrg1 = res.data.data.buses.every((b) => b.organization_id === org1Id);
      assert.equal(allBelongToOrg1, true);
    });

    it('CROSS-ORG VIOLATION: Coordinator 1 cannot access Org 2 bus list (403)', async () => {
      const res = await apiRequest(`/organizations/${org2Id}/buses`, {
        method: 'GET',
        token: coord1Token,
      });
      assert.equal(res.status, 403);
    });

    it('CROSS-ORG VIOLATION: Coordinator 1 cannot view Coordinator 2 bus by ID (404/403)', async () => {
      const res = await apiRequest(`/organizations/${org1Id}/buses/${bus2Id}`, {
        method: 'GET',
        token: coord1Token,
      });
      assert.equal(res.status, 404);
    });

    it('Coordinator 1 can update their bus', async () => {
      const res = await apiRequest(`/organizations/${org1Id}/buses/${bus1Id}`, {
        method: 'PATCH',
        token: coord1Token,
        body: { model: 'Volvo 9700 Ultra' },
      });
      assert.equal(res.status, 200);
      assert.equal(res.data.data.bus.model, 'Volvo 9700 Ultra');
    });

    it('Passenger cannot access bus management endpoints (403)', async () => {
      const res = await apiRequest(`/organizations/${org1Id}/buses`, {
        method: 'GET',
        token: passengerToken,
      });
      assert.equal(res.status, 403);
    });
  });

  // ==========================================
  // 2. ROUTE MANAGEMENT & BOUNDARY TESTS
  // ==========================================
  describe('Route Management', () => {
    it('Coordinator 1 should create a route for Org 1', async () => {
      const res = await apiRequest(`/organizations/${org1Id}/routes`, {
        method: 'POST',
        token: coord1Token,
        body: {
          origin: `Addis Ababa ${timestamp}`,
          destination: `Hawassa ${timestamp}`,
          distanceKm: 275,
          estimatedDurationHours: 4.5,
        },
      });
      assert.equal(res.status, 201);
      assert.equal(res.data.success, true);
      assert.equal(res.data.data.route.organization_id, org1Id);
      route1Id = res.data.data.route.id;
    });

    it('Coordinator 2 should create a route for Org 2', async () => {
      const res = await apiRequest(`/organizations/${org2Id}/routes`, {
        method: 'POST',
        token: coord2Token,
        body: {
          origin: `Addis Ababa ${timestamp}`,
          destination: `Mekelle ${timestamp}`,
          distanceKm: 780,
          estimatedDurationHours: 12,
        },
      });
      assert.equal(res.status, 201);
      route2Id = res.data.data.route.id;
    });

    it('Coordinator 1 cannot create duplicate route in Org 1 (409 Conflict)', async () => {
      const res = await apiRequest(`/organizations/${org1Id}/routes`, {
        method: 'POST',
        token: coord1Token,
        body: {
          origin: `Addis Ababa ${timestamp}`,
          destination: `Hawassa ${timestamp}`,
          distanceKm: 275,
        },
      });
      assert.equal(res.status, 409);
    });

    it('Coordinator 1 listing routes sees only Org 1 routes', async () => {
      const res = await apiRequest(`/organizations/${org1Id}/routes`, {
        method: 'GET',
        token: coord1Token,
      });
      assert.equal(res.status, 200);
      const allBelong = res.data.data.routes.every((r) => r.organization_id === org1Id);
      assert.equal(allBelong, true);
    });

    it('CROSS-ORG VIOLATION: Coordinator 1 cannot access Org 2 routes (403)', async () => {
      const res = await apiRequest(`/organizations/${org2Id}/routes`, {
        method: 'GET',
        token: coord1Token,
      });
      assert.equal(res.status, 403);
    });

    it('CROSS-ORG VIOLATION: Coordinator 1 cannot view Coordinator 2 route by ID (404)', async () => {
      const res = await apiRequest(`/organizations/${org1Id}/routes/${route2Id}`, {
        method: 'GET',
        token: coord1Token,
      });
      assert.equal(res.status, 404);
    });

    it('Coordinator 1 can update route distance and duration', async () => {
      const res = await apiRequest(`/organizations/${org1Id}/routes/${route1Id}`, {
        method: 'PATCH',
        token: coord1Token,
        body: { distanceKm: 280, estimatedDurationHours: 4.8 },
      });
      assert.equal(res.status, 200);
      assert.equal(res.data.data.route.distance_km, 280);
    });
  });

  // ==========================================
  // 3. TRIP MANAGEMENT & CROSS-ORG VERIFICATION
  // ==========================================
  describe('Trip Management & Seat Initialization', () => {
    it('CROSS-ORG VALIDATION: Coordinator 1 fails when trying to use Coordinator 2 bus (404/400)', async () => {
      const res = await apiRequest(`/organizations/${org1Id}/trips`, {
        method: 'POST',
        token: coord1Token,
        body: {
          busId: bus2Id, // Org 2's bus
          routeId: route1Id,
          departureTime: '2026-11-15T06:00:00Z',
          fare: 450,
        },
      });
      assert.equal(res.status, 404);
      assert.match(res.data.message, /bus not found or does not belong to your organization/i);
    });

    it('CROSS-ORG VALIDATION: Coordinator 1 fails when trying to use Coordinator 2 route (404/400)', async () => {
      const res = await apiRequest(`/organizations/${org1Id}/trips`, {
        method: 'POST',
        token: coord1Token,
        body: {
          busId: bus1Id,
          routeId: route2Id, // Org 2's route
          departureTime: '2026-11-15T06:00:00Z',
          fare: 450,
        },
      });
      assert.equal(res.status, 404);
      assert.match(res.data.message, /route not found or does not belong to your organization/i);
    });

    it('Coordinator 1 schedules a valid trip for Org 1 and initializes seats', async () => {
      const res = await apiRequest(`/organizations/${org1Id}/trips`, {
        method: 'POST',
        token: coord1Token,
        body: {
          busId: bus1Id,
          routeId: route1Id,
          departureTime: '2026-11-15T06:00:00Z',
          arrivalTime: '2026-11-15T11:00:00Z',
          fare: 480,
        },
      });
      assert.equal(res.status, 201);
      assert.equal(res.data.data.trip.organizationId, org1Id);
      assert.equal(res.data.data.trip.busId, bus1Id);
      assert.equal(res.data.data.trip.routeId, route1Id);
      trip1Id = res.data.data.trip.id;
    });

    it('Seats were automatically created for the trip matching bus capacity (45)', async () => {
      const res = await apiRequest(`/organizations/${org1Id}/trips/${trip1Id}/seats`, {
        method: 'GET',
        token: coord1Token,
      });
      assert.equal(res.status, 200);
      assert.equal(res.data.data.seats.length, 45);
      assert.equal(res.data.data.seats[0].status, 'AVAILABLE');
      seat1Id = res.data.data.seats[0].id;
    });

    it('CROSS-ORG VIOLATION: Coordinator 2 cannot view or access Org 1 trip seats (404/403)', async () => {
      const res = await apiRequest(`/organizations/${org2Id}/trips/${trip1Id}/seats`, {
        method: 'GET',
        token: coord2Token,
      });
      assert.equal(res.status, 404);
    });

    it('Coordinator 1 updates seat 1 status to LOCKED', async () => {
      const res = await apiRequest(`/organizations/${org1Id}/trips/${trip1Id}/seats/${seat1Id}`, {
        method: 'PATCH',
        token: coord1Token,
        body: { status: 'LOCKED' },
      });
      assert.equal(res.status, 200);
      assert.equal(res.data.data.seat.status, 'LOCKED');
    });

    it('Coordinator 1 batch updates seats 2, 3 to LOCKED', async () => {
      const res = await apiRequest(`/organizations/${org1Id}/trips/${trip1Id}/seats/batch`, {
        method: 'PATCH',
        token: coord1Token,
        body: { seatNumbers: [2, 3], status: 'LOCKED' },
      });
      assert.equal(res.status, 200);
    });

    it('Coordinator 1 updates trip schedule and fare', async () => {
      const res = await apiRequest(`/organizations/${org1Id}/trips/${trip1Id}`, {
        method: 'PATCH',
        token: coord1Token,
        body: { fare: 520 },
      });
      assert.equal(res.status, 200);
    });
  });

  // ==========================================
  // 4. BOOKINGS & PAYMENTS VISIBILITY
  // ==========================================
  describe('Bookings and Payments Visibility', () => {
    before(async () => {
      // Seed a booking and payment directly for Org 1 to verify coordinator visibility
      const booking = await prisma.bookings.create({
        data: {
          organization_id: org1Id,
          trip_id: trip1Id,
          passenger_id: passengerUser.id,
          seat_id: seat1Id,
          seat_number: 1,
          total_fare: 520,
          status: 'CONFIRMED',
        },
      });
      booking1Id = booking.id;

      const payment = await prisma.payments.create({
        data: {
          booking_id: booking1Id,
          organization_id: org1Id,
          amount: 520,
          currency: 'ETB',
          payment_method: 'TELEBIRR',
          transaction_reference: `TX-${timestamp}`,
          status: 'COMPLETED',
        },
      });
      payment1Id = payment.id;
    });

    it('Coordinator 1 lists bookings for Org 1 and sees the created booking', async () => {
      const res = await apiRequest(`/organizations/${org1Id}/bookings`, {
        method: 'GET',
        token: coord1Token,
      });
      assert.equal(res.status, 200);
      assert.ok(res.data.data.bookings.length >= 1);
      const found = res.data.data.bookings.find((b) => b.id === booking1Id);
      assert.ok(found);
      assert.equal(found.organization_id, org1Id);
      assert.equal(found.users.email, passengerUser.email);
    });

    it('Coordinator 1 views booking details by ID', async () => {
      const res = await apiRequest(`/organizations/${org1Id}/bookings/${booking1Id}`, {
        method: 'GET',
        token: coord1Token,
      });
      assert.equal(res.status, 200);
      assert.equal(res.data.data.booking.id, booking1Id);
      assert.equal(res.data.data.booking.total_fare, '520');
    });

    it('CROSS-ORG VIOLATION: Coordinator 2 cannot view Org 1 booking by ID (404/403)', async () => {
      const res = await apiRequest(`/organizations/${org2Id}/bookings/${booking1Id}`, {
        method: 'GET',
        token: coord2Token,
      });
      assert.equal(res.status, 404);
    });

    it('Coordinator 1 lists payments for Org 1 and sees the payment record', async () => {
      const res = await apiRequest(`/organizations/${org1Id}/payments`, {
        method: 'GET',
        token: coord1Token,
      });
      assert.equal(res.status, 200);
      assert.ok(res.data.data.payments.length >= 1);
      const found = res.data.data.payments.find((p) => p.id === payment1Id);
      assert.ok(found);
      assert.equal(found.payment_method, 'TELEBIRR');
      assert.equal(found.amount, '520');
    });

    it('Coordinator 1 views payment details by ID', async () => {
      const res = await apiRequest(`/organizations/${org1Id}/payments/${payment1Id}`, {
        method: 'GET',
        token: coord1Token,
      });
      assert.equal(res.status, 200);
      assert.equal(res.data.data.payment.id, payment1Id);
      assert.equal(res.data.data.payment.transaction_reference, `TX-${timestamp}`);
    });

    it('CROSS-ORG VIOLATION: Coordinator 2 cannot view Org 1 payment by ID (404/403)', async () => {
      const res = await apiRequest(`/organizations/${org2Id}/payments/${payment1Id}`, {
        method: 'GET',
        token: coord2Token,
      });
      assert.equal(res.status, 404);
    });
  });

  // ==========================================
  // 5. OPERATIONAL REPORTS
  // ==========================================
  describe('Operational Reports', () => {
    it('Coordinator 1 views operational report with accurate real data', async () => {
      const res = await apiRequest(`/organizations/${org1Id}/reports`, {
        method: 'GET',
        token: coord1Token,
      });
      assert.equal(res.status, 200);
      assert.equal(res.data.success, true);
      const stats = res.data.data.stats;
      assert.ok(stats.buses.total >= 1);
      assert.ok(stats.routes.total >= 1);
      assert.ok(stats.trips.total >= 1);
      assert.ok(stats.bookings.total >= 1);
      assert.ok(stats.payments.totalCompletedTransactions >= 1);
      assert.equal(stats.payments.totalRevenue >= 520, true);
    });

    it('CROSS-ORG ISOLATION: Coordinator 2 reports reflect only Org 2 data (0 bookings/payments)', async () => {
      const res = await apiRequest(`/organizations/${org2Id}/reports`, {
        method: 'GET',
        token: coord2Token,
      });
      assert.equal(res.status, 200);
      const stats = res.data.data.stats;
      assert.equal(stats.bookings.total, 0);
      assert.equal(stats.payments.totalRevenue, 0);
    });
  });

  // ==========================================
  // 6. TRIP CANCELLATION & INTEGRITY
  // ==========================================
  describe('Trip Cancellation and Integrity', () => {
    it('Coordinator 1 cancels the scheduled trip', async () => {
      const res = await apiRequest(`/organizations/${org1Id}/trips/${trip1Id}/cancel`, {
        method: 'POST',
        token: coord1Token,
      });
      assert.equal(res.status, 200);
      assert.equal(res.data.data.trip.status, 'CANCELLED');
    });

    it('Coordinator 1 cannot cancel an already cancelled trip (400 Bad Request)', async () => {
      const res = await apiRequest(`/organizations/${org1Id}/trips/${trip1Id}/cancel`, {
        method: 'POST',
        token: coord1Token,
      });
      assert.equal(res.status, 400);
      assert.match(res.data.message, /already cancelled/i);
    });
  });
});
