import prisma from '../Config/db.js';

export class PlatformFeedbackRepository {
  async create({ userId, rating, category, comment }) {
    return prisma.platform_feedbacks.create({
      data: {
        user_id: userId,
        rating,
        category,
        comment,
        status: 'OPEN',
      },
      include: {
        user: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
            user_roles: {
              select: {
                roles: {
                  select: { name: true },
                },
              },
            },
          },
        },
      },
    });
  }

  async findUserFeedbacks(userId) {
    return prisma.platform_feedbacks.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      include: {
        admin: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
          },
        },
      },
    });
  }

  async findAll({ page = 1, limit = 20, status, category, search } = {}) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const where = {};

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (category && category !== 'ALL') {
      where.category = category;
    }

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { comment: { contains: q, mode: 'insensitive' } },
        { user: { first_name: { contains: q, mode: 'insensitive' } } },
        { user: { last_name: { contains: q, mode: 'insensitive' } } },
        { user: { email: { contains: q, mode: 'insensitive' } } },
      ];
    }

    const [total, feedbacks] = await Promise.all([
      prisma.platform_feedbacks.count({ where }),
      prisma.platform_feedbacks.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { created_at: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              email: true,
              phone: true,
              user_roles: {
                select: {
                  roles: {
                    select: { name: true },
                  },
                },
              },
            },
          },
          admin: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              email: true,
            },
          },
        },
      }),
    ]);

    return {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum) || 1,
      feedbacks,
    };
  }

  async getPlatformStats() {
    const [counts, avg] = await Promise.all([
      prisma.platform_feedbacks.groupBy({
        by: ['status'],
        _count: { id: true },
      }),
      prisma.platform_feedbacks.aggregate({
        _avg: { rating: true },
        _count: { id: true },
      }),
    ]);

    const ratingDistribution = await prisma.platform_feedbacks.groupBy({
      by: ['rating'],
      _count: { id: true },
    });

    const statusCounts = {
      OPEN: 0,
      IN_PROGRESS: 0,
      RESOLVED: 0,
      CLOSED: 0,
    };

    counts.forEach((c) => {
      if (statusCounts[c.status] !== undefined) {
        statusCounts[c.status] = c._count.id;
      }
    });

    const starCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    ratingDistribution.forEach((r) => {
      if (starCounts[r.rating] !== undefined) {
        starCounts[r.rating] = r._count.id;
      }
    });

    const total = avg._count.id || 0;
    const averageRating = avg._avg.rating ? Number(avg._avg.rating.toFixed(2)) : 0;
    const unresolved = statusCounts.OPEN + statusCounts.IN_PROGRESS;

    return {
      total,
      unresolved,
      open: statusCounts.OPEN,
      inProgress: statusCounts.IN_PROGRESS,
      resolved: statusCounts.RESOLVED,
      closed: statusCounts.CLOSED,
      averageRating,
      starCounts,
    };
  }

  async findById(id) {
    return prisma.platform_feedbacks.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        },
        admin: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        },
      },
    });
  }

  async updateResponse(id, { status, adminResponse, adminUserId }) {
    const data = {
      updated_at: new Date(),
    };

    if (status) {
      data.status = status;
    }

    if (adminResponse !== undefined) {
      data.admin_response = adminResponse;
      data.responded_by_id = adminUserId;
      data.responded_at = new Date();
    }

    return prisma.platform_feedbacks.update({
      where: { id },
      data,
      include: {
        user: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        },
        admin: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        },
      },
    });
  }
}

export const platformFeedbackRepository = new PlatformFeedbackRepository();
export default platformFeedbackRepository;

