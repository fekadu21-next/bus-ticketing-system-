import prisma from '../Config/db.js';

export class OrganizationRepository {
  /**
   * Find organizations with pagination and filtering
   */
  async findAll({ page = 1, limit = 20, search = '', isActive = null } = {}) {
    const skip = (page - 1) * limit;

    const where = {};
    if (isActive !== null) {
      where.is_active = isActive;
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
        orderBy: { name: 'asc' },
        include: {
          _count: {
            select: { user_roles: true },
          },
        },
      }),
    ]);

    return { total, page, limit, organizations };
  }

  /**
   * Find organization by ID
   */
  async findById(id) {
    return prisma.organizations.findUnique({
      where: { id },
      include: {
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
              },
            },
            roles: true,
          },
        },
      },
    });
  }

  /**
   * Find organization by Name
   */
  async findByName(name) {
    return prisma.organizations.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } },
    });
  }

  /**
   * Create organization
   */
  async create({ name, type = 'COMPANY', isActive = true }) {
    return prisma.organizations.create({
      data: {
        name,
        type,
        is_active: isActive,
      },
    });
  }

  /**
   * Update organization
   */
  async update(id, data) {
    return prisma.organizations.update({
      where: { id },
      data,
    });
  }
}

export const organizationRepository = new OrganizationRepository();
export default organizationRepository;
