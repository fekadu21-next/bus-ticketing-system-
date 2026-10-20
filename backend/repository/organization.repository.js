import prisma from '../Config/db.js';

export class OrganizationRepository {
  /**
   * Find organizations with pagination and filtering
   */
  async findAll({ page = 1, limit = 20, search = '', isActive = null } = {}) {
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

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
        take: limitNum,
        orderBy: { name: 'asc' },
        include: {
          _count: {
            select: { user_roles: true, trips: true, buses: true },
          },
          trips: {
            where: {
              status: { in: ['SCHEDULED', 'PUBLISHED'] },
              departure_time: { gte: new Date() },
            },
            select: {
              routes: {
                select: {
                  origin: true,
                  destination: true,
                },
              },
            },
            take: 20,
          },
        },
      }),
    ]);

    return { total, page: pageNum, limit: limitNum, organizations };
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
