import test, { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startTestServer, stopTestServer, apiRequest, prisma } from './test-helper.js';
import { ROLES } from '../constants/index.js';
import { NOTIFICATION_TYPES } from '../constants/notification.js';

describe('Organization Lifecycle & Notifications Integration Tests', () => {
  const timestamp = Date.now();
  const phone1 = `+25191${timestamp.toString().slice(-7)}`;
  const phone2 = `+25192${timestamp.toString().slice(-7)}`;
  const phone3 = `+25193${timestamp.toString().slice(-7)}`;
  const phone4 = `+25194${timestamp.toString().slice(-7)}`;

  let adminToken = null;
  let adminUserId = null;

  let pendingOrgId = null;
  let pendingOrgName = `Test Express Lines ${timestamp}`;
  let managerEmail = `manager_${timestamp}@testexpress.com`;
  let managerPassword = 'Password@123';
  let managerToken = null;
  let managerUserId = null;

  let rejectedOrgId = null;
  let rejectedOrgName = `Reject Bus Co ${timestamp}`;
  let rejectedManagerEmail = `reject_manager_${timestamp}@rejectbus.com`;
  let rejectedManagerToken = null;
  let rejectedManagerUserId = null;

  before(async () => {
    await startTestServer();

    // 1. Log in as platform administrator
    const adminLoginRes = await apiRequest('/auth/login', {
      method: 'POST',
      body: { email: 'admin@busticket.com', password: 'Admin@123456' },
    });
    assert.equal(adminLoginRes.status, 200, 'Admin should log in successfully');
    adminToken = adminLoginRes.data.data.accessToken;
    adminUserId = adminLoginRes.data.data.user.id;
  });

  after(async () => {
    // Cleanup created test organizations and notifications
    try {
      if (pendingOrgId) {
        await prisma.notifications.deleteMany({
          where: { metadata: { path: ['organizationId'], equals: pendingOrgId } },
        });
        await prisma.user_roles.deleteMany({ where: { organization_id: pendingOrgId } });
        await prisma.buses.deleteMany({ where: { organization_id: pendingOrgId } });
        await prisma.routes.deleteMany({ where: { organization_id: pendingOrgId } });
        await prisma.organizations.deleteMany({ where: { id: pendingOrgId } });
      }
      if (rejectedOrgId) {
        await prisma.notifications.deleteMany({
          where: { metadata: { path: ['organizationId'], equals: rejectedOrgId } },
        });
        await prisma.user_roles.deleteMany({ where: { organization_id: rejectedOrgId } });
        await prisma.organizations.deleteMany({ where: { id: rejectedOrgId } });
      }
      if (managerUserId) {
        await prisma.users.deleteMany({ where: { id: managerUserId } });
      }
      if (rejectedManagerUserId) {
        await prisma.users.deleteMany({ where: { id: rejectedManagerUserId } });
      }
    } catch (e) {
      // non-fatal cleanup
    }

    await stopTestServer();
  });

  it('1. Register partner organization: sets PENDING status and sends admin approval notification with metadata', async () => {
    const regRes = await apiRequest('/auth/register-partner', {
      method: 'POST',
      body: {
        orgName: pendingOrgName,
        orgType: 'INTERCITY',
        orgEmail: `contact@testexpress${timestamp}.com`,
        orgPhone: phone1,
        city: 'Addis Ababa',
        address: 'Bole Medhanialem, Suite 402',
        regNumber: `REG-${timestamp}`,
        repFullName: 'Abebe Kebede',
        repPosition: 'Chief Operations Officer',
        repPhone: phone2,
        repEmail: managerEmail,
        email: managerEmail,
        password: managerPassword,
        confirmPassword: managerPassword,
      },
    });

    assert.equal(regRes.status, 201, `Partner registration should succeed: ${JSON.stringify(regRes.data)}`);
    assert.equal(regRes.data.success, true);
    assert.ok(regRes.data.data.organization?.id, 'Organization ID should be returned');

    pendingOrgId = regRes.data.data.organization.id;
    managerUserId = regRes.data.data.user.id;

    // Verify DB state of organization
    const orgInDb = await prisma.organizations.findUnique({
      where: { id: pendingOrgId },
    });
    assert.ok(orgInDb, 'Organization should exist in database');
    assert.equal(orgInDb.status, 'PENDING', 'Organization status should be PENDING');
    assert.equal(orgInDb.is_active, false, 'Organization is_active should be false until approved');

    // Verify Admin notification was generated with all required details
    const adminNotifications = await prisma.notifications.findMany({
      where: {
        user_id: adminUserId,
        type: NOTIFICATION_TYPES.ORGANIZATION_APPROVAL_REQUEST,
      },
      orderBy: { created_at: 'desc' },
      take: 5,
    });

    const matchingNotif = adminNotifications.find(
      (n) => n.metadata && n.metadata.organizationId === pendingOrgId
    );
    assert.ok(matchingNotif, 'Admin should have received an ORGANIZATION_APPROVAL_REQUEST notification');
    assert.equal(matchingNotif.metadata.organizationName, pendingOrgName);
    assert.equal(matchingNotif.metadata.operationalManagerName, 'Abebe Kebede');
    assert.equal(matchingNotif.metadata.operationalManagerEmail, managerEmail);
    assert.equal(matchingNotif.metadata.operationalManagerPosition, 'Chief Operations Officer');
    assert.ok(matchingNotif.metadata.registrationDate, 'Registration date must be present in metadata');
    assert.ok(matchingNotif.metadata.details, 'Details table map must be present in metadata');
  });

  it('2. Access restrictions: prevents operational manager from creating resources while organization is PENDING (403)', async () => {
    // Log in as the operational manager
    const loginRes = await apiRequest('/auth/login', {
      method: 'POST',
      body: { email: managerEmail, password: managerPassword },
    });
    assert.equal(loginRes.status, 200, 'Operational manager should log in');
    managerToken = loginRes.data.data.accessToken;

    // Attempt to create a bus while organization is PENDING
    const busRes = await apiRequest('/coordinator/buses', {
      method: 'POST',
      token: managerToken,
      body: {
        plateNumber: `ET-${timestamp.toString().slice(-4)}`,
        model: 'Scania Marcopolo 2024',
        capacity: 54,
        organizationId: pendingOrgId,
      },
    });
    assert.equal(busRes.status, 403, 'Creating a bus should be blocked with 403 Forbidden while organization is PENDING');
    assert.match(busRes.data.message || '', /restricted until approved|pending/i, 'Error message should clearly state organization is pending approval');

    // Attempt to create a route while organization is PENDING
    const routeRes = await apiRequest('/coordinator/routes', {
      method: 'POST',
      token: managerToken,
      body: {
        origin: 'Addis Ababa',
        destination: 'Hawassa',
        distanceKm: 275,
        estimatedDurationHours: 4.5,
        organizationId: pendingOrgId,
      },
    });
    assert.equal(routeRes.status, 403, 'Creating a route should be blocked with 403 Forbidden while organization is PENDING');

    // Attempt to create a trip while organization is PENDING
    const tripRes = await apiRequest('/coordinator/trips', {
      method: 'POST',
      token: managerToken,
      body: {
        routeId: '00000000-0000-0000-0000-000000000001',
        busId: '00000000-0000-0000-0000-000000000001',
        departureDate: '2026-12-01',
        departureTime: '06:30',
        fareAmount: 750,
        organizationId: pendingOrgId,
      },
    });
    assert.equal(tripRes.status, 403, 'Creating a trip should be blocked with 403 Forbidden while organization is PENDING');
  });

  it('3. Organization approval: admin approves org, sends in-app notification & email to operational manager', async () => {
    const approveRes = await apiRequest(`/admin/organizations/${pendingOrgId}/approve`, {
      method: 'PATCH',
      token: adminToken,
    });

    assert.equal(approveRes.status, 200, `Admin approval should succeed: ${JSON.stringify(approveRes.data)}`);
    const approvedOrgPayload = approveRes.data.data.organization || approveRes.data.data;
    assert.equal(approvedOrgPayload.status, 'APPROVED');
    assert.equal(approvedOrgPayload.isActive, true);

    // Verify DB state
    const approvedOrg = await prisma.organizations.findUnique({
      where: { id: pendingOrgId },
    });
    assert.equal(approvedOrg.status, 'APPROVED');
    assert.equal(approvedOrg.is_active, true);

    // Verify in-app notification was delivered to the operational manager
    const managerNotifs = await prisma.notifications.findMany({
      where: {
        user_id: managerUserId,
        type: NOTIFICATION_TYPES.ORGANIZATION_APPROVED,
      },
    });
    assert.ok(managerNotifs.length >= 1, 'Operational manager should receive ORGANIZATION_APPROVED notification');
    const notif = managerNotifs[0];
    assert.equal(notif.metadata?.organizationId, pendingOrgId);
    assert.equal(notif.metadata?.status, 'APPROVED');

    // Duplicate notification prevention: approving again should reject and not create duplicate notifications
    const secondApproveRes = await apiRequest(`/admin/organizations/${pendingOrgId}/approve`, {
      method: 'PATCH',
      token: adminToken,
    });
    assert.equal(secondApproveRes.status, 400, 'Re-approving an already approved organization should return 400');

    const totalApprovalNotifs = await prisma.notifications.count({
      where: {
        user_id: managerUserId,
        type: NOTIFICATION_TYPES.ORGANIZATION_APPROVED,
      },
    });
    assert.equal(totalApprovalNotifs, 1, 'Duplicate approval notification should be prevented');
  });

  it('4. Access granted: operational manager can now create resources once organization is APPROVED', async () => {
    // Create a bus as the operational manager now that org is approved
    const busRes = await apiRequest('/coordinator/buses', {
      method: 'POST',
      token: managerToken,
      body: {
        plateNumber: `ET-${timestamp.toString().slice(-4)}`,
        model: 'Scania Marcopolo 2024',
        capacity: 54,
        organizationId: pendingOrgId,
      },
    });
    assert.ok(
      busRes.status === 200 || busRes.status === 201,
      `Creating bus should now succeed after approval: ${JSON.stringify(busRes.data)}`
    );
    assert.equal(busRes.data.success, true);
  });

  it('5. Organization rejection: notifies operational manager with rejection reason and enforces access restrictions', async () => {
    // Register another organization to test the rejection flow
    const regRes = await apiRequest('/auth/register-partner', {
      method: 'POST',
      body: {
        orgName: rejectedOrgName,
        orgType: 'INTERCITY',
        orgEmail: `contact@reject${timestamp}.com`,
        orgPhone: phone3,
        city: 'Dire Dawa',
        address: 'Main Terminal Ave',
        regNumber: `REJ-${timestamp}`,
        repFullName: 'Chala Gemechu',
        repPosition: 'Managing Director',
        repPhone: phone4,
        repEmail: rejectedManagerEmail,
        email: rejectedManagerEmail,
        password: 'Password@123',
        confirmPassword: 'Password@123',
      },
    });
    assert.equal(regRes.status, 201, 'Second partner registration should succeed');
    rejectedOrgId = regRes.data.data.organization.id;
    rejectedManagerUserId = regRes.data.data.user.id;

    // Log in as second manager
    const loginRes = await apiRequest('/auth/login', {
      method: 'POST',
      body: { email: rejectedManagerEmail, password: 'Password@123' },
    });
    assert.equal(loginRes.status, 200);
    rejectedManagerToken = loginRes.data.data.accessToken;

    // Admin rejects the organization with a specific reason
    const rejectionReason = 'Invalid commercial transport operating license document.';
    const rejectRes = await apiRequest(`/admin/organizations/${rejectedOrgId}/reject`, {
      method: 'PATCH',
      token: adminToken,
      body: { reason: rejectionReason },
    });
    assert.equal(rejectRes.status, 200, `Rejection should succeed: ${JSON.stringify(rejectRes.data)}`);
    const rejectedOrgPayload = rejectRes.data.data.organization || rejectRes.data.data;
    assert.equal(rejectedOrgPayload.status, 'REJECTED');
    assert.equal(rejectedOrgPayload.isActive, false);

    // Verify in-app notification delivered to rejected manager with reason
    const managerNotifs = await prisma.notifications.findMany({
      where: {
        user_id: rejectedManagerUserId,
        type: NOTIFICATION_TYPES.ORGANIZATION_REJECTED,
      },
    });
    assert.ok(managerNotifs.length >= 1, 'Manager should receive ORGANIZATION_REJECTED notification');
    const notif = managerNotifs[0];
    assert.equal(notif.metadata?.organizationId, rejectedOrgId);
    assert.equal(notif.metadata?.reason, rejectionReason);
    assert.match(notif.message, new RegExp(rejectionReason));

    // Verify operational manager cannot create a bus (blocked with 403)
    const busRes = await apiRequest('/coordinator/buses', {
      method: 'POST',
      token: rejectedManagerToken,
      body: {
        plateNumber: `REJ-${timestamp.toString().slice(-4)}`,
        model: 'Yutong 2023',
        capacity: 48,
        organizationId: rejectedOrgId,
      },
    });
    assert.equal(busRes.status, 403, 'Creating a bus should be blocked with 403 Forbidden for a REJECTED organization');
  });
});
