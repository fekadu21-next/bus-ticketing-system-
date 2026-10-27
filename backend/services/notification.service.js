import notificationRepository from '../repository/notification.repository.js';
import prisma from '../Config/db.js';
import ApiError from '../utils/apiError.js';
import { NOTIFICATION_TYPES, NOTIFICATION_PRIORITIES } from '../constants/notification.js';
import socketService from './socket.service.js';
import fcmService from './fcm.service.js';
import { sendNotificationEmail } from '../utils/email.js';

export class NotificationService {
  /**
   * Internal service method to create a single notification and dispatch multi-channel
   * Can be used within or outside transactions
   */
  async createNotification(
    {
      userId,
      type,
      priority = NOTIFICATION_PRIORITIES.NORMAL,
      title,
      message,
      metadata = null,
      sendEmail = false,
      actionUrl = null,
      actionLabel = null,
    },
    client = prisma
  ) {
    if (!userId) {
      throw new Error('Notification recipient user ID is required.');
    }
    if (!type || !title || !message) {
      throw new Error('Type, title, and message are required for notification.');
    }

    try {
      // 1. In-App Persist in Database (with Idempotency guard)
      const notification = await notificationRepository.create(
        {
          userId,
          type,
          priority,
          title,
          message,
          metadata,
        },
        client
      );

      // 2. Multi-channel async dispatch (Socket.IO, Push, Email) without blocking or failing caller
      this.dispatchExternalChannels(notification, {
        userId,
        type,
        priority,
        title,
        message,
        metadata,
        sendEmail,
        actionUrl,
        actionLabel,
      }).catch((err) => {
        console.warn('⚠️ [NOTIFICATION DISPATCH] Non-blocking delivery error:', err.message);
      });

      return notification;
    } catch (error) {
      console.error('Failed to create notification:', error.message);
      throw error;
    }
  }

  /**
   * Safe helper that does not throw if notification creation fails,
   * protecting non-critical side-effects from failing the main operation.
   */
  async safeCreateNotification(data, client = prisma) {
    try {
      return await this.createNotification(data, client);
    } catch (error) {
      console.warn('Non-blocking notification error:', error.message);
      return null;
    }
  }

  /**
   * Dispatch real-time Socket.IO, Push (FCM), and Email according to user preferences
   */
  async dispatchExternalChannels(notification, params) {
    const { userId, type, priority, title, message, metadata, sendEmail, actionUrl, actionLabel } = params;

    // Check user preferences
    const preferences = await notificationRepository.getPreferences(userId);

    const formatted = this.formatNotification(notification);

    // Channel 1: Real-time Socket.IO
    if (preferences.in_app_enabled !== false) {
      try {
        socketService.sendToUser(userId, 'notification:new', formatted);
        const unreadCount = await notificationRepository.countUnread(userId);
        socketService.sendToUser(userId, 'notification:unread_count', { unreadCount });
      } catch (err) {
        console.warn('Socket.IO notification emit warning:', err.message);
      }
    }

    // Channel 2: Push Notifications (FCM)
    if (preferences.push_enabled !== false) {
      try {
        await fcmService.sendPushToUser(userId, {
          title,
          body: message,
          data: {
            notificationId: notification?.id || '',
            type,
            priority,
            ...(metadata || {}),
          },
        });
      } catch (err) {
        console.warn('FCM push notification warning:', err.message);
      }
    }

    // Channel 3: Email Notification (Important Events or Explicit Flag)
    const isImportantEmailEvent =
      sendEmail ||
      [
        NOTIFICATION_TYPES.BOOKING_CONFIRMED,
        NOTIFICATION_TYPES.PAYMENT_SUCCESS,
        NOTIFICATION_TYPES.PAYMENT_FAILED,
        NOTIFICATION_TYPES.TRIP_CANCELLED,
        NOTIFICATION_TYPES.TRIP_RESCHEDULED,
        NOTIFICATION_TYPES.TRIP_DELAYED,
        NOTIFICATION_TYPES.NEW_ORGANIZATION_REGISTRATION,
        NOTIFICATION_TYPES.ORGANIZATION_APPROVAL_REQUEST,
        NOTIFICATION_TYPES.ORGANIZATION_APPROVED,
        NOTIFICATION_TYPES.ORGANIZATION_REJECTED,
        NOTIFICATION_TYPES.CRITICAL_PLATFORM_ISSUE,
        NOTIFICATION_TYPES.TRIP_ASSIGNED,
      ].includes(type);

    if (preferences.email_enabled !== false && isImportantEmailEvent) {
      try {
        const user = await prisma.users.findUnique({
          where: { id: userId },
          select: { email: true, first_name: true },
        });

        if (user?.email) {
          await sendNotificationEmail(user.email, user.first_name, {
            title,
            message,
            details: metadata || {},
            actionUrl: actionUrl || metadata?.actionUrl || null,
            actionLabel: actionLabel || metadata?.actionLabel || 'View in App',
          });
        }
      } catch (err) {
        console.warn('Email notification warning:', err.message);
      }
    }
  }

