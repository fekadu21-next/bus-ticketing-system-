import test, { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startTestServer, stopTestServer, apiRequest, prisma } from './test-helper.js';
import { ROLES } from '../constants/index.js';

describe('3. Organization & Scoped Boundary Authorization Test Suite', () => {
  const timestamp = Date.now();
  let adminToken = null;
  let coordOrg1Token = null;
  let coordOrg1User = null;
  let coordOrg2Token = null;
  let coordOrg2User = null;
  let verifierOrg1Token = null;
  let verifierOrg1User = null;
  let passengerToken = null;
  let passengerUser = null;

  const org1Id = '00000000-0000-0000-0000-000000000001'; // Selam Bus Line
  const org2Id = '00000000-0000-0000-0000-000000000002'; // Sky Bus Transport System
  let createdOrgId = null;

  before(async () => {
    await startTestServer();

    // 1. Admin login
    const adminLogin = await apiRequest('/auth/login', {
      method: 'POST',
      body: { email: 'admin@busticket.com', password: 'Admin@123456' },
    });
    adminToken = adminLogin.data.data.accessToken;

    // 2. Coordinator for Org 1
    const c1 = await apiRequest('/users', {
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
    coordOrg1User = c1.data.data.user;
    const c1Login = await apiRequest('/auth/login', {
      method: 'POST',
      body: { email: `coord_org1_${timestamp}@test.com`, password: 'Password@123' },
    });
    coordOrg1Token = c1Login.data.data.accessToken;

    // 3. Coordinator for Org 2
    const c2 = await apiRequest('/users', {
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
    coordOrg2User = c2.data.data.user;
    const c2Login = await apiRequest('/auth/login', {
      method: 'POST',
      body: { email: `coord_org2_${timestamp}@test.com`, password: 'Password@123' },
    });
    coordOrg2Token = c2Login.data.data.accessToken;

    // 4. Verifier for Org 1
    const v1 = await apiRequest('/users', {
      method: 'POST',
      token: adminToken,
      body: {
        firstName: 'Verifier',
        lastName: 'Org1',
        email: `verifier_org1_${timestamp}@test.com`,
        password: 'Password@123',
        role: ROLES.TICKET_VERIFIER,
        organizationId: org1Id,
      },
    });
    verifierOrg1User = v1.data.data.user;
    const v1Login = await apiRequest('/auth/login', {
      method: 'POST',
      body: { email: `verifier_org1_${timestamp}@test.com`, password: 'Password@123' },
    });
    verifierOrg1Token = v1Login.data.data.accessToken;

    // 5. Passenger
    const p = await apiRequest('/auth/register', {
      method: 'POST',
      body: {
        firstName: 'Public',
        lastName: 'Passenger',
        email: `passenger_orgtest_${timestamp}@test.com`,
        password: 'Password@123',
        confirmPassword: 'Password@123',
      },
    });
    passengerUser = p.data.data.user;
    const pLogin = await apiRequest('/auth/login', {
      method: 'POST',
      body: { email: `passenger_orgtest_${timestamp}@test.com`, password: 'Password@123' },
    });
    passengerToken = pLogin.data.data.accessToken;
  });

  after(async () => {
    // Cleanup users
    const userIds = [coordOrg1User?.id, coordOrg2User?.id, verifierOrg1User?.id, passengerUser?.id].filter(Boolean);
    for (const uid of userIds) {
      await prisma.user_roles.deleteMany({ where: { user_id: uid } });
      await prisma.refresh_tokens.deleteMany({ where: { user_id: uid } });
      await prisma.audit_logs.deleteMany({ where: { user_id: uid } });
      await prisma.users.delete({ where: { id: uid } }).catch(() => {});
    }

    if (createdOrgId) {
      await prisma.organizations.delete({ where: { id: createdOrgId } }).catch(() => {});
    }
    await stopTestServer();
  });

  it('GET /organizations - should list organizations for any authenticated user (200)', async () => {
    const res = await apiRequest('/organizations', { token: passengerToken });
    assert.equal(res.status, 200);
    assert.ok(res.data.data.organizations.length >= 2);
  });

  it('POST /organizations - fail (403) when called by passenger or coordinator', async () => {
    const passRes = await apiRequest('/organizations', {
      method: 'POST',
      token: passengerToken,
      body: { name: `Test Bus ${timestamp}` },
    });
    assert.equal(passRes.status, 403);

    const coordRes = await apiRequest('/organizations', {
      method: 'POST',
      token: coordOrg1Token,
      body: { name: `Test Bus ${timestamp}` },
    });
    assert.equal(coordRes.status, 403);
  });

  it('POST /organizations - succeed (201) when called by Admin', async () => {
    const res = await apiRequest('/organizations', {
      method: 'POST',
      token: adminToken,
      body: { name: `Golden Bus Line ${timestamp}`, type: 'COMPANY' },
    });
    assert.equal(res.status, 201);
    assert.equal(res.data.success, true);
    createdOrgId = res.data.data.organization.id;
  });

  it('POST /organizations - fail (409) on duplicate organization name', async () => {
    const res = await apiRequest('/organizations', {
      method: 'POST',
      token: adminToken,
      body: { name: `Golden Bus Line ${timestamp}` },
    });
    assert.equal(res.status, 409);
    assert.match(res.data.message, /already exists/);
  });

  // --- BOUNDARY VIOLATION TESTS ---

  it('Trip Creation - Coordinator A schedules trip in assigned Org 1 (201 SUCCESS)', async () => {
    const res = await apiRequest(`/organizations/${org1Id}/trips`, {
      method: 'POST',
      token: coordOrg1Token,
      body: {
        origin: 'Addis Ababa',
        destination: 'Hawassa',
        departureTime: '2026-10-01T06:00:00Z',
        price: 500,
      },
    });
    assert.equal(res.status, 201);
    assert.equal(res.data.data.trip.organizationId, org1Id);
  });

  it('Trip Creation - Coordinator A schedules trip in UNASSIGNED Org 2 (403 FORBIDDEN - Boundary Violation)', async () => {
    const res = await apiRequest(`/organizations/${org2Id}/trips`, {
      method: 'POST',
      token: coordOrg1Token,
      body: {
        origin: 'Addis Ababa',
        destination: 'Bahir Dar',
        departureTime: '2026-10-01T06:00:00Z',
        price: 600,
      },
    });
    assert.equal(res.status, 403);
    assert.match(res.data.message, /do not have the required role/);
  });

  it('Ticket Verification - Verifier A validates ticket in assigned Org 1 (200 SUCCESS)', async () => {
    const res = await apiRequest(`/organizations/${org1Id}/verify-ticket`, {
      method: 'POST',
      token: verifierOrg1Token,
      body: { ticketCode: 'TKT-12345' },
    });
    assert.equal(res.status, 200);
    assert.equal(res.data.data.status, 'VALIDATED');
    assert.equal(res.data.data.organizationId, org1Id);
  });

  it('Ticket Verification - Verifier A validates ticket in UNASSIGNED Org 2 (403 FORBIDDEN - Boundary Violation)', async () => {
    const res = await apiRequest(`/organizations/${org2Id}/verify-ticket`, {
      method: 'POST',
      token: verifierOrg1Token,
      body: { ticketCode: 'TKT-12345' },
    });
    assert.equal(res.status, 403);
    assert.match(res.data.message, /do not have the required role/);
  });

  it('Passenger Role Restrictions - Passenger denied (403) from trips and verification', async () => {
    const tripRes = await apiRequest(`/organizations/${org1Id}/trips`, {
      method: 'POST',
      token: passengerToken,
      body: { origin: 'Addis', destination: 'Adama', departureTime: '2026-10-01T06:00:00Z', price: 200 },
    });
    assert.equal(tripRes.status, 403);

    const verifRes = await apiRequest(`/organizations/${org1Id}/verify-ticket`, {
      method: 'POST',
      token: passengerToken,
      body: { ticketCode: 'TKT-99999' },
    });
    assert.equal(verifRes.status, 403);
  });

  it('ADMIN Superuser - Platform-wide access across Org 1 and Org 2 (201/200 SUCCESS)', async () => {
    // Admin creates trip in Org 1
    const tripOrg1 = await apiRequest(`/organizations/${org1Id}/trips`, {
      method: 'POST',
      token: adminToken,
      body: { origin: 'Addis', destination: 'Hawassa', departureTime: '2026-10-01T06:00:00Z', price: 500 },
    });
    assert.equal(tripOrg1.status, 201);

    // Admin creates trip in Org 2
    const tripOrg2 = await apiRequest(`/organizations/${org2Id}/trips`, {
      method: 'POST',
      token: adminToken,
      body: { origin: 'Addis', destination: 'Gondar', departureTime: '2026-10-01T06:00:00Z', price: 800 },
    });
    assert.equal(tripOrg2.status, 201);

    // Admin verifies ticket in Org 1 & Org 2
    const vOrg1 = await apiRequest(`/organizations/${org1Id}/verify-ticket`, {
      method: 'POST',
      token: adminToken,
      body: { ticketCode: 'TKT-ADMIN-1' },
    });
    assert.equal(vOrg1.status, 200);

    const vOrg2 = await apiRequest(`/organizations/${org2Id}/verify-ticket`, {
      method: 'POST',
      token: adminToken,
      body: { ticketCode: 'TKT-ADMIN-2' },
    });
    assert.equal(vOrg2.status, 200);
  });
});
