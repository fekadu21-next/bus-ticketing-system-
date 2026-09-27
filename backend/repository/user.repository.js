import prisma from '../Config/db.js';
import { ROLES } from '../constants/index.js';

export class UserRepository {
  /**
   * Find users with pagination, filtering by role, organization, search, status
   */
  async findAll({ page = 1, limit = 20, search = '', role = null, organizationId = null, isActive = null } = {}) {
    const skip = (page - 1) * limit;

    const where = {};

    if (isActive !== null) {
      where.is_active = isActive;
    }

    if (search) {
      where.OR = [
        { first_name: { contains: search, mode: 'insensitive' } },
        { last_name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (role || organizationId) {
      where.user_roles = {
        some: {
          ...(role ? { roles: { name: role } } : {}),
          ...(organizationId ? { organization_id: organizationId } : {}),
        },
      };
    }

    const [total, users] = await Promise.all([
      prisma.users.count({ where }),
      prisma.users.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          user_roles: {
            include: {
              roles: {
                include: {
                  role_permissions: {
                    include: {
                      permissions: true,
                    },
                  },
                },
              },
              organizations: true,
            },
          },
        },
      }),
    ]);

    return { total, page, limit, users };
  }

  /**
   * Find user by ID with full role, permission, and organization relations
   */
  async findById(id) {
    return prisma.users.findUnique({
      where: { id },
      include: {
        user_roles: {
          include: {
            roles: {
              include: {
                role_permissions: {
                  include: {
                    permissions: true,
                  },
                },
              },
            },
            organizations: true,
          },
        },
      },
    });
  }

  /**
   * Find user by email
   */
  async findByEmail(email) {
    return prisma.users.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        user_roles: {
          include: {
            roles: true,
            organizations: true,
          },
        },
      },
    });
  }

  /**
   * Create a user with specified role and optional organization
   */
  async createUserWithRole({ firstName, lastName, email, phone, passwordHash, roleName, organizationId, isActive = true, emailVerified = true }) {
    const role = await prisma.roles.findUnique({ where: { name: roleName } });
    if (!role) {
      throw new Error(`Role '${roleName}' does not exist.`);
    }

    return prisma.users.create({
      data: {
        first_name: firstName,
        last_name: lastName,
        email: email.toLowerCase(),
        phone: phone || null,
        password_hash: passwordHash,
        is_active: isActive,
        email_verified: emailVerified,
        email_verified_at: emailVerified ? new Date() : null,
        user_roles: {
          create: {
            role_id: role.id,
            organization_id: organizationId || null,
          },
        },
      },
    });
  }

  /**
   * Update user
   */
  async updateUser(id, data) {
    return prisma.users.update({
      where: { id },
      data,
    });
  }

  /**
   * Count active ADMINs in system (to prevent deactivating/removing the last admin)
   */
  async countActiveAdmins() {
    return prisma.user_roles.count({
      where: {
        roles: { name: ROLES.ADMIN },
        users: { is_active: true },
      },
    });
  }
}

export const userRepository = new UserRepository();
export default userRepository;
