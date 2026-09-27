import test, { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startTestServer, stopTestServer, apiRequest, prisma } from './test-helper.js';
import { ROLES } from '../constants/index.js';

describe('2. RBAC & Permissions Test Suite', () => {
  const timestamp = Date.now();
  let adminToken = null;
  let adminUser = null;
  let passengerToken = null;
  let passengerUser = null;
  let coordinatorToken = null;
  let coordinatorUser = null;
  let verifierToken = null;
  let verifierUser = null;
  let assignedUserRoleId = null;

  const orgId = '00000000-0000-0000-0000-000000000001'; // Selam Bus Line

  before(async () => {
    await startTestServer();

    // 1. Login default Admin
    const adminLogin = await apiRequest('/auth/login', {
      method: 'POST',
      body: { email: 'admin@busticket.com', password: 'Admin@123456' },
    });
    assert.equal(adminLogin.status, 200);
    adminToken = adminLogin.data.data.accessToken;
    adminUser = adminLogin.data.data.user;

    // 2. Create Passenger
    const passReg = await apiRequest('/auth/register', {
      method: 'POST',
      body: {
        firstName: 'Pass',
        lastName: 'User',
        email: `pass_${timestamp}@test.com`,
        password: 'Password@123',
        confirmPassword: 'Password@123',
      },
    });
    assert.equal(passReg.status, 201);
    passengerUser = passReg.data.data.user;
    const passLogin = await apiRequest('/auth/login', {
      method: 'POST',
      body: { email: `pass_${timestamp}@test.com`, password: 'Password@123' },
    });
    passengerToken = passLogin.data.data.accessToken;

    // 3. Create Booking Coordinator via Admin
    const coordRes = await apiRequest('/users', {
      method: 'POST',
      token: adminToken,
      body: {
        firstName: 'Coordinator',
        lastName: 'User',
        email: `coord_${timestamp}@test.com`,
        password: 'Password@123',
        role: ROLES.BOOKING_COORDINATOR,
        organizationId: orgId,
      },
    });
    assert.equal(coordRes.status, 201);
    coordinatorUser = coordRes.data.data.user;
    const coordLogin = await apiRequest('/auth/login', {
      method: 'POST',
      body: { email: `coord_${timestamp}@test.com`, password: 'Password@123' },
    });
    coordinatorToken = coordLogin.data.data.accessToken;

    // 4. Create Ticket Verifier via Admin
    const verifierRes = await apiRequest('/users', {
      method: 'POST',
      token: adminToken,
      body: {
        firstName: 'Verifier',
        lastName: 'User',
        email: `verifier_${timestamp}@test.com`,
        password: 'Password@123',
        role: ROLES.TICKET_VERIFIER,
        organizationId: orgId,
      },
    });
    assert.equal(verifierRes.status, 201);
    verifierUser = verifierRes.data.data.user;
    const verifierLogin = await apiRequest('/auth/login', {
      method: 'POST',
      body: { email: `verifier_${timestamp}@test.com`, password: 'Password@123' },
    });
    verifierToken = verifierLogin.data.data.accessToken;
  });

  after(async () => {
    // Cleanup test users
    const userIds = [passengerUser?.id, coordinatorUser?.id, verifierUser?.id].filter(Boolean);
    for (const uid of userIds) {
      await prisma.user_roles.deleteMany({ where: { user_id: uid } });
      await prisma.refresh_tokens.deleteMany({ where: { user_id: uid } });
      await prisma.audit_logs.deleteMany({ where: { user_id: uid } });
      await prisma.users.delete({ where: { id: uid } }).catch(() => {});
    }
    await stopTestServer();
  });

  it('GET /rbac/roles - should return exactly the 4 required canonical roles', async () => {
    const res = await apiRequest('/rbac/roles', { token: adminToken });
    assert.equal(res.status, 200);
    const roleNames = res.data.data.roles.map((r) => r.name);
    assert.ok(roleNames.includes(ROLES.ADMIN));
    assert.ok(roleNames.includes(ROLES.BOOKING_COORDINATOR));
    assert.ok(roleNames.includes(ROLES.PASSENGER));
    assert.ok(roleNames.includes(ROLES.TICKET_VERIFIER));
    // Verify legacy names are absent
    assert.ok(!roleNames.includes('PLATFORM_ADMIN'));
    assert.ok(!roleNames.includes('OPERATIONAL_MANAGER'));
  });

  it('GET /rbac/permissions - should return system permissions list', async () => {
    const res = await apiRequest('/rbac/permissions', { token: adminToken });
    assert.equal(res.status, 200);
    assert.ok(res.data.data.permissions.length >= 15);
  });

  it('GET /admin/test - Role Authorization: ADMIN (200), PASSENGER (403), COORDINATOR (403), VERIFIER (403)', async () => {
    const adminRes = await apiRequest('/admin/test', { token: adminToken });
    assert.equal(adminRes.status, 200);
    assert.equal(adminRes.data.success, true);

    const passRes = await apiRequest('/admin/test', { token: passengerToken });
    assert.equal(passRes.status, 403);

    const coordRes = await apiRequest('/admin/test', { token: coordinatorToken });
    assert.equal(coordRes.status, 403);

    const verifRes = await apiRequest('/admin/test', { token: verifierToken });
    assert.equal(verifRes.status, 403);
  });

  it('POST /rbac/users/:userId/roles - fail (403) when called by non-admin', async () => {
    const res = await apiRequest(`/rbac/users/${passengerUser.id}/roles`, {
      method: 'POST',
      token: passengerToken,
      body: { roleName: ROLES.BOOKING_COORDINATOR, organizationId: orgId },
    });
    assert.equal(res.status, 403);
  });

  it('POST /rbac/users/:userId/roles - fail (400) on self-role modification by admin', async () => {
    const res = await apiRequest(`/rbac/users/${adminUser.id}/roles`, {
      method: 'POST',
      token: adminToken,
      body: { roleName: ROLES.PASSENGER },
    });
    assert.equal(res.status, 400);
    assert.match(res.data.message, /Self-role modification is prohibited/);
  });

  it('POST /rbac/users/:userId/roles - fail (400) when assigning coordinator without organization', async () => {
    const res = await apiRequest(`/rbac/users/${passengerUser.id}/roles`, {
      method: 'POST',
      token: adminToken,
      body: { roleName: ROLES.BOOKING_COORDINATOR },
    });
    assert.equal(res.status, 400);
    assert.match(res.data.message, /Organization ID is required/);
  });

  it('POST /rbac/users/:userId/roles - succeed (201) assigning BOOKING_COORDINATOR with valid org to passenger', async () => {
    const res = await apiRequest(`/rbac/users/${passengerUser.id}/roles`, {
      method: 'POST',
      token: adminToken,
      body: { roleName: ROLES.BOOKING_COORDINATOR, organizationId: orgId },
    });
    assert.equal(res.status, 201);
    assert.equal(res.data.data.assignment.roleName, ROLES.BOOKING_COORDINATOR);
    assert.equal(res.data.data.assignment.organizationId, orgId);
    assignedUserRoleId = res.data.data.assignment.userRoleId;
  });

  it('POST /rbac/users/:userId/roles - fail (409) when assigning duplicate role for same organization', async () => {
    const res = await apiRequest(`/rbac/users/${passengerUser.id}/roles`, {
      method: 'POST',
      token: adminToken,
      body: { roleName: ROLES.BOOKING_COORDINATOR, organizationId: orgId },
    });
    assert.equal(res.status, 409);
    assert.match(res.data.message, /already holds the role/);
  });

  it('POST /rbac/users/:userId/roles - multi-org support: allow same role in a DIFFERENT organization', async () => {
    const secondOrgId = '00000000-0000-0000-0000-000000000002'; // Sky Bus
    const res = await apiRequest(`/rbac/users/${passengerUser.id}/roles`, {
      method: 'POST',
      token: adminToken,
      body: { roleName: ROLES.BOOKING_COORDINATOR, organizationId: secondOrgId },
    });
    assert.equal(res.status, 201);
    assert.equal(res.data.data.assignment.organizationId, secondOrgId);

    // Cleanup second role assignment
    await prisma.user_roles.delete({ where: { id: res.data.data.assignment.userRoleId } });
  });

  it('DELETE /rbac/users/:userId/roles/:userRoleId - succeed (200) revoking assigned role', async () => {
    const res = await apiRequest(`/rbac/users/${passengerUser.id}/roles/${assignedUserRoleId}`, {
      method: 'DELETE',
      token: adminToken,
    });
    assert.equal(res.status, 200);
    assert.equal(res.data.success, true);
  });

  it('DELETE /rbac/users/:userId/roles/:userRoleId - fail (400) revoking only role (cannot leave 0 roles)', async () => {
    // Passenger only has PASSENGER role left now
    const rolesRes = await apiRequest(`/rbac/users/${passengerUser.id}/roles`, { token: adminToken });
    const onlyRole = rolesRes.data.data.userRoles[0];

    const res = await apiRequest(`/rbac/users/${passengerUser.id}/roles/${onlyRole.userRoleId}`, {
      method: 'DELETE',
      token: adminToken,
    });
    assert.equal(res.status, 400);
    assert.match(res.data.message, /must hold at least one active role/);
  });
});