  /**
   * Broadcast a notification to all passengers who booked a specific trip
   */
  async notifyTripPassengers(
    tripId,
    { type, priority = NOTIFICATION_PRIORITIES.HIGH, title, message, metadata = {}, sendEmail = true },
    client = prisma
  ) {
    if (!tripId) return [];

    const bookings = await client.bookings.findMany({
      where: {
        trip_id: tripId,
        status: { in: ['CONFIRMED', 'PENDING'] },
      },
      select: {
        passenger_id: true,
      },
      distinct: ['passenger_id'],
    });

    if (bookings.length === 0) return [];

    const notifications = bookings.map((b) => ({
      userId: b.passenger_id,
      type,
      priority,
      title,
      message,
      metadata: { ...metadata, tripId },
    }));

    await notificationRepository.createMany(notifications, client);

    // Multi-channel dispatch for each passenger asynchronously
    bookings.forEach((b) => {
      this.dispatchExternalChannels(
        {
          user_id: b.passenger_id,
          type,
          priority,
          title,
          message,
          metadata: { ...metadata, tripId },
          created_at: new Date(),
        },
        {
          userId: b.passenger_id,
          type,
          priority,
          title,
          message,
          metadata: { ...metadata, tripId },
          sendEmail,
        }
      ).catch((err) => console.warn('Passenger notification dispatch error:', err.message));
    });

    return notifications;
  }

  /**
   * Broadcast a notification to staff/operational managers of an organization
   */
  async notifyOrganizationStaff(
    organizationId,
    roles,
    { type, priority = NOTIFICATION_PRIORITIES.NORMAL, title, message, metadata = {}, sendEmail = false },
    client = prisma
  ) {
    if (!organizationId) return [];

    const targetRoles = Array.isArray(roles) ? roles : [roles];
    let userRoles = await client.user_roles.findMany({
      where: {
        organization_id: organizationId,
        roles: {
          name: { in: targetRoles },
        },
      },
      select: {
        user_id: true,
      },
      distinct: ['user_id'],
    });

    if (userRoles.length === 0) {
      // Fallback: notify any staff member associated with this organization
      userRoles = await client.user_roles.findMany({
        where: {
          organization_id: organizationId,
        },
        select: {
          user_id: true,
        },
        distinct: ['user_id'],
      });
    }

    if (userRoles.length === 0) return [];

    const idempotencyKey = metadata?.idempotencyKey || (organizationId ? `${type}:${organizationId}` : null);
    const enrichedMetadata = {
      ...(metadata || {}),
      organizationId,
      ...(idempotencyKey ? { idempotencyKey } : {}),
    };

    // Duplicate prevention: filter out users who already received this notification for this event/org
    let recipientsToNotify = userRoles;
    if (organizationId || idempotencyKey) {
      try {
        const existingNotifications = await client.notifications.findMany({
          where: {
            user_id: { in: userRoles.map((ur) => ur.user_id) },
            type,
          },
          select: {
            id: true,
            user_id: true,
            metadata: true,
          },
        });

        const alreadyNotifiedUserIds = new Set(
          existingNotifications
            .filter((n) => {
              if (!n.metadata) return false;
              const meta = typeof n.metadata === 'string' ? JSON.parse(n.metadata) : n.metadata;
              if (idempotencyKey && (meta.idempotencyKey === idempotencyKey || meta.eventId === idempotencyKey)) return true;
              if (organizationId && meta.organizationId === organizationId) return true;
              return false;
            })
            .map((n) => n.user_id)
        );

        recipientsToNotify = userRoles.filter((ur) => !alreadyNotifiedUserIds.has(ur.user_id));
      } catch (checkErr) {
        console.warn('Idempotency check warning in notifyOrganizationStaff:', checkErr.message);
      }
    }

    if (recipientsToNotify.length === 0) {
      return [];
    }

    const notifications = recipientsToNotify.map((ur) => ({
      userId: ur.user_id,
      type,
      priority,
      title,
      message,
      metadata: enrichedMetadata,
    }));

    await notificationRepository.createMany(notifications, client);

    // Multi-channel dispatch for each staff member asynchronously
    recipientsToNotify.forEach((ur) => {
      this.dispatchExternalChannels(
        {
          user_id: ur.user_id,
          type,
          priority,
          title,
          message,
          metadata: enrichedMetadata,
          created_at: new Date(),
        },
        {
          userId: ur.user_id,
          type,
          priority,
          title,
          message,
          metadata: enrichedMetadata,
          sendEmail,
        }
      ).catch((err) => console.warn('Staff notification dispatch error:', err.message));
    });

    return notifications;
  }

