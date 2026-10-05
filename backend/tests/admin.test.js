import test, { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startTestServer, stopTestServer, apiRequest, prisma } from './test-helper.js';
import { ROLES } from '../constants/index.js';
import { ORGANIZATION_STATUS, ORGANIZATION_TYPES } from '../constants/organization.js';

describe('5. Platform Admin - Dashboard and Organization Management Test Suite', () => {
  const timestamp = Date.now();
  let adminToken = null;
  let adminUser = null;
  let passengerToken = null;
  let passengerUser = null;
  let coordinatorToken = null;
  let coordinatorUser = null;
  let verifierToken = null;
  let verifierUser = null;

  const createdOrgIds = [];
  const org1Id = '00000000-0000-0000-0000-000000000001'; // Seeded Selam Bus Line

  before(async () => {
    await startTestServer();

    // 1. Admin login
    const adminLogin = await apiRequest('/auth/login', {
      method: 'POST',
      body: { email: 'admin@busticket.com', password: 'Admin@123456' },
    });
    adminToken = adminLogin.data.data.accessToken;
    adminUser = adminLogin.data.data.user;

    // 2. Create Passenger
    const p = await apiRequest('/auth/register', {
      method: 'POST',
      body: {
        firstName: 'AdminTest',
        lastName: 'Passenger',
        email: `passenger_admintest_${timestamp}@test.com`,
        password: 'Password@123',
        confirmPassword: 'Password@123',
      },
    });
    passengerUser = p.data.data.user;
    const pLogin = await apiRequest('/auth/login', {
      method: 'POST',
      body: { email: `passenger_admintest_${timestamp}@test.com`, password: 'Password@123' },
    });
    passengerToken = pLogin.data.data.accessToken;

    // 3. Create Coordinator
    const c = await apiRequest('/users', {
      method: 'POST',
      token: adminToken,
      body: {
        firstName: 'AdminTest',
        lastName: 'Coordinator',
        email: `coord_admintest_${timestamp}@test.com`,
        password: 'Password@123',
        role: ROLES.BOOKING_COORDINATOR,
        organizationId: org1Id,
      },
    });
    coordinatorUser = c.data.data.user;
    const cLogin = await apiRequest('/auth/login', {
      method: 'POST',
      body: { email: `coord_admintest_${timestamp}@test.com`, password: 'Password@123' },
    });
    coordinatorToken = cLogin.data.data.accessToken;

    // 4. Create Verifier
    const v = await apiRequest('/users', {
      method: 'POST',
      token: adminToken,
      body: {
        firstName: 'AdminTest',
        lastName: 'Verifier',
        email: `verifier_admintest_${timestamp}@test.com`,
        password: 'Password@123',
        role: ROLES.TICKET_VERIFIER,
        organizationId: org1Id,
      },
    });
    verifierUser = v.data.data.user;
    const vLogin = await apiRequest('/auth/login', {
      method: 'POST',
      body: { email: `verifier_admintest_${timestamp}@test.com`, password: 'Password@123' },
    });
    verifierToken = vLogin.data.data.accessToken;
  });

  after(async () => {
    // Cleanup created test organizations
    for (const id of createdOrgIds) {
      await prisma.audit_logs.deleteMany({
        where: {
          details: {
            path: ['organizationId'],
            equals: id,
          },
        },
      }).catch(() => {});
      await prisma.user_roles.deleteMany({ where: { organization_id: id } }).catch(() => {});
      await prisma.organizations.delete({ where: { id } }).catch(() => {});
    }

    // Cleanup test users
    const uids = [passengerUser?.id, coordinatorUser?.id, verifierUser?.id].filter(Boolean);
    for (const uid of uids) {
      await prisma.user_roles.deleteMany({ where: { user_id: uid } }).catch(() => {});
      await prisma.refresh_tokens.deleteMany({ where: { user_id: uid } }).catch(() => {});
      await prisma.audit_logs.deleteMany({ where: { user_id: uid } }).catch(() => {});
      await prisma.users.delete({ where: { id: uid } }).catch(() => {});
    }

    await stopTestServer();
  });

  // =========================================================================
  // 1. PLATFORM ADMIN DASHBOARD
  // =========================================================================
  describe('GET /api/v1/admin/dashboard', () => {
    it('should fail (401) with no token', async () => {
      const res = await apiRequest('/admin/dashboard');
      assert.equal(res.status, 401);
    });

    it('should fail (401) with invalid token', async () => {
      const res = await apiRequest('/admin/dashboard', { token: 'invalid.bearer.token' });
      assert.equal(res.status, 401);
    });

    it('should fail (403) when called by PASSENGER', async () => {
      const res = await apiRequest('/admin/dashboard', { token: passengerToken });
      assert.equal(res.status, 403);
    });

    it('should fail (403) when called by BOOKING_COORDINATOR', async () => {
      const res = await apiRequest('/admin/dashboard', { token: coordinatorToken });
      assert.equal(res.status, 403);
    });

    it('should fail (403) when called by TICKET_VERIFIER', async () => {
      const res = await apiRequest('/admin/dashboard', { token: verifierToken });
      assert.equal(res.status, 403);
    });

    it('should succeed (200) for ADMIN and return accurate platform statistics', async () => {
      const res = await apiRequest('/admin/dashboard', { token: adminToken });
      assert.equal(res.status, 200);
      assert.equal(res.data.success, true);

      const { organizations, users, trips, fleet, bookings, financials } = res.data.data;

      // Real organization stats
      assert.ok(typeof organizations.total === 'number');
      assert.ok(typeof organizations.pending === 'number');
      assert.ok(typeof organizations.approved === 'number');
      assert.ok(typeof organizations.rejected === 'number');
      assert.ok(typeof organizations.suspended === 'number');
      assert.equal(organizations.total, organizations.pending + organizations.approved + organizations.rejected + organizations.suspended);
      assert.ok(organizations.approved >= 2); // At least the 2 seed orgs

      // Real user stats
      assert.ok(typeof users.total === 'number');
      assert.ok(typeof users.active === 'number');
      assert.ok(typeof users.emailVerified === 'number');
      assert.ok(users.total >= 4);

      // Unimplemented modules explicitly marked as unavailable
      assert.equal(trips.status, 'UNAVAILABLE');
      assert.equal(fleet.status, 'UNAVAILABLE');
      assert.equal(bookings.status, 'UNAVAILABLE');
      assert.equal(financials.status, 'UNAVAILABLE');
    });
  });

  // =========================================================================
  // 2. ORGANIZATION LIST & DETAILS
  // =========================================================================
  describe('GET /api/v1/admin/organizations & /:id', () => {
    it('GET /admin/organizations - fail (401) without authentication', async () => {
      const res = await apiRequest('/admin/organizations');
      assert.equal(res.status, 401);
    });

    it('GET /admin/organizations - fail (403) for non-admin (PASSENGER, COORDINATOR)', async () => {
      const pRes = await apiRequest('/admin/organizations', { token: passengerToken });
      assert.equal(pRes.status, 403);

      const cRes = await apiRequest('/admin/organizations', { token: coordinatorToken });
      assert.equal(cRes.status, 403);
    });

    it('GET /admin/organizations - succeed (200) for ADMIN with pagination', async () => {
      const res = await apiRequest('/admin/organizations?page=1&limit=10', { token: adminToken });
      assert.equal(res.status, 200);
      assert.equal(res.data.success, true);
      assert.ok(res.data.data.organizations.length >= 2);
      assert.equal(res.data.data.page, 1);
      assert.equal(res.data.data.limit, 10);
      assert.ok(res.data.data.total >= 2);

      const first = res.data.data.organizations[0];
      assert.ok(first.id);
      assert.ok(first.name);
      assert.ok(first.status);
      assert.ok('isActive' in first);
      assert.ok('memberCount' in first);
    });

    it('GET /admin/organizations - filter by status=APPROVED', async () => {
      const res = await apiRequest('/admin/organizations?status=APPROVED', { token: adminToken });
      assert.equal(res.status, 200);
      for (const org of res.data.data.organizations) {
        assert.equal(org.status, 'APPROVED');
      }
    });

    it('GET /admin/organizations - fail (400) on invalid status filter', async () => {
      const res = await apiRequest('/admin/organizations?status=INVALID_STATUS', { token: adminToken });
      assert.equal(res.status, 400);
      assert.equal(res.data.success, false);
    });

    it('GET /admin/organizations/:id - fail (400) on invalid UUID', async () => {
      const res = await apiRequest('/admin/organizations/not-a-uuid', { token: adminToken });
      assert.equal(res.status, 400);
    });

    it('GET /admin/organizations/:id - fail (404) on non-existent UUID', async () => {
      const res = await apiRequest('/admin/organizations/00000000-0000-0000-0000-999999999999', { token: adminToken });
      assert.equal(res.status, 404);
    });

    it('GET /admin/organizations/:id - succeed (200) for ADMIN viewing seed org', async () => {
      const res = await apiRequest(`/admin/organizations/${org1Id}`, { token: adminToken });
      assert.equal(res.status, 200);
      assert.equal(res.data.success, true);
      const org = res.data.data.organization;
      assert.equal(org.id, org1Id);
      assert.equal(org.name, 'Selam Bus Line');
      assert.equal(org.status, 'APPROVED');
      assert.ok(Array.isArray(org.members));
      assert.ok(org.members.length >= 1);
      assert.ok(org.approvalInfo);
      // Ensure no sensitive credential leak
      for (const m of org.members) {
        assert.equal(m.password_hash, undefined);
        assert.equal(m.password, undefined);
      }
    });
  });

  // =========================================================================
  // 3. COMPLETE WORKFLOW: REGISTER -> PENDING -> APPROVE -> SUSPEND -> ACTIVATE
  // =========================================================================
  describe('Complete Organization Lifecycle Workflow', () => {
    let testOrgId = null;

    it('Step 1: Register Organization starts as PENDING', async () => {
      // Create new organization directly in DB simulating partner registration
      const newOrg = await prisma.organizations.create({
        data: {
          name: `Abay Bus Transport ${timestamp}`,
          type: ORGANIZATION_TYPES.PRIVATE_BUS_COMPANY,
          status: ORGANIZATION_STATUS.PENDING,
          is_active: false,
        },
      });
      testOrgId = newOrg.id;
      createdOrgIds.push(testOrgId);

      assert.ok(testOrgId);
      assert.equal(newOrg.status, 'PENDING');
      assert.equal(newOrg.is_active, false);
    });

    it('Step 2: ADMIN views organization details while PENDING', async () => {
      const res = await apiRequest(`/admin/organizations/${testOrgId}`, { token: adminToken });
      assert.equal(res.status, 200);
      assert.equal(res.data.data.organization.status, 'PENDING');
      assert.equal(res.data.data.organization.isActive, false);
    });

    it('Step 2b: Invalid transition - cannot suspend a PENDING organization (400)', async () => {
      const res = await apiRequest(`/admin/organizations/${testOrgId}/suspend`, {
        method: 'PATCH',
        token: adminToken,
        body: { reason: 'Cannot suspend pending' },
      });
      assert.equal(res.status, 400);
      assert.match(res.data.message, /Cannot suspend a pending organization/i);
    });

    it('Step 2c: Invalid transition - cannot activate a PENDING organization (400)', async () => {
      const res = await apiRequest(`/admin/organizations/${testOrgId}/activate`, {
        method: 'PATCH',
        token: adminToken,
      });
      assert.equal(res.status, 400);
      assert.match(res.data.message, /Only SUSPENDED organizations can be activated/i);
    });

    it('Step 3: ADMIN approves organization -> APPROVED', async () => {
      const res = await apiRequest(`/admin/organizations/${testOrgId}/approve`, {
        method: 'PATCH',
        token: adminToken,
      });
      assert.equal(res.status, 200);
      assert.equal(res.data.success, true);
      assert.equal(res.data.data.organization.status, 'APPROVED');
      assert.equal(res.data.data.organization.isActive, true);

      // Verify in DB
      const dbOrg = await prisma.organizations.findUnique({ where: { id: testOrgId } });
      assert.equal(dbOrg.status, 'APPROVED');
      assert.equal(dbOrg.is_active, true);

      // Verify audit log recorded
      const audit = await prisma.audit_logs.findFirst({
        where: {
          action: 'ORGANIZATION_APPROVED',
          details: { path: ['organizationId'], equals: testOrgId },
        },
      });
      assert.ok(audit);
      assert.equal(audit.user_id, adminUser.id);
    });

    it('Step 3b: Invalid transition - cannot approve an already APPROVED organization (400)', async () => {
      const res = await apiRequest(`/admin/organizations/${testOrgId}/approve`, {
        method: 'PATCH',
        token: adminToken,
      });
      assert.equal(res.status, 400);
      assert.match(res.data.message, /already approved/i);
    });

    it('Step 3c: Invalid transition - cannot reject an already APPROVED organization (400)', async () => {
      const res = await apiRequest(`/admin/organizations/${testOrgId}/reject`, {
        method: 'PATCH',
        token: adminToken,
        body: { reason: 'Should use suspend instead' },
      });
      assert.equal(res.status, 400);
      assert.match(res.data.message, /Cannot reject an already approved organization/i);
    });

    it('Step 4: ADMIN suspends organization -> SUSPENDED', async () => {
      const res = await apiRequest(`/admin/organizations/${testOrgId}/suspend`, {
        method: 'PATCH',
        token: adminToken,
        body: { reason: 'Compliance document expired' },
      });
      assert.equal(res.status, 200);
      assert.equal(res.data.success, true);
      assert.equal(res.data.data.organization.status, 'SUSPENDED');
      assert.equal(res.data.data.organization.isActive, false);

      // Verify in DB
      const dbOrg = await prisma.organizations.findUnique({ where: { id: testOrgId } });
      assert.equal(dbOrg.status, 'SUSPENDED');
      assert.equal(dbOrg.is_active, false);

      // Verify audit log recorded
      const audit = await prisma.audit_logs.findFirst({
        where: {
          action: 'ORGANIZATION_SUSPENDED',
          details: { path: ['organizationId'], equals: testOrgId },
        },
      });
      assert.ok(audit);
      assert.equal(audit.details.reason, 'Compliance document expired');
    });

    it('Step 4b: Invalid transition - cannot suspend an already SUSPENDED organization (400)', async () => {
      const res = await apiRequest(`/admin/organizations/${testOrgId}/suspend`, {
        method: 'PATCH',
        token: adminToken,
      });
      assert.equal(res.status, 400);
      assert.match(res.data.message, /already suspended/i);
    });

    it('Step 4c: Invalid transition - cannot reject a SUSPENDED organization (400)', async () => {
      const res = await apiRequest(`/admin/organizations/${testOrgId}/reject`, {
        method: 'PATCH',
        token: adminToken,
      });
      assert.equal(res.status, 400);
      assert.match(res.data.message, /Cannot reject a suspended organization/i);
    });

    it('Step 5: ADMIN reactivates organization via /activate -> APPROVED', async () => {
      const res = await apiRequest(`/admin/organizations/${testOrgId}/activate`, {
        method: 'PATCH',
        token: adminToken,
      });
      assert.equal(res.status, 200);
      assert.equal(res.data.success, true);
      assert.equal(res.data.data.organization.status, 'APPROVED');
      assert.equal(res.data.data.organization.isActive, true);

      // Verify in DB
      const dbOrg = await prisma.organizations.findUnique({ where: { id: testOrgId } });
      assert.equal(dbOrg.status, 'APPROVED');
      assert.equal(dbOrg.is_active, true);
    });
  });

  // =========================================================================
  // 4. REJECTION WORKFLOW
  // =========================================================================
  describe('Organization Rejection Workflow', () => {
    let rejectOrgId = null;

    before(async () => {
      const org = await prisma.organizations.create({
        data: {
          name: `Fraudulent Bus Line ${timestamp}`,
          type: ORGANIZATION_TYPES.TRANSPORT_ASSOCIATION,
          status: ORGANIZATION_STATUS.PENDING,
          is_active: false,
        },
      });
      rejectOrgId = org.id;
      createdOrgIds.push(rejectOrgId);
    });

    it('ADMIN rejects PENDING organization with reason -> REJECTED', async () => {
      const res = await apiRequest(`/admin/organizations/${rejectOrgId}/reject`, {
        method: 'PATCH',
        token: adminToken,
        body: { reason: 'Invalid business license provided' },
      });
      assert.equal(res.status, 200);
      assert.equal(res.data.success, true);
      assert.equal(res.data.data.organization.status, 'REJECTED');
      assert.equal(res.data.data.organization.isActive, false);

      // Verify in DB
      const dbOrg = await prisma.organizations.findUnique({ where: { id: rejectOrgId } });
      assert.equal(dbOrg.status, 'REJECTED');
      assert.equal(dbOrg.is_active, false);

      // Verify audit log has the rejection reason
      const audit = await prisma.audit_logs.findFirst({
        where: {
          action: 'ORGANIZATION_REJECTED',
          details: { path: ['organizationId'], equals: rejectOrgId },
        },
      });
      assert.ok(audit);
      assert.equal(audit.details.reason, 'Invalid business license provided');
    });

    it('Invalid transition - cannot reject an already REJECTED organization (400)', async () => {
      const res = await apiRequest(`/admin/organizations/${rejectOrgId}/reject`, {
        method: 'PATCH',
        token: adminToken,
      });
      assert.equal(res.status, 400);
      assert.match(res.data.message, /already rejected/i);
    });

    it('Invalid transition - cannot approve a REJECTED organization (400)', async () => {
      const res = await apiRequest(`/admin/organizations/${rejectOrgId}/approve`, {
        method: 'PATCH',
        token: adminToken,
      });
      assert.equal(res.status, 400);
      assert.match(res.data.message, /Cannot approve a rejected organization/i);
    });

    it('Invalid transition - cannot suspend a REJECTED organization (400)', async () => {
      const res = await apiRequest(`/admin/organizations/${rejectOrgId}/suspend`, {
        method: 'PATCH',
        token: adminToken,
      });
      assert.equal(res.status, 400);
      assert.match(res.data.message, /Cannot suspend a rejected organization/i);
    });
  });

  // =========================================================================
  // 5. SECURITY & AUTHORIZATION TESTS
  // =========================================================================
  describe('Security & Role Authorization Enforcement', () => {
    it('PATCH /admin/organizations/:id/approve - fail (401) without token', async () => {
      const res = await apiRequest(`/admin/organizations/${org1Id}/approve`, { method: 'PATCH' });
      assert.equal(res.status, 401);
    });

    it('PATCH /admin/organizations/:id/approve - fail (403) for PASSENGER', async () => {
      const res = await apiRequest(`/admin/organizations/${org1Id}/approve`, {
        method: 'PATCH',
        token: passengerToken,
      });
      assert.equal(res.status, 403);
    });

    it('PATCH /admin/organizations/:id/approve - fail (403) for BOOKING_COORDINATOR', async () => {
      const res = await apiRequest(`/admin/organizations/${org1Id}/approve`, {
        method: 'PATCH',
        token: coordinatorToken,
      });
      assert.equal(res.status, 403);
    });

    it('PATCH /admin/organizations/:id/approve - fail (403) for TICKET_VERIFIER', async () => {
      const res = await apiRequest(`/admin/organizations/${org1Id}/approve`, {
        method: 'PATCH',
        token: verifierToken,
      });
      assert.equal(res.status, 403);
    });

    it('PATCH /admin/organizations/:id/reject - fail (403) for PASSENGER', async () => {
      const res = await apiRequest(`/admin/organizations/${org1Id}/reject`, {
        method: 'PATCH',
        token: passengerToken,
        body: { reason: 'Test' },
      });
      assert.equal(res.status, 403);
    });

    it('PATCH /admin/organizations/:id/suspend - fail (403) for PASSENGER', async () => {
      const res = await apiRequest(`/admin/organizations/${org1Id}/suspend`, {
        method: 'PATCH',
        token: passengerToken,
        body: { reason: 'Test' },
      });
      assert.equal(res.status, 403);
    });

    it('PATCH /admin/organizations/:id/activate - fail (403) for PASSENGER', async () => {
      const res = await apiRequest(`/admin/organizations/${org1Id}/activate`, {
        method: 'PATCH',
        token: passengerToken,
      });
      assert.equal(res.status, 403);
    });

    it('Action on non-existent organization returns 404', async () => {
      const res = await apiRequest('/admin/organizations/00000000-0000-0000-0000-999999999999/approve', {
        method: 'PATCH',
        token: adminToken,
      });
      assert.equal(res.status, 404);
    });

    it('Action with invalid UUID format returns 400', async () => {
      const res = await apiRequest('/admin/organizations/invalid-uuid/approve', {
        method: 'PATCH',
        token: adminToken,
      });
      assert.equal(res.status, 400);
    });
  });
});
