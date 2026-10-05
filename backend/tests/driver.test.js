import test, { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startTestServer, stopTestServer, apiRequest, prisma } from './test-helper.js';
import { ROLES, PERMISSIONS } from '../constants/index.js';

describe('6. Driver Role, Fleet Operations & Security Isolation Suite', () => {
  const timestamp = Date.now();
  let adminToken = null;
  let adminUser = null;

  // Organization 1 (Selam Bus Line)
  const org1Id = '00000000-0000-0000-0000-000000000001';
  let coord1Token = null;
  let coord1User = null;
  let driver1Token = null;
  let driver1User = null;
  let bus1Id = null;
  let route1Id = null;
  let trip1Id = null;

  // Organization 2 (Sky Bus Transport System)
  const org2Id = '00000000-0000-0000-0000-000000000002';
  let coord2Token = null;
  let coord2User = null;
  let driver2Token = null;
  let driver2User = null;
  let bus2Id = null;
  let route2Id = null;
  let trip2Id = null;

  // Passenger & Verifier Tokens
  let passengerToken = null;
  let verifierToken = null;

  // Problem report tracking
  let reportedProblemId = null;

  before(async () => {
    await startTestServer();

    // 1. Admin login
    const adminLogin = await apiRequest('/auth/login', {
      method: 'POST',
      body: { email: 'admin@busticket.com', password: 'Admin@123456' },
    });
    adminToken = adminLogin.data.data.accessToken;
    adminUser = adminLogin.data.data.user;

    // 2. Coordinator 1 (Org 1)
    const c1Login = await apiRequest('/auth/login', {
      method: 'POST',
      body: { email: 'coordinator@busticket.com', password: 'Coordinator@123456' },
    });
    coord1Token = c1Login.data.data.accessToken;
    coord1User = c1Login.data.data.user;

    // Coordinator 2 (Org 2)
    const c2Create = await apiRequest('/users', {
      method: 'POST',
      token: adminToken,
      body: {
        firstName: 'Sky',
        lastName: 'Manager',
        email: `sky_manager_${timestamp}@test.com`,
        password: 'Password@123',
        role: ROLES.BOOKING_COORDINATOR,
        organizationId: org2Id,
      },
    });
    coord2User = c2Create.data.data.user;
    const c2Login = await apiRequest('/auth/login', {
      method: 'POST',
      body: { email: `sky_manager_${timestamp}@test.com`, password: 'Password@123' },
    });
    coord2Token = c2Login.data.data.accessToken;

    // 3. Driver 1 (Org 1) from seed
    const d1Login = await apiRequest('/auth/login', {
      method: 'POST',
      body: { email: 'driver@busticket.com', password: 'Driver@123456' },
    });
    driver1Token = d1Login.data.data.accessToken;
    driver1User = d1Login.data.data.user;

    // 4. Driver 2 (Org 2) from seed
    const d2Login = await apiRequest('/auth/login', {
      method: 'POST',
      body: { email: 'driver2@busticket.com', password: 'Driver@123456' },
    });
    driver2Token = d2Login.data.data.accessToken;
    driver2User = d2Login.data.data.user;

    // 5. Verifier (Org 1) from seed
    const vLogin = await apiRequest('/auth/login', {
      method: 'POST',
      body: { email: 'verifier@busticket.com', password: 'Verifier@123456' },
    });
    verifierToken = vLogin.data.data.accessToken;

    // 6. Passenger
    const pRegister = await apiRequest('/auth/register', {
      method: 'POST',
      body: {
        firstName: 'DriverTest',
        lastName: 'Passenger',
        email: `driver_passenger_${timestamp}@test.com`,
        password: 'Password@123',
        confirmPassword: 'Password@123',
      },
    });
    const pLogin = await apiRequest('/auth/login', {
      method: 'POST',
      body: { email: `driver_passenger_${timestamp}@test.com`, password: 'Password@123' },
    });
    passengerToken = pLogin.data.data.accessToken;

    // Setup base bus, route, and trips for Org 1 and Org 2
    const bus1Res = await apiRequest(`/organizations/${org1Id}/buses`, {
      method: 'POST',
      token: coord1Token,
      body: { plateNumber: `DRV-BUS1-${timestamp}`, model: 'Volvo 9700', capacity: 45 },
    });
    bus1Id = bus1Res.data.data.bus.id;

    const route1Res = await apiRequest(`/organizations/${org1Id}/routes`, {
      method: 'POST',
      token: coord1Token,
      body: { origin: `Origin1 ${timestamp}`, destination: `Dest1 ${timestamp}`, distanceKm: 250 },
    });
    route1Id = route1Res.data.data.route.id;

    const trip1Res = await apiRequest(`/organizations/${org1Id}/trips`, {
      method: 'POST',
      token: coord1Token,
      body: {
        busId: bus1Id,
        routeId: route1Id,
        departureTime: '2026-12-01T08:00:00Z',
        arrivalTime: '2026-12-01T12:00:00Z',
        fare: 400,
      },
    });
    trip1Id = trip1Res.data.data.trip.id;

    // Org 2 Setup
    const bus2Res = await apiRequest(`/organizations/${org2Id}/buses`, {
      method: 'POST',
      token: coord2Token,
      body: { plateNumber: `DRV-BUS2-${timestamp}`, model: 'Scania Touring', capacity: 50 },
    });
    bus2Id = bus2Res.data.data.bus.id;

    const route2Res = await apiRequest(`/organizations/${org2Id}/routes`, {
      method: 'POST',
      token: coord2Token,
      body: { origin: `Origin2 ${timestamp}`, destination: `Dest2 ${timestamp}`, distanceKm: 350 },
    });
    route2Id = route2Res.data.data.route.id;

    const trip2Res = await apiRequest(`/organizations/${org2Id}/trips`, {
      method: 'POST',
      token: coord2Token,
      body: {
        busId: bus2Id,
        routeId: route2Id,
        departureTime: '2026-12-01T09:00:00Z',
        arrivalTime: '2026-12-01T14:00:00Z',
        fare: 500,
      },
    });
    trip2Id = trip2Res.data.data.trip.id;
  });

  after(async () => {
    await stopTestServer();
  });

  // =========================================================================
  // A. AUTHENTICATION TESTS
  // =========================================================================
  describe('A. Driver Authentication', () => {
    it('1. Driver can login successfully with valid credentials', async () => {
      const res = await apiRequest('/auth/login', {
        method: 'POST',
        body: { email: 'driver@busticket.com', password: 'Driver@123456' },
      });
      assert.equal(res.status, 200);
      assert.equal(res.data.success, true);
      assert.ok(res.data.data.accessToken);
      assert.ok(res.data.data.user.roles.includes('DRIVER'));
    });

    it('2. Invalid driver credentials fail (401)', async () => {
      const res = await apiRequest('/auth/login', {
        method: 'POST',
        body: { email: 'driver@busticket.com', password: 'WrongPassword@123' },
      });
      assert.equal(res.status, 401);
      assert.equal(res.data.success, false);
    });

    it('3. Inactive driver cannot login (401/403)', async () => {
      // Temporarily deactivate driver
      await prisma.users.update({ where: { email: 'driver@busticket.com' }, data: { is_active: false } });

      const res = await apiRequest('/auth/login', {
        method: 'POST',
        body: { email: 'driver@busticket.com', password: 'Driver@123456' },
      });
      assert.ok([401, 403].includes(res.status));

      // Reactivate driver
      await prisma.users.update({ where: { email: 'driver@busticket.com' }, data: { is_active: true } });
    });

    it('4. Expired token fails (401)', async () => {
      const res = await apiRequest('/driver/me', {
        headers: { Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwiZXhwIjoxNTE2MjM5MDIyfQ.invalid' },
      });
      assert.equal(res.status, 401);
    });

    it('5. Missing token fails (401)', async () => {
      const res = await apiRequest('/driver/me');
      assert.equal(res.status, 401);
    });
  });

  // =========================================================================
  // B. AUTHORIZATION TESTS
  // =========================================================================
  describe('B. Driver RBAC & Endpoint Authorization', () => {
    it('6. Driver can access Driver endpoints (/driver/me, /driver/dashboard)', async () => {
      const meRes = await apiRequest('/driver/me', { token: driver1Token });
      assert.equal(meRes.status, 200);
      assert.equal(meRes.data.success, true);
      assert.equal(meRes.data.data.driver.email, 'driver@busticket.com');
      assert.ok(!meRes.data.data.driver.passwordHash);
      assert.ok(!meRes.data.data.driver.password_hash);

      const dashRes = await apiRequest('/driver/dashboard', { token: driver1Token });
      assert.equal(dashRes.status, 200);
      assert.equal(dashRes.data.success, true);
      assert.ok(dashRes.data.data.driver);
    });

    it('7. Passenger cannot access Driver endpoints (403)', async () => {
      const res = await apiRequest('/driver/me', { token: passengerToken });
      assert.equal(res.status, 403);
    });

    it('8. Ticket Verifier cannot access Driver management endpoints (403)', async () => {
      const res = await apiRequest(`/organizations/${org1Id}/drivers`, { token: verifierToken });
      assert.equal(res.status, 403);
    });

    it('9. Driver cannot access Admin endpoints (403)', async () => {
      const res = await apiRequest('/admin/dashboard', { token: driver1Token });
      assert.equal(res.status, 403);
    });

    it('10. Driver cannot access Manager-only endpoints (403)', async () => {
      const res = await apiRequest(`/organizations/${org1Id}/reports`, { token: driver1Token });
      assert.equal(res.status, 403);
    });
  });

  // =========================================================================
  // C. ORGANIZATION ISOLATION
  // =========================================================================
  describe('C. Organization Isolation & Boundary Enforcement', () => {
    it('11. Driver 1 cannot access Organization 2 endpoints (403/404)', async () => {
      const res = await apiRequest(`/organizations/${org2Id}/trips`, { token: driver1Token });
      assert.ok([403, 404].includes(res.status));
    });

    it('12. Driver 1 cannot access Driver 2 assigned trip (403/404)', async () => {
      // First assign Driver 2 to Trip 2
      await apiRequest(`/organizations/${org2Id}/trips/${trip2Id}/assign-driver`, {
        method: 'PATCH',
        token: coord2Token,
        body: { driverId: driver2User.id },
      });

      // Driver 1 attempts to view Trip 2
      const res = await apiRequest(`/driver/trips/${trip2Id}`, { token: driver1Token });
      assert.ok([403, 404].includes(res.status));
    });

    it('13. Manager 1 cannot view or access Driver 2 of Organization 2 (404)', async () => {
      const res = await apiRequest(`/organizations/${org1Id}/drivers/${driver2User.id}`, {
        token: coord1Token,
      });
      assert.equal(res.status, 404);
    });

    it('14. Manager 1 cannot assign Driver 2 to an Organization 1 trip (404)', async () => {
      const res = await apiRequest(`/organizations/${org1Id}/trips/${trip1Id}/assign-driver`, {
        method: 'PATCH',
        token: coord1Token,
        body: { driverId: driver2User.id },
      });
      assert.equal(res.status, 404);
    });

    it('15. Driver 1 cannot access another organization bus/route (403/404)', async () => {
      const resBus = await apiRequest(`/organizations/${org2Id}/buses/${bus2Id}`, { token: driver1Token });
      assert.ok([403, 404].includes(resBus.status));

      const resRoute = await apiRequest(`/organizations/${org2Id}/routes/${route2Id}`, { token: driver1Token });
      assert.ok([403, 404].includes(resRoute.status));
    });
  });

  // =========================================================================
  // D. DRIVER MANAGEMENT BY OPERATOR MANAGER
  // =========================================================================
  describe('D. Driver Management by Operational Manager', () => {
    let createdDriverId = null;

    it('16. Manager creates Driver successfully for their organization', async () => {
      const res = await apiRequest(`/organizations/${org1Id}/drivers`, {
        method: 'POST',
        token: coord1Token,
        body: {
          firstName: 'New',
          lastName: 'Driver',
          email: `new_driver_${timestamp}@test.com`,
          phone: `+251911${Math.floor(100000 + Math.random() * 900000)}`,
          password: 'Password@123',
        },
      });
      assert.equal(res.status, 201);
      assert.equal(res.data.success, true);
      assert.ok(res.data.data.driver || res.data.data.staff);
      const driver = res.data.data.driver || res.data.data.staff;
      assert.equal(driver.role, ROLES.DRIVER);
      createdDriverId = driver.id;
    });

    it('17. Created driver gets DRIVER role in DB', async () => {
      const userRole = await prisma.user_roles.findFirst({
        where: { user_id: createdDriverId, organization_id: org1Id },
        include: { roles: true },
      });
      assert.ok(userRole);
      assert.equal(userRole.roles.name, ROLES.DRIVER);
    });

    it('18. Driver belongs strictly to the organization that created it', async () => {
      const userRole = await prisma.user_roles.findFirst({
        where: { user_id: createdDriverId },
      });
      assert.equal(userRole.organization_id, org1Id);
    });

    it('19. Manager 1 cannot create Driver belonging to Organization 2 (403)', async () => {
      const res = await apiRequest(`/organizations/${org2Id}/drivers`, {
        method: 'POST',
        token: coord1Token,
        body: {
          firstName: 'Illegal',
          lastName: 'Driver',
          email: `illegal_driver_${timestamp}@test.com`,
        },
      });
      assert.equal(res.status, 403);
    });

    it('20. List Drivers returns only organization drivers', async () => {
      const res = await apiRequest(`/organizations/${org1Id}/drivers`, { token: coord1Token });
      assert.equal(res.status, 200);
      assert.equal(res.data.success, true);
      const drivers = res.data.data.drivers;
      assert.ok(drivers.length >= 1);
      const allOrgDrivers = drivers.every((d) => d.role === ROLES.DRIVER);
      assert.equal(allOrgDrivers, true);
      // Ensure Driver 2 (Org 2) is not in Org 1 list
      const hasDriver2 = drivers.some((d) => d.id === driver2User.id);
      assert.equal(hasDriver2, false);
    });

    it('21. Get Driver returns only accessible organization driver', async () => {
      const res = await apiRequest(`/organizations/${org1Id}/drivers/${createdDriverId}`, {
        token: coord1Token,
      });
      assert.equal(res.status, 200);
      assert.equal(res.data.data.driver.id, createdDriverId);
    });

    it('22. Update Driver works correctly', async () => {
      const res = await apiRequest(`/organizations/${org1Id}/drivers/${createdDriverId}`, {
        method: 'PATCH',
        token: coord1Token,
        body: { firstName: 'UpdatedName', phone: '+251999887766' },
      });
      assert.equal(res.status, 200);
      assert.equal(res.data.data.driver.firstName || res.data.data.driver.name.split(' ')[0], 'UpdatedName');
    });

    it('23. Toggle driver active status works correctly', async () => {
      const res = await apiRequest(`/organizations/${org1Id}/drivers/${createdDriverId}/status`, {
        method: 'PATCH',
        token: coord1Token,
        body: { isActive: false },
      });
      assert.equal(res.status, 200);
      assert.equal(res.data.data.driver.status, 'INACTIVE');
    });
  });

  // =========================================================================
  // E. TRIP ASSIGNMENT
  // =========================================================================
  describe('E. Trip Assignment by Operational Manager', () => {
    it('24. Manager assigns Driver to trip successfully', async () => {
      const res = await apiRequest(`/organizations/${org1Id}/trips/${trip1Id}/assign-driver`, {
        method: 'PATCH',
        token: coord1Token,
        body: { driverId: driver1User.id },
      });
      assert.equal(res.status, 200);
      assert.equal(res.data.success, true);
      assert.equal(res.data.data.trip.driver_id, driver1User.id);
    });

    it('25. Driver 1 can see assigned trip in /driver/trips', async () => {
      const res = await apiRequest('/driver/trips', { token: driver1Token });
      assert.equal(res.status, 200);
      assert.equal(res.data.success, true);
      const trips = res.data.data.trips;
      const found = trips.find((t) => t.id === trip1Id);
      assert.ok(found);
      assert.equal(found.driver_id, driver1User.id);
    });

    it('26. Driver 1 cannot see unassigned trip in /driver/trips', async () => {
      // Create unassigned trip
      const unassignedRes = await apiRequest(`/organizations/${org1Id}/trips`, {
        method: 'POST',
        token: coord1Token,
        body: {
          busId: bus1Id,
          routeId: route1Id,
          departureTime: '2026-12-05T08:00:00Z',
          fare: 450,
        },
      });
      const unassignedTripId = unassignedRes.data.data.trip.id;

      const res = await apiRequest('/driver/trips', { token: driver1Token });
      assert.equal(res.status, 200);
      const hasUnassigned = res.data.data.trips.some((t) => t.id === unassignedTripId);
      assert.equal(hasUnassigned, false);
    });

    it('27. Driver cannot be assigned to another organization trip (403/404)', async () => {
      const res = await apiRequest(`/organizations/${org2Id}/trips/${trip2Id}/assign-driver`, {
        method: 'PATCH',
        token: coord1Token, // Manager 1 attempting on Org 2 trip
        body: { driverId: driver1User.id },
      });
      assert.equal(res.status, 403);
    });

    it('28. Non-Driver user cannot be assigned as Driver (400/404)', async () => {
      const res = await apiRequest(`/organizations/${org1Id}/trips/${trip1Id}/assign-driver`, {
        method: 'PATCH',
        token: coord1Token,
        body: { driverId: coord1User.id }, // Coordinator is not a Driver
      });
      assert.equal(res.status, 400);
      assert.match(res.data.message, /DRIVER role/i);
    });

    it('29. Inactive Driver cannot be assigned to a trip (400)', async () => {
      // Create and deactivate a driver
      const newD = await apiRequest(`/organizations/${org1Id}/drivers`, {
        method: 'POST',
        token: coord1Token,
        body: {
          firstName: 'Inactive',
          lastName: 'Driver',
          email: `inactive_drv_${timestamp}@test.com`,
          password: 'Password@123',
        },
      });
      const inactiveDriverId = (newD.data.data.driver || newD.data.data.staff).id;
      await apiRequest(`/organizations/${org1Id}/drivers/${inactiveDriverId}/status`, {
        method: 'PATCH',
        token: coord1Token,
        body: { isActive: false },
      });

      const res = await apiRequest(`/organizations/${org1Id}/trips/${trip1Id}/assign-driver`, {
        method: 'PATCH',
        token: coord1Token,
        body: { driverId: inactiveDriverId },
      });
      assert.equal(res.status, 400);
      assert.match(res.data.message, /inactive driver/i);
    });

    it('30. Conflicting assignment is rejected (409 Conflict)', async () => {
      // Create a trip with overlapping departure/arrival with trip1 (2026-12-01T08:00:00Z to 12:00:00Z)
      const overlappingTripRes = await apiRequest(`/organizations/${org1Id}/trips`, {
        method: 'POST',
        token: coord1Token,
        body: {
          busId: bus1Id,
          routeId: route1Id,
          departureTime: '2026-12-01T10:00:00Z',
          arrivalTime: '2026-12-01T14:00:00Z',
          fare: 420,
        },
      });
      const overlappingTripId = overlappingTripRes.data.data.trip.id;

      // Assigning Driver 1 (already on trip1 from 08:00 to 12:00) should fail with 409
      const res = await apiRequest(`/organizations/${org1Id}/trips/${overlappingTripId}/assign-driver`, {
        method: 'PATCH',
        token: coord1Token,
        body: { driverId: driver1User.id },
      });
      assert.equal(res.status, 409);
      assert.match(res.data.message, /already assigned to another active trip/i);
    });
  });

  // =========================================================================
  // F. DRIVER TRIP OPERATIONS
  // =========================================================================
  describe('F. Driver Trip Operations (Start & Complete)', () => {
    it('31. Driver can view assigned trip details', async () => {
      const res = await apiRequest(`/driver/trips/${trip1Id}`, { token: driver1Token });
      assert.equal(res.status, 200);
      assert.equal(res.data.success, true);
      assert.equal(res.data.data.trip.id, trip1Id);
      assert.ok(res.data.data.trip.bus);
      assert.ok(res.data.data.trip.route);
    });

    it('32. Driver 1 cannot start Driver 2 trip (403/404)', async () => {
      const res = await apiRequest(`/driver/trips/${trip2Id}/start`, {
        method: 'POST',
        token: driver1Token,
      });
      assert.ok([403, 404].includes(res.status));
    });

    it('33. Driver 1 can start assigned trip -> status becomes IN_TRANSIT', async () => {
      const res = await apiRequest(`/driver/trips/${trip1Id}/start`, {
        method: 'POST',
        token: driver1Token,
      });
      assert.equal(res.status, 200);
      assert.equal(res.data.success, true);
      assert.ok(['IN_TRANSIT', 'IN_PROGRESS'].includes(res.data.data.trip.status));
    });

    it('34. Driver cannot start an already in-transit trip (400)', async () => {
      const res = await apiRequest(`/driver/trips/${trip1Id}/start`, {
        method: 'POST',
        token: driver1Token,
      });
      assert.equal(res.status, 400);
      assert.match(res.data.message, /already in progress/i);
    });

    it('35. Driver 1 cannot complete Driver 2 trip (403/404)', async () => {
      const res = await apiRequest(`/driver/trips/${trip2Id}/complete`, {
        method: 'POST',
        token: driver1Token,
      });
      assert.ok([403, 404].includes(res.status));
    });

    it('36. Driver cannot modify Manager-controlled trip fields (fare, route, bus)', async () => {
      // Drivers have no PATCH /organizations/:orgId/trips/:tripId permission
      const res = await apiRequest(`/organizations/${org1Id}/trips/${trip1Id}`, {
        method: 'PATCH',
        token: driver1Token,
        body: { fare: 999 },
      });
      assert.equal(res.status, 403);
    });

    it('37. Driver completes assigned trip -> status becomes COMPLETED', async () => {
      const res = await apiRequest(`/driver/trips/${trip1Id}/complete`, {
        method: 'POST',
        token: driver1Token,
      });
      assert.equal(res.status, 200);
      assert.equal(res.data.success, true);
      assert.equal(res.data.data.trip.status, 'COMPLETED');
    });

    it('38. Driver cannot complete an already completed trip (400)', async () => {
      const res = await apiRequest(`/driver/trips/${trip1Id}/complete`, {
        method: 'POST',
        token: driver1Token,
      });
      assert.equal(res.status, 400);
      assert.match(res.data.message, /already completed/i);
    });
  });

  // =========================================================================
  // G. DRIVER PROBLEM REPORTING
  // =========================================================================
  describe('G. Driver Incident & Problem Reporting', () => {
    let trip3Id = null;

    before(async () => {
      // Create and assign a fresh trip to Driver 1 for reporting problems
      const res = await apiRequest(`/organizations/${org1Id}/trips`, {
        method: 'POST',
        token: coord1Token,
        body: {
          busId: bus1Id,
          routeId: route1Id,
          driverId: driver1User.id,
          departureTime: '2026-12-10T08:00:00Z',
          fare: 400,
        },
      });
      trip3Id = res.data.data.trip.id;
    });

    it('39. Driver can report a problem for assigned trip', async () => {
      const res = await apiRequest(`/driver/trips/${trip3Id}/problems`, {
        method: 'POST',
        token: driver1Token,
        body: {
          type: 'VEHICLE_PROBLEM',
          description: 'Engine temperature indicator warning illuminated on dashboard.',
        },
      });
      assert.equal(res.status, 201);
      assert.equal(res.data.success, true);
      assert.equal(res.data.data.report.type, 'VEHICLE_PROBLEM');
      assert.equal(res.data.data.report.trip_id, trip3Id);
      assert.equal(res.data.data.report.driver_id, driver1User.id);
      reportedProblemId = res.data.data.report.id;
    });

    it('40. Driver cannot report problem for another driver trip (403/404)', async () => {
      const res = await apiRequest(`/driver/trips/${trip2Id}/problems`, {
        method: 'POST',
        token: driver1Token,
        body: {
          type: 'DELAY',
          description: 'Flat tire near toll gate.',
        },
      });
      assert.ok([403, 404].includes(res.status));
    });

    it('41. Invalid problem type fails validation (400)', async () => {
      const res = await apiRequest(`/driver/trips/${trip3Id}/problems`, {
        method: 'POST',
        token: driver1Token,
        body: {
          type: 'INVALID_CATEGORY',
          description: 'Something happened.',
        },
      });
      assert.equal(res.status, 400);
      assert.equal(res.data.success, false);
    });

    it('42. Empty description fails validation (400)', async () => {
      const res = await apiRequest(`/driver/trips/${trip3Id}/problems`, {
        method: 'POST',
        token: driver1Token,
        body: {
          type: 'ACCIDENT',
          description: '  ',
        },
      });
      assert.equal(res.status, 400);
      assert.equal(res.data.success, false);
    });

    it('43. Driver can view submitted reports for their trip & history', async () => {
      const resTrip = await apiRequest(`/driver/trips/${trip3Id}/problems`, { token: driver1Token });
      assert.equal(resTrip.status, 200);
      assert.ok(resTrip.data.data.reports.length >= 1);

      const resHist = await apiRequest('/driver/problems', { token: driver1Token });
      assert.equal(resHist.status, 200);
      assert.ok(resHist.data.data.reports.length >= 1);
    });

    it('44. Operational Manager can view problem reports for their organization', async () => {
      const res = await apiRequest(`/organizations/${org1Id}/problems`, { token: coord1Token });
      assert.equal(res.status, 200);
      assert.equal(res.data.success, true);
      assert.ok(res.data.data.reports.length >= 1);
      const found = res.data.data.reports.find((r) => r.id === reportedProblemId);
      assert.ok(found);
      assert.equal(found.type, 'VEHICLE_PROBLEM');
    });

    it('45. Operational Manager of Org 2 cannot view Org 1 problem reports (403/isolated)', async () => {
      // Manager 2 querying their own org should see 0 reports from Org 1
      const res = await apiRequest(`/organizations/${org2Id}/problems`, { token: coord2Token });
      assert.equal(res.status, 200);
      const hasOrg1Report = res.data.data.reports.some((r) => r.id === reportedProblemId);
      assert.equal(hasOrg1Report, false);

      // Manager 2 querying Org 1 endpoint directly fails with 403
      const crossRes = await apiRequest(`/organizations/${org1Id}/problems`, { token: coord2Token });
      assert.equal(crossRes.status, 403);
    });

    it('46. Operational Manager resolves problem report', async () => {
      const res = await apiRequest(`/organizations/${org1Id}/problems/${reportedProblemId}/resolve`, {
        method: 'PATCH',
        token: coord1Token,
        body: { status: 'RESOLVED', notes: 'Maintenance crew dispatched and replaced sensor.' },
      });
      assert.equal(res.status, 200);
      assert.equal(res.data.success, true);
      assert.equal(res.data.data.report.status, 'RESOLVED');
      assert.ok(res.data.data.report.resolved_at);
      assert.equal(res.data.data.report.resolved_by, coord1User.id);
    });
  });

  // =========================================================================
  // H. COMPLETE END-TO-END WORKFLOW
  // =========================================================================
  describe('H. Full End-to-End Operational Lifecycle', () => {
    const e2eTs = Date.now();
    let newOrgId = null;
    let newManagerToken = null;
    let newDriverToken = null;
    let newDriverId = null;
    let newBusId = null;
    let newRouteId = null;
    let newTripId = null;
    let e2eProblemId = null;

    it('Step 1: Admin registers new Operator Organization', async () => {
      const res = await apiRequest('/organizations', {
        method: 'POST',
        token: adminToken,
        body: {
          name: `Abay Bus Transport ${e2eTs}`,
          type: 'COMPANY',
        },
      });
      assert.equal(res.status, 201);
      newOrgId = res.data.data.organization.id;
    });

    it('Step 2: Admin approves the organization', async () => {
      const res = await apiRequest(`/admin/organizations/${newOrgId}/approve`, {
        method: 'PATCH',
        token: adminToken,
      });
      assert.equal(res.status, 200);
    });

    it('Step 3: Admin creates Manager for the organization & Manager logs in', async () => {
      await apiRequest('/users', {
        method: 'POST',
        token: adminToken,
        body: {
          firstName: 'Abay',
          lastName: 'Manager',
          email: `abay_mgr_${e2eTs}@test.com`,
          password: 'Password@123',
          role: ROLES.BOOKING_COORDINATOR,
          organizationId: newOrgId,
        },
      });

      const loginRes = await apiRequest('/auth/login', {
        method: 'POST',
        body: { email: `abay_mgr_${e2eTs}@test.com`, password: 'Password@123' },
      });
      assert.equal(loginRes.status, 200);
      newManagerToken = loginRes.data.data.accessToken;
    });

    it('Step 4: Manager creates Bus', async () => {
      const res = await apiRequest(`/organizations/${newOrgId}/buses`, {
        method: 'POST',
        token: newManagerToken,
        body: { plateNumber: `ABAY-${e2eTs}`, model: 'Yutong Master', capacity: 50 },
      });
      assert.equal(res.status, 201);
      newBusId = res.data.data.bus.id;
    });

    it('Step 5: Manager creates Route', async () => {
      const res = await apiRequest(`/organizations/${newOrgId}/routes`, {
        method: 'POST',
        token: newManagerToken,
        body: { origin: `Bahir Dar ${e2eTs}`, destination: `Gondar ${e2eTs}`, distanceKm: 180 },
      });
      assert.equal(res.status, 201);
      newRouteId = res.data.data.route.id;
    });

    it('Step 6: Manager creates Driver', async () => {
      const res = await apiRequest(`/organizations/${newOrgId}/drivers`, {
        method: 'POST',
        token: newManagerToken,
        body: {
          firstName: 'Abebe',
          lastName: 'Driver',
          email: `abebe_driver_${e2eTs}@test.com`,
          password: 'Password@123',
          phone: `+251933${Math.floor(100000 + Math.random() * 900000)}`,
        },
      });
      assert.equal(res.status, 201);
      newDriverId = (res.data.data.driver || res.data.data.staff).id;
    });

    it('Step 7: Manager creates Trip', async () => {
      const res = await apiRequest(`/organizations/${newOrgId}/trips`, {
        method: 'POST',
        token: newManagerToken,
        body: {
          busId: newBusId,
          routeId: newRouteId,
          departureTime: '2026-12-20T06:00:00Z',
          arrivalTime: '2026-12-20T09:30:00Z',
          fare: 350,
        },
      });
      assert.equal(res.status, 201);
      newTripId = res.data.data.trip.id;
    });

    it('Step 8: Manager assigns Driver to the Trip', async () => {
      const res = await apiRequest(`/organizations/${newOrgId}/trips/${newTripId}/assign-driver`, {
        method: 'PATCH',
        token: newManagerToken,
        body: { driverId: newDriverId },
      });
      assert.equal(res.status, 200);
      assert.equal(res.data.data.trip.driver_id, newDriverId);
    });

    it('Step 9: Driver logs in & views assigned trip', async () => {
      const loginRes = await apiRequest('/auth/login', {
        method: 'POST',
        body: { email: `abebe_driver_${e2eTs}@test.com`, password: 'Password@123' },
      });
      assert.equal(loginRes.status, 200);
      newDriverToken = loginRes.data.data.accessToken;

      const tripsRes = await apiRequest('/driver/trips', { token: newDriverToken });
      assert.equal(tripsRes.status, 200);
      assert.equal(tripsRes.data.data.trips.length, 1);
      assert.equal(tripsRes.data.data.trips[0].id, newTripId);
    });

    it('Step 10: Driver starts Trip -> status becomes IN_TRANSIT', async () => {
      const res = await apiRequest(`/driver/trips/${newTripId}/start`, {
        method: 'POST',
        token: newDriverToken,
      });
      assert.equal(res.status, 200);
      assert.ok(['IN_TRANSIT', 'IN_PROGRESS'].includes(res.data.data.trip.status));
    });

    it('Step 11: Driver reports an operational problem on the trip', async () => {
      const res = await apiRequest(`/driver/trips/${newTripId}/problems`, {
        method: 'POST',
        token: newDriverToken,
        body: {
          type: 'DELAY',
          description: 'Road construction near bridge causing 30 minute delay.',
        },
      });
      assert.equal(res.status, 201);
      e2eProblemId = res.data.data.report.id;
    });

    it('Step 12: Manager views the problem report in organization problem list', async () => {
      const res = await apiRequest(`/organizations/${newOrgId}/problems`, {
        token: newManagerToken,
      });
      assert.equal(res.status, 200);
      assert.ok(res.data.data.reports.some((r) => r.id === e2eProblemId));
    });

    it('Step 13: Driver completes the trip -> status becomes COMPLETED', async () => {
      const res = await apiRequest(`/driver/trips/${newTripId}/complete`, {
        method: 'POST',
        token: newDriverToken,
      });
      assert.equal(res.status, 200);
      assert.equal(res.data.data.trip.status, 'COMPLETED');
    });

    it('Step 14: Final trip verification matches state and audit logs exist', async () => {
      const tripRes = await apiRequest(`/driver/trips/${newTripId}`, { token: newDriverToken });
      assert.equal(tripRes.status, 200);
      assert.equal(tripRes.data.data.trip.status, 'COMPLETED');
      assert.ok(tripRes.data.data.trip.problemReports.length >= 1);

      // Verify audit logs in DB
      const logs = await prisma.audit_logs.findMany({
        where: { user_id: newDriverId },
      });
      assert.ok(logs.length >= 1);
    });
  });
});
