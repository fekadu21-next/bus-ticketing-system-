import notificationRepository from '../repository/notification.repository.js';
import prisma from '../Config/db.js';
import ApiError from '../utils/apiError.js';
import { NOTIFICATION_TYPES, NOTIFICATION_PRIORITIES } from '../constants/notification.js';

export class NotificationService {
  /**
   * Internal service method to create a single notification
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
      return await notificationRepository.create(
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
    } catch (error) {
      // Log failure without crashing business operations if outside critical flow
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
   * Broadcast a notification to all passengers who booked a specific trip
   */
  async notifyTripPassengers(tripId, { type, priority = 'HIGH', title, message, metadata = {} }, client = prisma) {
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
    return notifications;
  }

  /**
   * Broadcast a notification to staff/operational managers of an organization
   */
  async notifyOrganizationStaff(organizationId, roles, { type, priority = 'NORMAL', title, message, metadata = {} }, client = prisma) {
    if (!organizationId) return [];

    const targetRoles = Array.isArray(roles) ? roles : [roles];
    const userRoles = await client.user_roles.findMany({
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

    if (userRoles.length === 0) return [];

    const notifications = userRoles.map((ur) => ({
      userId: ur.user_id,
      type,
      priority,
      title,
      message,
      metadata: { ...metadata, organizationId },
    }));

    await notificationRepository.createMany(notifications, client);
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
    return {
      success: true,
      markedCount: result.count,
      message: `${result.count} notification(s) marked as read.`,
    };
  }
}

export const notificationService = new NotificationService();
export default notificationService;
