import test, { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startTestServer, stopTestServer, apiRequest, prisma } from './test-helper.js';
import { ROLES } from '../constants/index.js';

describe('Feedback and Rating System Integration Tests', () => {
  const timestamp = Date.now();
  let adminToken = null;
  let adminUserId = null;

  let passengerToken = null;
  let passengerUserId = null;
  let otherPassengerToken = null;
  let otherPassengerUserId = null;

  let managerToken = null;
  let managerUserId = null;
  const org1Id = '00000000-0000-0000-0000-000000000001'; // Selam Bus Line

  let testTripId = null;
  let testBookingId = null;
  let platformFeedbackId = null;

  before(async () => {
    await startTestServer();

    // 1. Admin Login
    const adminLogin = await apiRequest('/auth/login', {
      method: 'POST',
      body: { email: 'admin@busticket.com', password: 'Admin@123456' },
    });
    assert.equal(adminLogin.status, 200);
    adminToken = adminLogin.data.data.accessToken;
    adminUserId = adminLogin.data.data.user.id;

    // 2. Operational Manager for Org 1
    const coordEmail = `mgr_feedback_${timestamp}@selambus.et`;
    const cRes = await apiRequest('/users', {
      method: 'POST',
      token: adminToken,
      body: {
        firstName: 'Coordinator',
        lastName: 'Manager',
        email: coordEmail,
        password: 'Password@123',
        role: ROLES.BOOKING_COORDINATOR,
        organizationId: org1Id,
        phone: `+25195${timestamp.toString().slice(-7)}`,
      },
    });
    assert.equal(cRes.status, 201);
    managerUserId = cRes.data.data.user.id;

    const mgrLogin = await apiRequest('/auth/login', {
      method: 'POST',
      body: { email: coordEmail, password: 'Password@123' },
    });
    assert.equal(mgrLogin.status, 200);
    managerToken = mgrLogin.data.data.accessToken;

    // 3. Register Passenger 1
    const p1Email = `passenger_fb1_${timestamp}@test.com`;
    const regP1 = await apiRequest('/auth/register', {
      method: 'POST',
      body: {
        firstName: 'Dawit',
        lastName: 'Tadesse',
        email: p1Email,
        password: 'Password@123',
        confirmPassword: 'Password@123',
        phone: `+25191${timestamp.toString().slice(-7)}`,
      },
    });
    assert.equal(regP1.status, 201);
    passengerUserId = regP1.data.data.user.id;

    const p1Login = await apiRequest('/auth/login', {
      method: 'POST',
      body: { email: p1Email, password: 'Password@123' },
    });
    passengerToken = p1Login.data.data.accessToken;

    // 4. Register Passenger 2 (Unbooked passenger)
    const p2Email = `passenger_fb2_${timestamp}@test.com`;
    const regP2 = await apiRequest('/auth/register', {
      method: 'POST',
      body: {
        firstName: 'Sara',
        lastName: 'Alemu',
        email: p2Email,
        password: 'Password@123',
        confirmPassword: 'Password@123',
        phone: `+25192${timestamp.toString().slice(-7)}`,
      },
    });
    assert.equal(regP2.status, 201);
    otherPassengerUserId = regP2.data.data.user.id;

    const p2Login = await apiRequest('/auth/login', {
      method: 'POST',
      body: { email: p2Email, password: 'Password@123' },
    });
    otherPassengerToken = p2Login.data.data.accessToken;

    // 5. Seed a completed trip for Org 1 with a confirmed booking for Passenger 1
    const existingBus = await prisma.buses.findFirst({ where: { organization_id: org1Id } });
    const existingRoute = await prisma.routes.findFirst({ where: { organization_id: org1Id } });

    const trip = await prisma.trips.create({
      data: {
        organization_id: org1Id,
        bus_id: existingBus.id,
        route_id: existingRoute.id,
        departure_time: new Date(Date.now() - 3600000 * 5), // Departed 5 hours ago
        arrival_time: new Date(Date.now() - 3600000 * 1), // Completed 1 hour ago
        status: 'COMPLETED',
        fare: 850,
      },
    });
    testTripId = trip.id;

    const booking = await prisma.bookings.create({
      data: {
        trip_id: testTripId,
        passenger_id: passengerUserId,
        organization_id: org1Id,
        seat_number: 1,
        status: 'CONFIRMED',
        total_fare: 850,
      },
    });
    testBookingId = booking.id;
  });

  after(async () => {
    try {
      if (testBookingId) await prisma.bookings.deleteMany({ where: { id: testBookingId } });
      if (testTripId) {
        await prisma.feedbacks.deleteMany({ where: { trip_id: testTripId } });
        await prisma.trips.deleteMany({ where: { id: testTripId } });
      }
      if (platformFeedbackId) {
        await prisma.platform_feedbacks.deleteMany({ where: { id: platformFeedbackId } });
      }
      if (passengerUserId) await prisma.users.deleteMany({ where: { id: passengerUserId } });
      if (otherPassengerUserId) await prisma.users.deleteMany({ where: { id: otherPassengerUserId } });
      if (managerUserId) {
        await prisma.user_roles.deleteMany({ where: { user_id: managerUserId } });
        await prisma.users.deleteMany({ where: { id: managerUserId } });
      }
    } catch (e) {
      // non-fatal
    }
    await stopTestServer();
  });

  // ==================== PART 1: TRIP RATINGS ====================
  describe('Part 1: Trip Ratings & Reviews', () => {
    it('1.1. Unbooked passenger cannot submit trip rating (403 Forbidden)', async () => {
      const res = await apiRequest('/passenger/feedback', {
        method: 'POST',
        token: otherPassengerToken,
        body: {
          tripId: testTripId,
          rating: 4,
          comment: 'Did not take this bus but rating anyway',
        },
      });

      assert.equal(res.status, 403);
      assert.match(res.data.message, /did not book or complete/i);
    });

    it('1.2. Booked passenger successfully submits trip rating & review (1-5 stars)', async () => {
      const res = await apiRequest('/passenger/feedback', {
        method: 'POST',
        token: passengerToken,
        body: {
          tripId: testTripId,
          rating: 5,
          comment: 'Outstanding journey! Punctual departure and smooth driving.',
        },
      });

      assert.equal(res.status, 201);
      assert.equal(res.data.success, true);
      assert.equal(res.data.data.feedback.rating, 5);
      assert.equal(res.data.data.feedback.tripId, testTripId);
    });

    it('1.3. Prevent duplicate trip review: Passenger cannot submit a second review for the same trip (409)', async () => {
      const res = await apiRequest('/passenger/feedback', {
        method: 'POST',
        token: passengerToken,
        body: {
          tripId: testTripId,
          rating: 4,
          comment: 'Trying to review again',
        },
      });

      assert.equal(res.status, 409);
      assert.match(res.data.message, /already submitted feedback/i);
    });

    it('1.4. Passenger can check whether trip is already rated', async () => {
      const res = await apiRequest(`/passenger/feedback/trips/${testTripId}`, {
        method: 'GET',
        token: passengerToken,
      });

      assert.equal(res.status, 200);
      assert.equal(res.data.data.isRated, true);
      assert.equal(res.data.data.feedback.rating, 5);
    });

    it('1.5. Operational manager views ratings, reviews, stats, and average for their organization trips', async () => {
      const res = await apiRequest('/coordinator/feedback', {
        method: 'GET',
        token: managerToken,
      });

      assert.equal(res.status, 200);
      assert.equal(res.data.success, true);
      assert.ok(res.data.data.stats, 'Stats should be returned to operational manager');
      assert.ok(res.data.data.stats.totalReviews >= 1, 'Total reviews count should be at least 1');
      assert.ok(res.data.data.stats.averageRating >= 1, 'Average rating should be computed');
      assert.ok(Array.isArray(res.data.data.feedbacks), 'Feedbacks list should be returned');

      const foundReview = res.data.data.feedbacks.find((f) => f.tripId === testTripId);
      assert.ok(foundReview, 'Manager should see the review for their organization trip');
      assert.equal(foundReview.rating, 5);
      assert.match(foundReview.comment, /Outstanding journey/i);
    });
  });

  // ==================== PART 2: PLATFORM FEEDBACK ====================
  describe('Part 2: Platform Feedback', () => {
    it('2.1. Any user (passenger/manager) can submit platform feedback with category and 1-5 stars', async () => {
      const res = await apiRequest('/feedback', {
        method: 'POST',
        token: passengerToken,
        body: {
          rating: 5,
          category: 'FEATURE_REQUEST',
          comment: 'The online seat selection map is super helpful! Would love to see bus live GPS tracking next.',
        },
      });

      assert.equal(res.status, 201);
      assert.equal(res.data.success, true);
      assert.ok(res.data.data.feedback.id);
      assert.equal(res.data.data.feedback.category, 'FEATURE_REQUEST');
      assert.equal(res.data.data.feedback.status, 'OPEN');

      platformFeedbackId = res.data.data.feedback.id;
    });

    it('2.2. User can view their own submitted platform feedback and status', async () => {
      const res = await apiRequest('/feedback/my', {
        method: 'GET',
        token: passengerToken,
      });

      assert.equal(res.status, 200);
      assert.equal(res.data.success, true);
      assert.ok(Array.isArray(res.data.data.feedbacks));

      const found = res.data.data.feedbacks.find((f) => f.id === platformFeedbackId);
      assert.ok(found, 'User should see their submitted feedback in my feedback list');
      assert.equal(found.status, 'OPEN');
    });

    it('2.3. Platform administrator can view, filter, and search all platform feedback with metrics', async () => {
      const res = await apiRequest('/feedback/admin?category=FEATURE_REQUEST', {
        method: 'GET',
        token: adminToken,
      });

      assert.equal(res.status, 200);
      assert.equal(res.data.success, true);
      assert.ok(res.data.data.stats, 'Admin should receive overall platform feedback stats');
      assert.ok(res.data.data.stats.total >= 1);
      assert.ok(Array.isArray(res.data.data.feedbacks));

      const found = res.data.data.feedbacks.find((f) => f.id === platformFeedbackId);
      assert.ok(found, 'Admin should find the submitted feedback');
      assert.equal(found.category, 'FEATURE_REQUEST');
    });

    it('2.4. Platform administrator responds to feedback and updates status (RESOLVED)', async () => {
      const res = await apiRequest(`/feedback/admin/${platformFeedbackId}`, {
        method: 'PATCH',
        token: adminToken,
        body: {
          status: 'RESOLVED',
          adminResponse: 'Thank you! Live GPS tracking is currently scheduled for rollout in our upcoming release.',
        },
      });

      assert.equal(res.status, 200);
      assert.equal(res.data.success, true);
      assert.equal(res.data.data.feedback.status, 'RESOLVED');
      assert.match(res.data.data.feedback.admin_response, /Live GPS tracking/i);

      // Verify the user now sees the RESOLVED status and admin response
      const myRes = await apiRequest('/feedback/my', {
        method: 'GET',
        token: passengerToken,
      });
      const updated = myRes.data.data.feedbacks.find((f) => f.id === platformFeedbackId);
      assert.equal(updated.status, 'RESOLVED');
      assert.match(updated.admin_response, /upcoming release/i);
    });

    it('2.5. Non-admin users cannot access admin platform feedback endpoints (403)', async () => {
      const res = await apiRequest('/feedback/admin', {
        method: 'GET',
        token: passengerToken,
      });
      assert.equal(res.status, 403);
    });
  });
});