  /**
   * Broadcast a notification to all Platform Admins
   */
  async notifyAdmins(
    { type, priority = NOTIFICATION_PRIORITIES.HIGH, title, message, metadata = {}, sendEmail = true },
    client = prisma
  ) {
    const adminRoles = await client.user_roles.findMany({
      where: {
        roles: {
          name: 'ADMIN',
        },
      },
      select: {
        user_id: true,
      },
      distinct: ['user_id'],
    });

    if (adminRoles.length === 0) return [];

    const organizationId = metadata?.organizationId;
    const idempotencyKey = metadata?.idempotencyKey || (organizationId ? `${type}:${organizationId}` : null);
    const enrichedMetadata = {
      ...(metadata || {}),
      ...(idempotencyKey ? { idempotencyKey } : {}),
    };

    // Duplicate prevention: filter out admins who already received this notification for this event/org
    let recipientsToNotify = adminRoles;
    if (organizationId || idempotencyKey) {
      try {
        const existingNotifications = await client.notifications.findMany({
          where: {
            user_id: { in: adminRoles.map((ur) => ur.user_id) },
            type,
          },
          select: {
            id: true,
            user_id: true,
            metadata: true,
          },
        });

        const alreadyNotifiedUserIds = new Set(
          existingNotifications
            .filter((n) => {
              if (!n.metadata) return false;
              const meta = typeof n.metadata === 'string' ? JSON.parse(n.metadata) : n.metadata;
              if (idempotencyKey && (meta.idempotencyKey === idempotencyKey || meta.eventId === idempotencyKey)) return true;
              if (organizationId && meta.organizationId === organizationId) return true;
              return false;
            })
            .map((n) => n.user_id)
        );

        recipientsToNotify = adminRoles.filter((ur) => !alreadyNotifiedUserIds.has(ur.user_id));
      } catch (checkErr) {
        console.warn('Idempotency check warning in notifyAdmins:', checkErr.message);
      }
    }

    if (recipientsToNotify.length === 0) {
      return [];
    }

    const notifications = recipientsToNotify.map((ur) => ({
      userId: ur.user_id,
      type,
      priority,
      title,
      message,
      metadata: enrichedMetadata,
    }));

    await notificationRepository.createMany(notifications, client);

    // Real-time broadcast to role room
    try {
      socketService.sendToRole('ADMIN', 'notification:new', {
        type,
        priority,
        title,
        message,
        metadata: enrichedMetadata,
        createdAt: new Date(),
      });
    } catch (e) {
      // non-blocking
    }

    // Multi-channel dispatch for each admin
    recipientsToNotify.forEach((ur) => {
      this.dispatchExternalChannels(
        {
          user_id: ur.user_id,
          type,
          priority,
          title,
          message,
          metadata: enrichedMetadata,
          created_at: new Date(),
        },
        {
          userId: ur.user_id,
          type,
          priority,
          title,
          message,
          metadata: enrichedMetadata,
          sendEmail,
        }
      ).catch((err) => console.warn('Admin notification dispatch error:', err.message));
    });

    return notifications;
  }

