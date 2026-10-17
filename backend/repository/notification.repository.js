import prisma from '../Config/db.js';

export class NotificationRepository {
  /**
   * Create a single notification with optional transaction client and idempotency check
   */
  async create({ userId, type, priority = 'NORMAL', title, message, metadata = null }, client = prisma) {
    const db = client?.notifications ? client : prisma;
    // Idempotency check if idempotencyKey or eventId is provided
    const idempotencyKey = metadata?.idempotencyKey || metadata?.eventId;
    if (idempotencyKey) {
      const existing = await db.notifications.findFirst({
        where: {
          user_id: userId,
          type,
          metadata: {
            path: ['idempotencyKey'],
            equals: idempotencyKey,
          },
        },
      });
      if (existing) {
        return existing;
      }
    }

    return db.notifications.create({
      data: {
        user_id: userId,
        type,
        priority,
        title,
        message,
        metadata: metadata || undefined,
      },
    });
  }

  /**
   * Bulk create notifications for multiple users (e.g. trip cancellation/delay)
   */
  async createMany(items, client = prisma) {
    if (!items || items.length === 0) return [];

    const db = client?.notifications ? client : prisma;
    const data = items.map((item) => ({
      user_id: item.userId,
      type: item.type,
      priority: item.priority || 'NORMAL',
      title: item.title,
      message: item.message,
      metadata: item.metadata || undefined,
    }));

    return db.notifications.createMany({
      data,
      skipDuplicates: true,
    });
  }


  /**
   * List paginated notifications for an authenticated user
   */
  async findUserNotifications(userId, { page = 1, limit = 20, unreadOnly = false, type = null } = {}) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const where = {
      user_id: userId,
    };

    if (unreadOnly) {
      where.read_at = null;
    }

    if (type) {
      where.type = type;
    }

    const [total, notifications] = await Promise.all([
      prisma.notifications.count({ where }),
      prisma.notifications.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { created_at: 'desc' },
      }),
    ]);

    return {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum) || 1,
      notifications,
    };
  }

  /**
   * Count unread notifications for a user
   */
  async countUnread(userId) {
    return prisma.notifications.count({
      where: {
        user_id: userId,
        read_at: null,
      },
    });
  }

  /**
   * Find a notification strictly scoped to its owner
   */
  async findByIdAndUser(id, userId) {
    return prisma.notifications.findFirst({
      where: {
        id,
        user_id: userId,
      },
    });
  }

  /**
   * Mark a single notification as read if owned by the user
   */
  async markAsRead(id, userId) {
    const existing = await this.findByIdAndUser(id, userId);
    if (!existing) {
      return null;
    }

    if (existing.read_at) {
      return existing; // Already read, prevent duplicate write
    }

    return prisma.notifications.update({
      where: { id },
      data: { read_at: new Date() },
    });
  }

  /**
   * Mark all unread notifications of a user as read
   */
  async markAllAsRead(userId) {
    const result = await prisma.notifications.updateMany({
      where: {
        user_id: userId,
        read_at: null,
      },
      data: {
        read_at: new Date(),
      },
    });

    return { count: result.count };
  }
}

export const notificationRepository = new NotificationRepository();
export default notificationRepository;
