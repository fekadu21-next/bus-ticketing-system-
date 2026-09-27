import prisma from '../../Config/db.js';

export class BusRepository {
  async create({ organizationId, plateNumber, model, capacity, isActive = true }) {
    return prisma.buses.create({
      data: {
        organization_id: organizationId,
        plate_number: plateNumber,
        model,
        capacity,
        is_active: isActive,
      },
    });
  }

  async findById(busId, organizationId = null) {
    const where = { id: busId };
    if (organizationId) {
      where.organization_id = organizationId;
    }
    return prisma.buses.findFirst({
      where,
      include: {
        organizations: {
          select: { id: true, name: true },
        },
      },
    });
  }

  async findByPlateNumber(plateNumber, organizationId) {
    return prisma.buses.findFirst({
      where: {
        organization_id: organizationId,
        plate_number: { equals: plateNumber, mode: 'insensitive' },
      },
    });
  }

  async findAll(organizationId, { page = 1, limit = 20, search = '', isActive = null } = {}) {
    const skip = (page - 1) * limit;
    const where = { organization_id: organizationId };

    if (isActive !== null && isActive !== undefined) {
      where.is_active = isActive;
    }

    if (search) {
      where.OR = [
        { plate_number: { contains: search, mode: 'insensitive' } },
        { model: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, buses] = await Promise.all([
      prisma.buses.count({ where }),
      prisma.buses.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
    ]);

    return { total, page, limit, buses };
  }

  async update(busId, organizationId, updateData) {
    return prisma.buses.update({
      where: { id: busId, organization_id: organizationId },
      data: {
        ...updateData,
        updated_at: new Date(),
      },
    });
  }

  async delete(busId, organizationId) {
    return prisma.buses.delete({
      where: { id: busId, organization_id: organizationId },
    });
  }

  async countActiveTrips(busId) {
    return prisma.trips.count({
      where: {
        bus_id: busId,
        status: { in: ['SCHEDULED', 'IN_TRANSIT'] },
      },
    });
  }
}

export const busRepository = new BusRepository();
export default busRepository;
