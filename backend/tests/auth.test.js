import test, { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startTestServer, stopTestServer, apiRequest, prisma } from './test-helper.js';

describe('1. Authentication Test Suite', () => {
  const timestamp = Date.now();
  const testUserEmail = `passenger_${timestamp}@test.com`;
  const testPassword = 'Password@123';
  let accessToken = null;
  let refreshTokenCookie = null;
  let createdUserId = null;

  before(async () => {
    await startTestServer();
  });

  after(async () => {
    // Cleanup test user
    if (createdUserId) {
      await prisma.user_roles.deleteMany({ where: { user_id: createdUserId } });
      await prisma.refresh_tokens.deleteMany({ where: { user_id: createdUserId } });
      await prisma.password_reset_tokens.deleteMany({ where: { user_id: createdUserId } });
      await prisma.email_verification_tokens.deleteMany({ where: { user_id: createdUserId } });
      await prisma.audit_logs.deleteMany({ where: { user_id: createdUserId } });
      await prisma.users.delete({ where: { id: createdUserId } }).catch(() => {});
    }
    await stopTestServer();
  });

  it('Health Check - should return 200 UP', async () => {
    const res = await apiRequest('/health');
    assert.equal(res.status, 200);
    assert.equal(res.data.status, 'UP');
  });

  it('POST /auth/register - should fail (400) on validation error (mismatched password)', async () => {
    const res = await apiRequest('/auth/register', {
      method: 'POST',
      body: {
        firstName: 'John',
        lastName: 'Doe',
        email: `invalid_${timestamp}@test.com`,
        password: testPassword,
        confirmPassword: 'MismatchPassword@123',
      },
    });
    assert.equal(res.status, 400);
    assert.equal(res.data.success, false);
  });

  it('POST /auth/register - should fail (400) on weak password', async () => {
    const res = await apiRequest('/auth/register', {
      method: 'POST',
      body: {
        firstName: 'John',
        lastName: 'Doe',
        email: `weak_${timestamp}@test.com`,
        password: 'weak',
        confirmPassword: 'weak',
      },
    });
    assert.equal(res.status, 400);
    assert.equal(res.data.success, false);
  });

  it('POST /auth/register - should succeed (201) and assign default PASSENGER role', async () => {
    const res = await apiRequest('/auth/register', {
      method: 'POST',
      body: {
        firstName: 'Test',
        lastName: 'Passenger',
        email: testUserEmail,
        password: testPassword,
        confirmPassword: testPassword,
      },
    });
    assert.equal(res.status, 201);
    assert.equal(res.data.success, true);
    assert.equal(res.data.data.user.email, testUserEmail);
    assert.deepEqual(res.data.data.user.roles, ['PASSENGER']);
    createdUserId = res.data.data.user.id;
  });

  it('POST /auth/register - should fail (400) with duplicate email', async () => {
    const res = await apiRequest('/auth/register', {
      method: 'POST',
      body: {
        firstName: 'Test',
        lastName: 'Passenger',
        email: testUserEmail,
        password: testPassword,
        confirmPassword: testPassword,
      },
    });
    assert.equal(res.status, 400);
    assert.equal(res.data.success, false);
  });

  it('POST /auth/login - should fail (401) with incorrect password', async () => {
    const res = await apiRequest('/auth/login', {
      method: 'POST',
      body: {
        email: testUserEmail,
        password: 'WrongPassword@123',
      },
    });
    assert.equal(res.status, 401);
    assert.equal(res.data.success, false);
  });

  it('POST /auth/login - should succeed (200) with correct credentials', async () => {
    const res = await apiRequest('/auth/login', {
      method: 'POST',
      body: {
        email: testUserEmail,
        password: testPassword,
      },
    });
    assert.equal(res.status, 200);
    assert.equal(res.data.success, true);
    assert.ok(res.data.data.accessToken);
    assert.ok(res.cookie);
    accessToken = res.data.data.accessToken;
    refreshTokenCookie = res.cookie.split(';')[0];
  });

  it('GET /auth/me - should succeed (200) with valid Bearer token', async () => {
    const res = await apiRequest('/auth/me', {
      token: accessToken,
    });
    assert.equal(res.status, 200);
    assert.equal(res.data.data.user.email, testUserEmail);
    assert.deepEqual(res.data.data.user.roles, ['PASSENGER']);
  });

  it('GET /auth/me - should fail (401) without authentication token', async () => {
    const res = await apiRequest('/auth/me');
    assert.equal(res.status, 401);
    assert.equal(res.data.success, false);
  });

  it('GET /auth/me - should fail (401) with invalid token', async () => {
    const res = await apiRequest('/auth/me', {
      token: 'invalid.jwt.token',
    });
    assert.equal(res.status, 401);
  });

  it('POST /auth/refresh - should succeed (200) and rotate refresh token', async () => {
    const res = await apiRequest('/auth/refresh', {
      method: 'POST',
      cookie: refreshTokenCookie,
    });
    assert.equal(res.status, 200);
    assert.ok(res.data.data.accessToken);
    assert.ok(res.cookie);
    // update accessToken and cookie
    accessToken = res.data.data.accessToken;
    const oldCookie = refreshTokenCookie;
    refreshTokenCookie = res.cookie.split(';')[0];

    // Testing Token Reuse Attack: Using the old revoked refresh token should trigger reuse detection
    const reuseRes = await apiRequest('/auth/refresh', {
      method: 'POST',
      cookie: oldCookie,
    });
    assert.equal(reuseRes.status, 401);
    assert.match(reuseRes.data.message, /Invalid session state detected/);
  });

  it('Account Lockout - 5 consecutive failed logins should lock account (423)', async () => {
    // Create a disposable user for lockout test
    const lockoutEmail = `lockout_${timestamp}@test.com`;
    const regRes = await apiRequest('/auth/register', {
      method: 'POST',
      body: {
        firstName: 'Lockout',
        lastName: 'Test',
        email: lockoutEmail,
        password: testPassword,
        confirmPassword: testPassword,
      },
    });
    assert.equal(regRes.status, 201);
    const lockoutUserId = regRes.data.data.user.id;

    // Fail 5 times
    for (let i = 0; i < 5; i++) {
      const failRes = await apiRequest('/auth/login', {
        method: 'POST',
        body: { email: lockoutEmail, password: 'WrongPassword@999' },
      });
      assert.equal(failRes.status, 401);
    }

    // 6th attempt should return 423 Account Locked
    const lockedRes = await apiRequest('/auth/login', {
      method: 'POST',
      body: { email: lockoutEmail, password: testPassword },
    });
    assert.equal(lockedRes.status, 423);
    assert.match(lockedRes.data.message, /Account is temporarily locked/);

    // Cleanup lockout user
    await prisma.user_roles.deleteMany({ where: { user_id: lockoutUserId } });
    await prisma.refresh_tokens.deleteMany({ where: { user_id: lockoutUserId } });
    await prisma.users.delete({ where: { id: lockoutUserId } }).catch(() => {});
  });

  it('POST /auth/change-password - should fail (400) if current password wrong', async () => {
    // Login to get fresh tokens
    const loginRes = await apiRequest('/auth/login', {
      method: 'POST',
      body: { email: testUserEmail, password: testPassword },
    });
    const freshToken = loginRes.data.data.accessToken;

    const res = await apiRequest('/auth/change-password', {
      method: 'POST',
      token: freshToken,
      body: {
        currentPassword: 'WrongCurrentPassword@123',
        newPassword: 'NewPassword@999',
        confirmPassword: 'NewPassword@999',
      },
    });
    assert.equal(res.status, 400);
  });

  it('POST /auth/change-password - should succeed (200) with correct current password', async () => {
    const loginRes = await apiRequest('/auth/login', {
      method: 'POST',
      body: { email: testUserEmail, password: testPassword },
    });
    const freshToken = loginRes.data.data.accessToken;

    const res = await apiRequest('/auth/change-password', {
      method: 'POST',
      token: freshToken,
      body: {
        currentPassword: testPassword,
        newPassword: 'NewPassword@999',
        confirmPassword: 'NewPassword@999',
      },
    });
    assert.equal(res.status, 200);
    assert.ok(res.data.data.accessToken);

    // Revert password back for cleanup
    await apiRequest('/auth/change-password', {
      method: 'POST',
      token: res.data.data.accessToken,
      body: {
        currentPassword: 'NewPassword@999',
        newPassword: testPassword,
        confirmPassword: testPassword,
      },
    });
  });

  it('POST /auth/logout - should succeed (200) and revoke session', async () => {
    const loginRes = await apiRequest('/auth/login', {
      method: 'POST',
      body: { email: testUserEmail, password: testPassword },
    });
    const token = loginRes.data.data.accessToken;
    const cookie = loginRes.cookie.split(';')[0];

    const logoutRes = await apiRequest('/auth/logout', {
      method: 'POST',
      token,
      cookie,
    });
    assert.equal(logoutRes.status, 200);
    assert.equal(logoutRes.data.success, true);
  });
});