  /**
   * Format notification for external / client presentation
   */
  formatNotification(notification) {
    if (!notification) return null;
    return {
      id: notification.id,
      userId: notification.user_id,
      type: notification.type,
      priority: notification.priority,
      title: notification.title,
      message: notification.message,
      metadata: notification.metadata || null,
      isRead: Boolean(notification.read_at),
      readAt: notification.read_at,
      createdAt: notification.created_at,
    };
  }

  /**
   * Retrieve the authenticated user's notifications
   */
  async getUserNotifications(userId, query = {}) {
    if (!userId) {
      throw new ApiError(401, 'Authentication required to view notifications.');
    }

    const { page = 1, limit = 20, unreadOnly = false, type = null } = query;
    const result = await notificationRepository.findUserNotifications(userId, {
      page,
      limit,
      unreadOnly: unreadOnly === 'true' || unreadOnly === true,
      type: type || null,
    });

    return {
      ...result,
      notifications: result.notifications.map((n) => this.formatNotification(n)),
    };
  }

  /**
   * Get unread notification count for the authenticated user
   */
  async getUnreadCount(userId) {
    if (!userId) {
      throw new ApiError(401, 'Authentication required.');
    }

    const count = await notificationRepository.countUnread(userId);
    return { unreadCount: count };
  }

  /**
   * Mark a single notification as read with strict ownership validation
   */
  async markAsRead(notificationId, userId) {
    if (!userId) {
      throw new ApiError(401, 'Authentication required.');
    }

    const notification = await notificationRepository.markAsRead(notificationId, userId);
    if (!notification) {
      throw new ApiError(404, 'Notification not found.');
    }

    // Sync Socket.IO real-time unread count
    try {
      const count = await notificationRepository.countUnread(userId);
      socketService.sendToUser(userId, 'notification:unread_count', { unreadCount: count });
      socketService.sendToUser(userId, 'notification:read', { notificationId });
    } catch (e) {
      // non-blocking
    }

    return this.formatNotification(notification);
  }

  /**
   * Mark all unread notifications of the authenticated user as read
   */
  async markAllAsRead(userId) {
    if (!userId) {
      throw new ApiError(401, 'Authentication required.');
    }

    const result = await notificationRepository.markAllAsRead(userId);

    // Sync Socket.IO real-time unread count
    try {
      socketService.sendToUser(userId, 'notification:unread_count', { unreadCount: 0 });
      socketService.sendToUser(userId, 'notification:read_all', { success: true });
    } catch (e) {
      // non-blocking
    }

    return {
      success: true,
      markedCount: result.count,
      message: `${result.count} notification(s) marked as read.`,
    };
  }

  // --- Preferences & Device Tokens ---

  async getUserPreferences(userId) {
    if (!userId) {
      throw new ApiError(401, 'Authentication required.');
    }
    const prefs = await notificationRepository.getPreferences(userId);
    return {
      emailEnabled: prefs.email_enabled,
      pushEnabled: prefs.push_enabled,
      inAppEnabled: prefs.in_app_enabled,
      channelPreferences: prefs.channel_preferences || null,
    };
  }

  async updateUserPreferences(userId, updateData) {
    if (!userId) {
      throw new ApiError(401, 'Authentication required.');
    }
    const updated = await notificationRepository.upsertPreferences(userId, updateData);
    return {
      emailEnabled: updated.email_enabled,
      pushEnabled: updated.push_enabled,
      inAppEnabled: updated.in_app_enabled,
      channelPreferences: updated.channel_preferences || null,
    };
  }

  async registerDeviceToken(userId, token, deviceType = 'web') {
    if (!userId) {
      throw new ApiError(401, 'Authentication required.');
    }
    if (!token) {
      throw new ApiError(400, 'FCM device token is required.');
    }
    const saved = await notificationRepository.registerDeviceToken(userId, token, deviceType);
    return {
      success: true,
      token: saved.token,
      deviceType: saved.device_type,
    };
  }

  async unregisterDeviceToken(userId, token) {
    if (!userId) {
      throw new ApiError(401, 'Authentication required.');
    }
    if (!token) {
      throw new ApiError(400, 'Device token is required.');
    }
    await notificationRepository.unregisterDeviceToken(userId, token);
    return {
      success: true,
      message: 'Device token unregistered successfully.',
    };
  }
}

export const notificationService = new NotificationService();
export default notificationService;
