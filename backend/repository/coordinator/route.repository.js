import prisma from '../../Config/db.js';

export class RouteRepository {
  async create({ organizationId, origin, destination, distanceKm, estimatedDurationHours, isActive = true }) {
    return prisma.routes.create({
      data: {
        organization_id: organizationId,
        origin,
        destination,
        distance_km: distanceKm,
        estimated_duration_hours: estimatedDurationHours,
        is_active: isActive,
      },
    });
  }

  async findById(routeId, organizationId = null) {
    const where = { id: routeId };
    if (organizationId) {
      where.organization_id = organizationId;
    }
    return prisma.routes.findFirst({
      where,
      include: {
        organizations: {
          select: { id: true, name: true },
        },
      },
    });
  }

  async findDuplicate(organizationId, origin, destination) {
    return prisma.routes.findFirst({
      where: {
        organization_id: organizationId,
        origin: { equals: origin, mode: 'insensitive' },
        destination: { equals: destination, mode: 'insensitive' },
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
        { origin: { contains: search, mode: 'insensitive' } },
        { destination: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, routes] = await Promise.all([
      prisma.routes.count({ where }),
      prisma.routes.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
    ]);

    return { total, page, limit, routes };
  }

  async update(routeId, organizationId, updateData) {
    const data = { ...updateData, updated_at: new Date() };
    if (data.distanceKm !== undefined) {
      data.distance_km = data.distanceKm;
      delete data.distanceKm;
    }
    if (data.estimatedDurationHours !== undefined) {
      data.estimated_duration_hours = data.estimatedDurationHours;
      delete data.estimatedDurationHours;
    }
    if (data.isActive !== undefined) {
      data.is_active = data.isActive;
      delete data.isActive;
    }

    return prisma.routes.update({
      where: { id: routeId, organization_id: organizationId },
      data,
    });
  }

  async delete(routeId, organizationId) {
    return prisma.routes.delete({
      where: { id: routeId, organization_id: organizationId },
    });
  }

  async countActiveTrips(routeId) {
    return prisma.trips.count({
      where: {
        route_id: routeId,
        status: { in: ['SCHEDULED', 'IN_TRANSIT'] },
      },
    });
  }
}

export const routeRepository = new RouteRepository();
export default routeRepository;
