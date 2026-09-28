import prisma from '../../Config/db.js';

export class AdminOrganizationRepository {
  /**
   * Find organizations with filtering by status, type, search keyword, and pagination
   */
  async findAll({ page = 1, limit = 20, search = '', status = null, type = null } = {}) {
    const skip = (page - 1) * limit;

    const where = {};
    if (status) {
      where.status = status;
    }
    if (type) {
      where.type = type;
    }
    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    const [total, organizations] = await Promise.all([
      prisma.organizations.count({ where }),
      prisma.organizations.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          _count: {
            select: { user_roles: true },
          },
          user_roles: {
            take: 3,
            include: {
              users: {
                select: {
                  id: true,
                  first_name: true,
                  last_name: true,
                  email: true,
                  phone: true,
                },
              },
              roles: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      }),
    ]);

    return { total, page, limit, organizations };
  }

  /**
   * Find detailed organization by ID with associated staff/roles
   */
  async findById(id) {
    return prisma.organizations.findUnique({
      where: { id },
      include: {
        _count: {
          select: { user_roles: true },
        },
        user_roles: {
          include: {
            users: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
                email: true,
                phone: true,
                is_active: true,
                created_at: true,
              },
            },
            roles: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Fetch approval/status change history from audit logs
   */
  async findAuditHistory(organizationId) {
    return prisma.audit_logs.findMany({
      where: {
        action: {
          in: [
            'ORGANIZATION_APPROVED',
            'ORGANIZATION_REJECTED',
            'ORGANIZATION_SUSPENDED',
            'ORGANIZATION_ACTIVATED',
            'ADMIN_CREATE_ORGANIZATION',
          ],
        },
        details: {
          path: ['organizationId'],
          equals: organizationId,
        },
      },
      orderBy: { created_at: 'desc' },
      take: 10,
      include: {
        users: {
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

  /**
   * Update organization status and active flag
   */
  async updateStatus(id, { status, isActive }) {
    return prisma.organizations.update({
      where: { id },
      data: {
        status,
        is_active: isActive,
        updated_at: new Date(),
      },
      include: {
        _count: {
          select: { user_roles: true },
        },
      },
    });
  }
}

export const adminOrganizationRepository = new AdminOrganizationRepository();
export default adminOrganizationRepository;
