import test, { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startTestServer, stopTestServer, apiRequest, prisma } from './test-helper.js';
import { ROLES } from '../constants/index.js';

describe('4. User Management Test Suite', () => {
  const timestamp = Date.now();
  let adminToken = null;
  let adminUser = null;
  let passengerToken = null;
  let passengerUser = null;
  let managedUserId = null;

  before(async () => {
    await startTestServer();

    // 1. Admin login
    const adminLogin = await apiRequest('/auth/login', {
      method: 'POST',
      body: { email: 'admin@busticket.com', password: 'Admin@123456' },
    });
    adminToken = adminLogin.data.data.accessToken;
    adminUser = adminLogin.data.data.user;

    // 2. Passenger login
    const p = await apiRequest('/auth/register', {
      method: 'POST',
      body: {
        firstName: 'Normal',
        lastName: 'User',
        email: `normal_${timestamp}@test.com`,
        password: 'Password@123',
        confirmPassword: 'Password@123',
      },
    });
    passengerUser = p.data.data.user;
    const pLogin = await apiRequest('/auth/login', {
      method: 'POST',
      body: { email: `normal_${timestamp}@test.com`, password: 'Password@123' },
    });
    passengerToken = pLogin.data.data.accessToken;
  });

  after(async () => {
    // Cleanup
    const userIds = [passengerUser?.id, managedUserId].filter(Boolean);
    for (const uid of userIds) {
      await prisma.user_roles.deleteMany({ where: { user_id: uid } });
      await prisma.refresh_tokens.deleteMany({ where: { user_id: uid } });
      await prisma.audit_logs.deleteMany({ where: { user_id: uid } });
      await prisma.users.delete({ where: { id: uid } }).catch(() => {});
    }
    await stopTestServer();
  });

  it('GET /users - fail (403) when called by Passenger', async () => {
    const res = await apiRequest('/users', { token: passengerToken });
    assert.equal(res.status, 403);
  });

  it('GET /users - succeed (200) with pagination and filtering for Admin', async () => {
    const res = await apiRequest('/users?page=1&limit=5', { token: adminToken });
    assert.equal(res.status, 200);
    assert.ok(res.data.data.users.length > 0);
    assert.ok(res.data.data.total > 0);
  });

  it('POST /users - fail (403) when called by non-admin', async () => {
    const res = await apiRequest('/users', {
      method: 'POST',
      token: passengerToken,
      body: {
        firstName: 'Hacker',
        lastName: 'Attempt',
        email: `hacker_${timestamp}@test.com`,
        password: 'Password@123',
      },
    });
    assert.equal(res.status, 403);
  });

  it('POST /users - fail (400) on validation error (invalid email format)', async () => {
    const res = await apiRequest('/users', {
      method: 'POST',
      token: adminToken,
      body: {
        firstName: 'Bad',
        lastName: 'Email',
        email: 'not-an-email',
        password: 'Password@123',
      },
    });
    assert.equal(res.status, 400);
  });

  it('POST /users - succeed (201) when Admin creates user', async () => {
    const res = await apiRequest('/users', {
      method: 'POST',
      token: adminToken,
      body: {
        firstName: 'Staff',
        lastName: 'Member',
        email: `staff_${timestamp}@test.com`,
        password: 'Password@123',
        role: ROLES.PASSENGER,
      },
    });
    assert.equal(res.status, 201);
    assert.equal(res.data.success, true);
    managedUserId = res.data.data.user.id;
  });

  it('POST /users - fail (409) when creating user with duplicate email', async () => {
    const res = await apiRequest('/users', {
      method: 'POST',
      token: adminToken,
      body: {
        firstName: 'Staff',
        lastName: 'Member',
        email: `staff_${timestamp}@test.com`,
        password: 'Password@123',
      },
    });
    assert.equal(res.status, 409);
    assert.match(res.data.message, /already exists/);
  });

  it('GET /users/:id - succeed (200) for Self', async () => {
    const res = await apiRequest(`/users/${passengerUser.id}`, { token: passengerToken });
    assert.equal(res.status, 200);
    assert.equal(res.data.data.user.id, passengerUser.id);
  });

  it('GET /users/:id - fail (403) for another passenger attempting to view profile', async () => {
    const res = await apiRequest(`/users/${managedUserId}`, { token: passengerToken });
    assert.equal(res.status, 403);
  });

  it('GET /users/:id - succeed (200) for Admin viewing any user', async () => {
    const res = await apiRequest(`/users/${managedUserId}`, { token: adminToken });
    assert.equal(res.status, 200);
    assert.equal(res.data.data.user.id, managedUserId);
  });

  it('GET /users/:id - fail (404) for non-existent UUID', async () => {
    const res = await apiRequest('/users/00000000-0000-0000-0000-999999999999', { token: adminToken });
    assert.equal(res.status, 404);
  });

  it('PATCH /users/:id - succeed (200) when Admin updates user name', async () => {
    const res = await apiRequest(`/users/${managedUserId}`, {
      method: 'PATCH',
      token: adminToken,
      body: { firstName: 'UpdatedName' },
    });
    assert.equal(res.status, 200);
    assert.equal(res.data.data.user.firstName, 'UpdatedName');
  });

  it('PATCH /users/:id/status - succeed (200) when Admin deactivates user', async () => {
    const res = await apiRequest(`/users/${managedUserId}/status`, {
      method: 'PATCH',
      token: adminToken,
      body: { isActive: false },
    });
    assert.equal(res.status, 200);
    assert.equal(res.data.data.user.isActive, false);

    // Verify deactivated user cannot log in
    const loginRes = await apiRequest('/auth/login', {
      method: 'POST',
      body: { email: `staff_${timestamp}@test.com`, password: 'Password@123' },
    });
    assert.equal(loginRes.status, 403);
    assert.match(loginRes.data.message, /Account has been deactivated/);
  });

  it('PATCH /users/:id/status - fail (400) when Admin attempts self-deactivation', async () => {
    const res = await apiRequest(`/users/${adminUser.id}/status`, {
      method: 'PATCH',
      token: adminToken,
      body: { isActive: false },
    });
    assert.equal(res.status, 400);
    assert.match(res.data.message, /Self-deactivation is prohibited/);
  });
});
