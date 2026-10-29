import test, { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startTestServer, stopTestServer, apiRequest, prisma } from './test-helper.js';
import notificationService from '../services/notification.service.js';
import { NOTIFICATION_TYPES, NOTIFICATION_PRIORITIES } from '../constants/notification.js';

describe('Notification System Test Suite', () => {
  const timestamp = Date.now();
  let userAToken = null;
  let userA = null;
  let userBToken = null;
  let userB = null;

  let notifA1Id = null;
  let notifA2Id = null;
  let notifB1Id = null;

  before(async () => {
    await startTestServer();

    // 1. Register and login Passenger A
    const regA = await apiRequest('/auth/register', {
      method: 'POST',
      body: {
        firstName: 'Notif',
        lastName: 'UserA',
        email: `notif_a_${timestamp}@test.com`,
        password: 'Password@123',
        confirmPassword: 'Password@123',
      },
    });
    userA = regA.data.data.user;

    const loginA = await apiRequest('/auth/login', {
      method: 'POST',
      body: {
        email: `notif_a_${timestamp}@test.com`,
        password: 'Password@123',
      },
    });
    userAToken = loginA.data.data.accessToken;

    // 2. Register and login Passenger B
    const regB = await apiRequest('/auth/register', {
      method: 'POST',
      body: {
        firstName: 'Notif',
        lastName: 'UserB',
        email: `notif_b_${timestamp}@test.com`,
        password: 'Password@123',
        confirmPassword: 'Password@123',
      },
    });
    userB = regB.data.data.user;

    const loginB = await apiRequest('/auth/login', {
      method: 'POST',
      body: {
        email: `notif_b_${timestamp}@test.com`,
        password: 'Password@123',
      },
    });
    userBToken = loginB.data.data.accessToken;
  });

  after(async () => {
    // Cleanup notifications
    if (userA || userB) {
      await prisma.notifications.deleteMany({
        where: {
          user_id: { in: [userA?.id, userB?.id].filter(Boolean) },
        },
      });
    }

    // Cleanup users
    for (const uid of [userA?.id, userB?.id].filter(Boolean)) {
      await prisma.user_roles.deleteMany({ where: { user_id: uid } });
      await prisma.refresh_tokens.deleteMany({ where: { user_id: uid } });
      await prisma.users.delete({ where: { id: uid } }).catch(() => {});
    }

    await stopTestServer();
  });

  it('1. Unauthenticated requests are rejected with 401', async () => {
    const resGet = await apiRequest('/notifications');
    assert.equal(resGet.status, 401);

    const resUnread = await apiRequest('/notifications/unread-count');
    assert.equal(resUnread.status, 401);

    const resMarkOne = await apiRequest('/notifications/00000000-0000-0000-0000-000000000000/read', {
      method: 'PATCH',
    });
    assert.equal(resMarkOne.status, 401);

    const resMarkAll = await apiRequest('/notifications/read-all', {
      method: 'PATCH',
    });
    assert.equal(resMarkAll.status, 401);
  });

  it('2. Seed notifications for User A and User B via notificationService', async () => {
    // Notification 1 for User A
    const n1 = await notificationService.createNotification({
      userId: userA.id,
      type: NOTIFICATION_TYPES.BOOKING_CONFIRMED,
      priority: NOTIFICATION_PRIORITIES.NORMAL,
      title: 'Booking Confirmed',
      message: 'Your booking for Seat 1 has been confirmed.',
      metadata: { bookingId: 'booking-123', seatNumber: 1 },
    });
    notifA1Id = n1.id;
    assert.ok(notifA1Id);

    // Notification 2 for User A
    const n2 = await notificationService.createNotification({
      userId: userA.id,
      type: NOTIFICATION_TYPES.PAYMENT_CONFIRMED,
      priority: NOTIFICATION_PRIORITIES.HIGH,
      title: 'Payment Confirmed',
      message: 'Your payment of 450 ETB was successful.',
      metadata: { amount: 450, paymentId: 'pay-123' },
    });
    notifA2Id = n2.id;
    assert.ok(notifA2Id);

    // Notification 1 for User B
    const nB = await notificationService.createNotification({
      userId: userB.id,
      type: NOTIFICATION_TYPES.TRIP_UPDATED,
      priority: NOTIFICATION_PRIORITIES.NORMAL,
      title: 'Trip Schedule Updated',
      message: 'Departure time was updated.',
      metadata: { tripId: 'trip-999' },
    });
    notifB1Id = nB.id;
    assert.ok(notifB1Id);
  });

  it('3. Authenticated user can retrieve their notifications (User A)', async () => {
    const res = await apiRequest('/notifications', { token: userAToken });
    assert.equal(res.status, 200);
    assert.equal(res.data.success, true);
    assert.ok(Array.isArray(res.data.data.notifications));
    assert.equal(res.data.data.notifications.length, 2);

    const ids = res.data.data.notifications.map((n) => n.id);
    assert.ok(ids.includes(notifA1Id));
    assert.ok(ids.includes(notifA2Id));
    // User B's notification must not be visible to User A
    assert.ok(!ids.includes(notifB1Id));
  });

  it('4. Unread count is correct for User A and User B', async () => {
    const resA = await apiRequest('/notifications/unread-count', { token: userAToken });
    assert.equal(resA.status, 200);
    assert.equal(resA.data.data.unreadCount, 2);

    const resB = await apiRequest('/notifications/unread-count', { token: userBToken });
    assert.equal(resB.status, 200);
    assert.equal(resB.data.data.unreadCount, 1);
  });

  it('5. Cross-user isolation: User B cannot retrieve or mark User A notification as read', async () => {
    // User B attempts to mark User A's notification as read -> must return 404
    const res = await apiRequest(`/notifications/${notifA1Id}/read`, {
      method: 'PATCH',
      token: userBToken,
    });
    assert.equal(res.status, 404);
  });

  it('6. Mark-one-as-read works and decrements unread count', async () => {
    // User A marks notifA1 as read
    const res = await apiRequest(`/notifications/${notifA1Id}/read`, {
      method: 'PATCH',
      token: userAToken,
    });
    assert.equal(res.status, 200);
    assert.equal(res.data.data.notification.isRead, true);
    assert.ok(res.data.data.notification.readAt);

    // Verify unread count is now 1 for User A
    const countRes = await apiRequest('/notifications/unread-count', { token: userAToken });
    assert.equal(countRes.data.data.unreadCount, 1);

    // Repeating mark-as-read on already read notification succeeds idempotently
    const resRepeat = await apiRequest(`/notifications/${notifA1Id}/read`, {
      method: 'PATCH',
      token: userAToken,
    });
    assert.equal(resRepeat.status, 200);
  });

  it('7. Mark-all-as-read affects ONLY the authenticated user', async () => {
    // User A marks all remaining as read
    const res = await apiRequest('/notifications/read-all', {
      method: 'PATCH',
      token: userAToken,
    });
    assert.equal(res.status, 200);
    assert.equal(res.data.data.markedCount, 1);

    // User A unread count is now 0
    const countA = await apiRequest('/notifications/unread-count', { token: userAToken });
    assert.equal(countA.data.data.unreadCount, 0);

    // User B unread count must remain 1
    const countB = await apiRequest('/notifications/unread-count', { token: userBToken });
    assert.equal(countB.data.data.unreadCount, 1);
  });

  it('8. Pagination works and respects page and limit parameters', async () => {
    // Create 5 extra notifications for User A
    for (let i = 1; i <= 5; i++) {
      await notificationService.createNotification({
        userId: userA.id,
        type: NOTIFICATION_TYPES.SYSTEM_ANNOUNCEMENT,
        title: `Announcement ${i}`,
        message: `System test announcement ${i}`,
      });
    }

    // Query with limit=3, page=1
    const resPage1 = await apiRequest('/notifications?page=1&limit=3', { token: userAToken });
    assert.equal(resPage1.status, 200);
    assert.equal(resPage1.data.data.notifications.length, 3);
    assert.equal(resPage1.data.data.page, 1);
    assert.equal(resPage1.data.data.limit, 3);
    assert.ok(resPage1.data.data.total >= 7);

    // Query with limit=3, page=2
    const resPage2 = await apiRequest('/notifications?page=2&limit=3', { token: userAToken });
    assert.equal(resPage2.status, 200);
    assert.equal(resPage2.data.data.notifications.length, 3);
    assert.equal(resPage2.data.data.page, 2);

    // Ensure page 1 and page 2 items are distinct
    const ids1 = resPage1.data.data.notifications.map((n) => n.id);
    const ids2 = resPage2.data.data.notifications.map((n) => n.id);
    for (const id of ids1) {
      assert.ok(!ids2.includes(id), `Notification ${id} appeared on both page 1 and page 2`);
    }
  });

  it('9. Filter by type and unreadOnly works', async () => {
    const res = await apiRequest(`/notifications?type=${NOTIFICATION_TYPES.SYSTEM_ANNOUNCEMENT}`, {
      token: userAToken,
    });
    assert.equal(res.status, 200);
    for (const n of res.data.data.notifications) {
      assert.equal(n.type, NOTIFICATION_TYPES.SYSTEM_ANNOUNCEMENT);
    }
  });

  it('10. Duplicate event processing does not produce unintended duplicate notifications (Idempotency)', async () => {
    const idempotencyKey = `evt-test-idem-${timestamp}`;

    // First call
    const notif1 = await notificationService.createNotification({
      userId: userA.id,
      type: NOTIFICATION_TYPES.ACCOUNT_SECURITY,
      title: 'Security Alert',
      message: 'First attempt',
      metadata: { idempotencyKey, testRun: 1 },
    });

    // Duplicate call with same idempotency key
    const notif2 = await notificationService.createNotification({
      userId: userA.id,
      type: NOTIFICATION_TYPES.ACCOUNT_SECURITY,
      title: 'Security Alert',
      message: 'Second attempt',
      metadata: { idempotencyKey, testRun: 2 },
    });

    assert.equal(notif1.id, notif2.id, 'Expected duplicate call to return original notification without creating second record');

    const duplicates = await prisma.notifications.findMany({
      where: {
        user_id: userA.id,
        type: NOTIFICATION_TYPES.ACCOUNT_SECURITY,
        metadata: {
          path: ['idempotencyKey'],
          equals: idempotencyKey,
        },
      },
    });
    assert.equal(duplicates.length, 1);
  });

  it('11. Trip cancellation notifies affected passengers', async () => {
    const mockTripId = '11111111-2222-3333-4444-555555555555';
    const mockClient = {
      bookings: {
        findMany: async () => [{ passenger_id: userB.id }],
      },
    };

    const sent = await notificationService.notifyTripPassengers(mockTripId, {
      type: NOTIFICATION_TYPES.TRIP_CANCELLED,
      priority: NOTIFICATION_PRIORITIES.URGENT,
      title: 'Trip Cancelled',
      message: 'Your scheduled trip has been cancelled.',
      metadata: { tripId: mockTripId },
    }, mockClient);

    assert.equal(sent.length, 1);
    assert.equal(sent[0].userId, userB.id);

    // Verify User B received the cancellation notification
    const res = await apiRequest('/notifications?type=TRIP_CANCELLED', { token: userBToken });
    assert.equal(res.status, 200);
    const cancelNotif = res.data.data.notifications.find((n) => n.type === 'TRIP_CANCELLED');
    assert.ok(cancelNotif);
    assert.equal(cancelNotif.title, 'Trip Cancelled');
  });
});
