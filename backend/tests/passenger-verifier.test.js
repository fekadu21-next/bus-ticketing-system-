import test, { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startTestServer, stopTestServer, apiRequest, prisma } from './test-helper.js';
import { ROLES } from '../constants/index.js';

describe('5. Passenger & Ticket Verifier Role Workflow Integration Suite', () => {
  const timestamp = Date.now();
  let adminToken = null;

  const org1Id = '00000000-0000-0000-0000-000000000001'; // Selam Bus Line
  const org2Id = '00000000-0000-0000-0000-000000000002'; // Sky Bus

  let verifier1Token = null;
  let verifier2Token = null;

  let passenger1Token = null;
  let passenger1User = null;
  let passenger2Token = null;
  let passenger2User = null;

  let trip1Id = null;
  let trip2Id = null;
  let org2TripId = null;

  let booking1Id = null;
  let ticket1Id = null;
  let ticket1QrToken = null;

  before(async () => {
    await startTestServer();

    // 1. Admin login
    const adminLogin = await apiRequest('/auth/login', {
      method: 'POST',
      body: { email: 'admin@busticket.com', password: 'Admin@123456' },
    });
    adminToken = adminLogin.data.data.accessToken;

    // 2. Create and Login Verifier 1 (Org 1)
    const v1Email = `verifier1_${timestamp}@test.com`;
    await apiRequest('/users', {
      method: 'POST',
      token: adminToken,
      body: {
        firstName: 'Dawit',
        lastName: 'Alemayehu',
        email: v1Email,
        password: 'Password@123',
        role: ROLES.TICKET_VERIFIER,
        organizationId: org1Id,
      },
    });
    const v1Login = await apiRequest('/auth/login', {
      method: 'POST',
      body: { email: v1Email, password: 'Password@123' },
    });
    verifier1Token = v1Login.data.data.accessToken;

    // 3. Create and Login Verifier 2 (Org 2)
    const v2Email = `verifier2_${timestamp}@test.com`;
    await apiRequest('/users', {
      method: 'POST',
      token: adminToken,
      body: {
        firstName: 'Hana',
        lastName: 'Gebre',
        email: v2Email,
        password: 'Password@123',
        role: ROLES.TICKET_VERIFIER,
        organizationId: org2Id,
      },
    });
    const v2Login = await apiRequest('/auth/login', {
      method: 'POST',
      body: { email: v2Email, password: 'Password@123' },
    });
    verifier2Token = v2Login.data.data.accessToken;

    // 4. Register Passenger 1
    const p1Email = `pass1_${timestamp}@test.com`;
    await apiRequest('/auth/register', {
      method: 'POST',
      body: {
        firstName: 'Abebe',
        lastName: 'Bikila',
        email: p1Email,
        password: 'Password@123',
        confirmPassword: 'Password@123',
      },
    });
    const p1Login = await apiRequest('/auth/login', {
      method: 'POST',
      body: { email: p1Email, password: 'Password@123' },
    });
    passenger1Token = p1Login.data.data.accessToken;
    passenger1User = p1Login.data.data.user;

    // 5. Register Passenger 2
    const p2Email = `pass2_${timestamp}@test.com`;
    await apiRequest('/auth/register', {
      method: 'POST',
      body: {
        firstName: 'Derartu',
        lastName: 'Tulu',
        email: p2Email,
        password: 'Password@123',
        confirmPassword: 'Password@123',
      },
    });
    const p2Login = await apiRequest('/auth/login', {
      method: 'POST',
      body: { email: p2Email, password: 'Password@123' },
    });
    passenger2Token = p2Login.data.data.accessToken;
    passenger2User = p2Login.data.data.user;

    // 6. Setup Buses and Routes for Trips
    let bus1 = await prisma.buses.findFirst({ where: { organization_id: org1Id } });
    if (!bus1) {
      bus1 = await prisma.buses.create({
        data: {
          organization_id: org1Id,
          plate_number: `ETH-${Math.floor(1000 + Math.random() * 9000)}`,
          capacity: 45,
        },
      });
    }

    let bus2 = await prisma.buses.findFirst({ where: { organization_id: org2Id } });
    if (!bus2) {
      bus2 = await prisma.buses.create({
        data: {
          organization_id: org2Id,
          plate_number: `ETH-${Math.floor(1000 + Math.random() * 9000)}`,
          capacity: 50,
        },
      });
    }

    let route1 = await prisma.routes.findFirst({
      where: { organization_id: org1Id, origin: 'Addis Ababa', destination: 'Bahir Dar' },
    });
    if (!route1) {
      route1 = await prisma.routes.create({
        data: {
          organization_id: org1Id,
          origin: 'Addis Ababa',
          destination: 'Bahir Dar',
          distance_km: 560,
          estimated_duration_hours: 9,
        },
      });
    }

    let route2 = await prisma.routes.findFirst({
      where: { organization_id: org2Id, origin: 'Addis Ababa', destination: 'Hawassa' },
    });
    if (!route2) {
      route2 = await prisma.routes.create({
        data: {
          organization_id: org2Id,
          origin: 'Addis Ababa',
          destination: 'Hawassa',
          distance_km: 275,
          estimated_duration_hours: 4.5,
        },
      });
    }

    // Create Future Trip 1 (Org 1: Addis -> Bahir Dar)
    const depTime1 = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
    const trip1 = await prisma.trips.create({
      data: {
        organization_id: org1Id,
        bus_id: bus1.id,
        route_id: route1.id,
        departure_time: depTime1,
        fare: 650.0,
        status: 'SCHEDULED',
      },
    });
    trip1Id = trip1.id;

    // Initialize seats for Trip 1
    const seats1 = [];
    for (let i = 1; i <= 40; i++) {
      seats1.push({ trip_id: trip1Id, seat_number: i, status: 'AVAILABLE' });
    }
    await prisma.seats.createMany({ data: seats1 });

    // Create Future Trip 2 (Org 1: Addis -> Bahir Dar alternate)
    const depTime2 = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    const trip2 = await prisma.trips.create({
      data: {
        organization_id: org1Id,
        bus_id: bus1.id,
        route_id: route1.id,
        departure_time: depTime2,
        fare: 680.0,
        status: 'SCHEDULED',
      },
    });
    trip2Id = trip2.id;
    const seats2 = [];
    for (let i = 1; i <= 40; i++) {
      seats2.push({ trip_id: trip2Id, seat_number: i, status: 'AVAILABLE' });
    }
    await prisma.seats.createMany({ data: seats2 });

    // Create Future Trip 3 (Org 2: Sky Bus: Addis -> Hawassa)
    const trip3 = await prisma.trips.create({
      data: {
        organization_id: org2Id,
        bus_id: bus2.id,
        route_id: route2.id,
        departure_time: depTime1,
        fare: 450.0,
        status: 'SCHEDULED',
      },
    });
    org2TripId = trip3.id;
    const seats3 = [];
    for (let i = 1; i <= 40; i++) {
      seats3.push({ trip_id: org2TripId, seat_number: i, status: 'AVAILABLE' });
    }
    await prisma.seats.createMany({ data: seats3 });
  });

  after(async () => {
    await stopTestServer();
  });

  // ==========================================
  // PART A: PASSENGER TRIP DISCOVERY
  // ==========================================
  describe('Passenger: Trip Discovery & Seat Availability', () => {
    it('Passenger searches trips successfully with origin and destination', async () => {
      const res = await apiRequest('/passenger/trips?origin=Addis&destination=Bahir', {
        method: 'GET',
        token: passenger1Token,
      });

      assert.equal(res.status, 200);
      assert.equal(res.data.success, true);
      assert.ok(res.data.data.trips.length >= 1);

      const found = res.data.data.trips.find((t) => t.id === trip1Id);
      assert.ok(found);
      assert.equal(found.origin, 'Addis Ababa');
      assert.equal(found.destination, 'Bahir Dar');
      assert.equal(found.fare, 650);
      assert.ok(found.availableSeats >= 1);
    });

    it('Passenger views complete trip details by ID', async () => {
      const res = await apiRequest(`/passenger/trips/${trip1Id}`, {
        method: 'GET',
        token: passenger1Token,
      });

      assert.equal(res.status, 200);
      assert.equal(res.data.success, true);
      const trip = res.data.data.trip;
      assert.equal(trip.id, trip1Id);
      assert.equal(trip.operator.id, org1Id);
      assert.ok(trip.seats.length >= 40);
      assert.equal(trip.availableSeatsCount, 40);
    });

    it('Passenger retrieves seat layout and availability for a trip', async () => {
      const res = await apiRequest(`/passenger/trips/${trip1Id}/seats`, {
        method: 'GET',
        token: passenger1Token,
      });

      assert.equal(res.status, 200);
      assert.equal(res.data.success, true);
      assert.equal(res.data.data.tripId, trip1Id);
      assert.equal(res.data.data.availableSeatsCount, 40);
      assert.equal(res.data.data.seats[0].status, 'AVAILABLE');
    });

    it('Fails (404) when requesting non-existent trip', async () => {
      const res = await apiRequest('/passenger/trips/11111111-1111-4111-8111-111111111111', {
        method: 'GET',
        token: passenger1Token,
      });

      assert.equal(res.status, 404);
    });
  });

  // ==========================================
  // PART B: PASSENGER BOOKING & DOUBLE-BOOKING PREVENTION
  // ==========================================
  describe('Passenger: Booking & Double Booking Prevention', () => {
    it('Passenger 1 successfully books seat 5', async () => {
      const res = await apiRequest('/passenger/bookings', {
        method: 'POST',
        token: passenger1Token,
        body: {
          tripId: trip1Id,
          seatNumber: 5,
        },
      });

      assert.equal(res.status, 201);
      assert.equal(res.data.success, true);
      booking1Id = res.data.data.booking.id;
      assert.ok(booking1Id);
      assert.equal(res.data.data.booking.seatNumber, 5);
      assert.equal(res.data.data.booking.totalFare, 650);
      assert.equal(res.data.data.booking.status, 'PENDING');
    });

    it('PREVENT DOUBLE BOOKING: Passenger 2 attempts to book the already-reserved seat 5 (409 Conflict)', async () => {
      const res = await apiRequest('/passenger/bookings', {
        method: 'POST',
        token: passenger2Token,
        body: {
          tripId: trip1Id,
          seatNumber: 5,
        },
      });

      assert.equal(res.status, 409);
      assert.equal(res.data.success, false);
      assert.match(res.data.message, /no longer available/i);
    });

    it('CONCURRENT BOOKING PREVENTION: Two passengers race for the exact same seat 12', async () => {
      const [res1, res2] = await Promise.all([
        apiRequest('/passenger/bookings', {
          method: 'POST',
          token: passenger1Token,
          body: { tripId: trip1Id, seatNumber: 12 },
        }),
        apiRequest('/passenger/bookings', {
          method: 'POST',
          token: passenger2Token,
          body: { tripId: trip1Id, seatNumber: 12 },
        }),
      ]);

      const successCount = [res1, res2].filter((r) => r.status === 201).length;
      const conflictCount = [res1, res2].filter((r) => r.status === 409).length;

      assert.equal(successCount, 1, 'Exactly one concurrent booking request must succeed');
      assert.equal(conflictCount, 1, 'The other concurrent request must receive 409 Conflict');
    });

    it('Passenger 1 views own bookings list', async () => {
      const res = await apiRequest('/passenger/bookings', {
        method: 'GET',
        token: passenger1Token,
      });

      assert.equal(res.status, 200);
      assert.ok(res.data.data.bookings.length >= 1);
      const found = res.data.data.bookings.find((b) => b.id === booking1Id);
      assert.ok(found);
      assert.equal(found.seat_number, 5);
    });

    it('Passenger 1 views own booking by ID', async () => {
      const res = await apiRequest(`/passenger/bookings/${booking1Id}`, {
        method: 'GET',
        token: passenger1Token,
      });

      assert.equal(res.status, 200);
      assert.equal(res.data.data.booking.id, booking1Id);
    });

    it('OWNERSHIP ISOLATION: Passenger 2 CANNOT access Passenger 1 booking by ID (404)', async () => {
      const res = await apiRequest(`/passenger/bookings/${booking1Id}`, {
        method: 'GET',
        token: passenger2Token,
      });

      assert.equal(res.status, 404);
    });
  });

  // ==========================================
  // PART C: PAYMENT & DIGITAL TICKET GENERATION
  // ==========================================
  describe('Passenger: Payment Flow & Digital Ticket Issuance', () => {
    let transactionReference = null;

    it('Passenger 1 initializes payment for booking', async () => {
      const res = await apiRequest('/passenger/payments/initialize', {
        method: 'POST',
        token: passenger1Token,
        body: {
          bookingId: booking1Id,
          paymentMethod: 'TELEBIRR',
        },
      });

      assert.equal(res.status, 200);
      assert.equal(res.data.success, true);
      transactionReference = res.data.data.transactionReference;
      assert.ok(transactionReference);
      assert.equal(res.data.data.amount, 650);
    });

    it('CROSS-USER PAYMENT ISOLATION: Passenger 2 cannot verify payment for Passenger 1 booking (403/404)', async () => {
      const res = await apiRequest('/passenger/payments/verify', {
        method: 'POST',
        token: passenger2Token,
        body: {
          bookingId: booking1Id,
          transactionReference,
        },
      });

      assert.ok([403, 404].includes(res.status));
    });

    it('Passenger 1 completes payment -> Booking CONFIRMED & Digital Ticket ISSUED', async () => {
      const res = await apiRequest('/passenger/payments/verify', {
        method: 'POST',
        token: passenger1Token,
        body: {
          bookingId: booking1Id,
          transactionReference,
        },
      });

      assert.equal(res.status, 200);
      assert.equal(res.data.success, true);
      assert.equal(res.data.data.status, 'SUCCESS');
      assert.equal(res.data.data.booking.status, 'CONFIRMED');

      const ticket = res.data.data.ticket;
      assert.ok(ticket);
      assert.ok(ticket.id);
      assert.ok(ticket.ticketNumber.startsWith('TKT-'));
      assert.equal(ticket.status, 'UNUSED');
      assert.ok(ticket.qrToken);

      ticket1Id = ticket.id;
      ticket1QrToken = ticket.qrToken;
    });

    it('Passenger 1 retrieves personal tickets list (My Tickets)', async () => {
      const res = await apiRequest('/passenger/tickets', {
        method: 'GET',
        token: passenger1Token,
      });

      assert.equal(res.status, 200);
      assert.ok(res.data.data.tickets.length >= 1);
      const found = res.data.data.tickets.find((t) => t.id === ticket1Id);
      assert.ok(found);
      assert.equal(found.seat.seatNumber, 5);
      assert.equal(found.status, 'UNUSED');
      assert.ok(found.qrToken);
    });

    it('Passenger 1 retrieves digital ticket details with QR data', async () => {
      const res = await apiRequest(`/passenger/tickets/${ticket1Id}`, {
        method: 'GET',
        token: passenger1Token,
      });

      assert.equal(res.status, 200);
      assert.equal(res.data.data.ticket.id, ticket1Id);
      assert.equal(res.data.data.ticket.seat.seatNumber, 5);
      assert.equal(res.data.data.ticket.qrToken, ticket1QrToken);
    });

    it('TICKET ACCESS ISOLATION: Passenger 2 cannot access Passenger 1 ticket by ID (404)', async () => {
      const res = await apiRequest(`/passenger/tickets/${ticket1Id}`, {
        method: 'GET',
        token: passenger2Token,
      });

      assert.equal(res.status, 404);
    });
  });

  // ==========================================
  // PART D: PASSENGER FEEDBACK
  // ==========================================
  describe('Passenger: Post-Trip Feedback', () => {
    it('Fails (400) when submitting feedback BEFORE trip departure / completion', async () => {
      const res = await apiRequest('/passenger/feedback', {
        method: 'POST',
        token: passenger1Token,
        body: {
          tripId: trip1Id,
          rating: 5,
          comment: 'Great ride!',
        },
      });

      assert.equal(res.status, 400);
      assert.match(res.data.message, /departed or completed/i);
    });

    it('Passenger 1 successfully submits feedback AFTER trip is completed', async () => {
      // Mark trip as COMPLETED
      await prisma.trips.update({
        where: { id: trip1Id },
        data: { status: 'COMPLETED' },
      });

      const res = await apiRequest('/passenger/feedback', {
        method: 'POST',
        token: passenger1Token,
        body: {
          tripId: trip1Id,
          rating: 5,
          comment: 'Clean bus and punctual departure.',
        },
      });

      assert.equal(res.status, 201);
      assert.equal(res.data.success, true);
      assert.equal(res.data.data.feedback.rating, 5);
    });

    it('PREVENT DUPLICATE FEEDBACK: Passenger 1 cannot submit duplicate feedback for the same trip (409)', async () => {
      const res = await apiRequest('/passenger/feedback', {
        method: 'POST',
        token: passenger1Token,
        body: {
          tripId: trip1Id,
          rating: 4,
          comment: 'Trying to review again',
        },
      });

      assert.equal(res.status, 409);
      assert.match(res.data.message, /already submitted feedback/i);
    });

    it('FEEDBACK RESTRICTION: Passenger 2 cannot submit feedback for a trip they did not book (403)', async () => {
      const res = await apiRequest('/passenger/feedback', {
        method: 'POST',
        token: passenger2Token,
        body: {
          tripId: trip1Id,
          rating: 3,
          comment: 'I did not book this',
        },
      });

      assert.equal(res.status, 403);
    });
  });

  // ==========================================
  // PART E: TICKET VERIFIER OPERATIONAL SUITE
  // ==========================================
  describe('Ticket Verifier: Assigned Trips & Security Isolation', () => {
    it('ROLE ISOLATION: Passenger cannot access verifier endpoints (403)', async () => {
      const res = await apiRequest('/verifier/trips', {
        method: 'GET',
        token: passenger1Token,
      });

      assert.equal(res.status, 403);
    });

    it('Verifier 1 lists assigned trips for their organization (Org 1 only)', async () => {
      const res = await apiRequest('/verifier/trips', {
        method: 'GET',
        token: verifier1Token,
      });

      assert.equal(res.status, 200);
      assert.equal(res.data.success, true);
      assert.ok(res.data.data.trips.length >= 1);

      // Verify all returned trips belong to Selam Bus (Org 1)
      for (const trip of res.data.data.trips) {
        assert.equal(trip.operator.id, org1Id);
      }
    });

    it('ORGANIZATION ISOLATION: Verifier 1 cannot access trip manifest of Org 2 (403/404)', async () => {
      const res = await apiRequest(`/verifier/trips/${org2TripId}`, {
        method: 'GET',
        token: verifier1Token,
      });

      assert.ok([403, 404].includes(res.status));
    });

    it('Verifier 1 views passenger manifest for assigned Org 1 trip', async () => {
      const res = await apiRequest(`/verifier/trips/${trip1Id}`, {
        method: 'GET',
        token: verifier1Token,
      });

      assert.equal(res.status, 200);
      assert.equal(res.data.success, true);
      assert.ok(res.data.data.passengerManifest.length >= 1);
      const manifestEntry = res.data.data.passengerManifest.find((m) => m.ticketId === ticket1Id);
      assert.ok(manifestEntry);
      assert.equal(manifestEntry.seatNumber, 5);
    });
  });

  // ==========================================
  // PART F: TICKET VERIFICATION & ALL STATUS STATES
  // ==========================================
  describe('Ticket Verifier: QR Scanning, Statuses & Double Verification Prevention', () => {
    let freshTicketQr = null;
    let freshTicketId = null;

    before(async () => {
      // Create a fresh confirmed ticket for verification tests
      const resBooking = await apiRequest('/passenger/bookings', {
        method: 'POST',
        token: passenger2Token,
        body: { tripId: trip2Id, seatNumber: 10 },
      });
      assert.equal(resBooking.status, 201, `Failed to create booking: ${JSON.stringify(resBooking.data)}`);
      const freshBookingId = resBooking.data.data.booking.id;

      const resPayInit = await apiRequest('/passenger/payments/initialize', {
        method: 'POST',
        token: passenger2Token,
        body: { bookingId: freshBookingId, paymentMethod: 'TELEBIRR' },
      });
      assert.equal(resPayInit.status, 200, `Failed to init payment: ${JSON.stringify(resPayInit.data)}`);
      const freshTxRef = resPayInit.data.data.transactionReference;

      const resPayVerify = await apiRequest('/passenger/payments/verify', {
        method: 'POST',
        token: passenger2Token,
        body: { bookingId: freshBookingId, transactionReference: freshTxRef },
      });
      assert.equal(resPayVerify.status, 200, `Failed to verify payment: ${JSON.stringify(resPayVerify.data)}`);

      freshTicketQr = resPayVerify.data.data.ticket.qrToken;
      freshTicketId = resPayVerify.data.data.ticket.id;
    });

    it('VALID: Verifier 1 verifies a valid ticket QR for assigned Trip 2', async () => {
      const res = await apiRequest('/verifier/tickets/verify', {
        method: 'POST',
        token: verifier1Token,
        body: {
          tripId: trip2Id,
          qrToken: freshTicketQr,
        },
      });

      assert.equal(res.status, 200);
      assert.equal(res.data.valid, true);
      assert.equal(res.data.status, 'VALID');
      assert.equal(res.data.ticket.seatNumber, 10);
      assert.match(res.data.message, /Passenger may board/i);

      // Verify DB record status updated to USED
      const dbTicket = await prisma.tickets.findUnique({ where: { id: freshTicketId } });
      assert.equal(dbTicket.status, 'USED');
      assert.ok(dbTicket.verified_at);
    });

    it('ALREADY_USED: Scanning the previously verified ticket returns ALREADY_USED', async () => {
      const res = await apiRequest('/verifier/tickets/verify', {
        method: 'POST',
        token: verifier1Token,
        body: {
          tripId: trip2Id,
          qrToken: freshTicketQr,
        },
      });

      assert.equal(res.status, 200);
      assert.equal(res.data.valid, false);
      assert.equal(res.data.status, 'ALREADY_USED');
      assert.match(res.data.message, /already been verified/i);
    });

    it('INVALID: Scanning an invalid or tampered QR returns INVALID', async () => {
      const res = await apiRequest('/verifier/tickets/verify', {
        method: 'POST',
        token: verifier1Token,
        body: {
          tripId: trip2Id,
          qrToken: 'FAKE_OR_TAMPERED_QR_TOKEN_STRING',
        },
      });

      assert.equal(res.status, 200);
      assert.equal(res.data.valid, false);
      assert.equal(res.data.status, 'INVALID');
    });

    it('WRONG_TRIP: Ticket scheduled for Trip 2 scanned against Trip 1 returns WRONG_TRIP', async () => {
      // Issue another ticket for Trip 2
      const resBooking = await apiRequest('/passenger/bookings', {
        method: 'POST',
        token: passenger1Token,
        body: { tripId: trip2Id, seatNumber: 15 },
      });
      const bId = resBooking.data.data.booking.id;

      const resInit = await apiRequest('/passenger/payments/initialize', {
        method: 'POST',
        token: passenger1Token,
        body: { bookingId: bId, paymentMethod: 'TELEBIRR' },
      });

      const resVerify = await apiRequest('/passenger/payments/verify', {
        method: 'POST',
        token: passenger1Token,
        body: { bookingId: bId, transactionReference: resInit.data.data.transactionReference },
      });

      const trip2TicketQr = resVerify.data.data.ticket.qrToken;

      // Scan against Trip 1 instead of Trip 2
      const scanRes = await apiRequest('/verifier/tickets/verify', {
        method: 'POST',
        token: verifier1Token,
        body: {
          tripId: trip1Id,
          qrToken: trip2TicketQr,
        },
      });

      assert.equal(scanRes.status, 200);
      assert.equal(scanRes.data.valid, false);
      assert.equal(scanRes.data.status, 'WRONG_TRIP');
      assert.match(scanRes.data.message, /different trip/i);
    });

    it('CANCELLED: Attempting to verify a cancelled ticket returns CANCELLED', async () => {
      // Issue ticket and cancel it in DB
      const resBooking = await apiRequest('/passenger/bookings', {
        method: 'POST',
        token: passenger1Token,
        body: { tripId: trip2Id, seatNumber: 20 },
      });
      const bId = resBooking.data.data.booking.id;

      const resInit = await apiRequest('/passenger/payments/initialize', {
        method: 'POST',
        token: passenger1Token,
        body: { bookingId: bId, paymentMethod: 'TELEBIRR' },
      });

      const resVerify = await apiRequest('/passenger/payments/verify', {
        method: 'POST',
        token: passenger1Token,
        body: { bookingId: bId, transactionReference: resInit.data.data.transactionReference },
      });

      const cancelledTicketId = resVerify.data.data.ticket.id;
      const cancelledTicketQr = resVerify.data.data.ticket.qrToken;

      await prisma.tickets.update({
        where: { id: cancelledTicketId },
        data: { status: 'CANCELLED' },
      });

      const scanRes = await apiRequest('/verifier/tickets/verify', {
        method: 'POST',
        token: verifier1Token,
        body: {
          tripId: trip2Id,
          qrToken: cancelledTicketQr,
        },
      });

      assert.equal(scanRes.status, 200);
      assert.equal(scanRes.data.valid, false);
      assert.equal(scanRes.data.status, 'CANCELLED');
    });

    it('ORGANIZATION ISOLATION: Verifier 2 (Org 2) cannot verify Org 1 trip/ticket', async () => {
      const scanRes = await apiRequest('/verifier/tickets/verify', {
        method: 'POST',
        token: verifier2Token,
        body: {
          tripId: trip2Id, // Org 1 trip
          qrToken: freshTicketQr,
        },
      });

      assert.equal(scanRes.status, 403);
    });

    it('CRITICAL CONCURRENCY: Two simultaneous verification requests -> Only ONE is VALID, the other ALREADY_USED', async () => {
      // Issue a brand new unused ticket
      const resBooking = await apiRequest('/passenger/bookings', {
        method: 'POST',
        token: passenger1Token,
        body: { tripId: trip2Id, seatNumber: 25 },
      });
      const bId = resBooking.data.data.booking.id;

      const resInit = await apiRequest('/passenger/payments/initialize', {
        method: 'POST',
        token: passenger1Token,
        body: { bookingId: bId, paymentMethod: 'TELEBIRR' },
      });

      const resVerify = await apiRequest('/passenger/payments/verify', {
        method: 'POST',
        token: passenger1Token,
        body: { bookingId: bId, transactionReference: resInit.data.data.transactionReference },
      });

      const raceTicketQr = resVerify.data.data.ticket.qrToken;

      // Fire 2 concurrent verification requests simultaneously
      const [verif1, verif2] = await Promise.all([
        apiRequest('/verifier/tickets/verify', {
          method: 'POST',
          token: verifier1Token,
          body: { tripId: trip2Id, qrToken: raceTicketQr },
        }),
        apiRequest('/verifier/tickets/verify', {
          method: 'POST',
          token: verifier1Token,
          body: { tripId: trip2Id, qrToken: raceTicketQr },
        }),
      ]);

      assert.equal(verif1.status, 200);
      assert.equal(verif2.status, 200);

      const validCount = [verif1, verif2].filter((v) => v.data.status === 'VALID').length;
      const alreadyUsedCount = [verif1, verif2].filter((v) => v.data.status === 'ALREADY_USED').length;

      assert.equal(validCount, 1, 'Exactly ONE concurrent verification must return VALID');
      assert.equal(alreadyUsedCount, 1, 'The colliding concurrent verification must return ALREADY_USED');
    });

    it('Verification history audit records are logged and accessible', async () => {
      const res = await apiRequest('/verifier/history', {
        method: 'GET',
        token: verifier1Token,
      });

      assert.equal(res.status, 200);
      assert.equal(res.data.success, true);
      assert.ok(res.data.data.verifications.length >= 1);

      const results = res.data.data.verifications.map((v) => v.result);
      assert.ok(results.includes('VALID'));
      assert.ok(results.includes('ALREADY_USED'));
    });
  });
});
