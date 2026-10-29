import prisma from '../../Config/db.js';

export class RouteRepository {
  async create({ organizationId, origin, destination, originStationId, destinationStationId, distanceKm, estimatedDurationHours, isActive = true }) {
    let resolvedOrigin = origin;
    let resolvedDestination = destination;

    if (!resolvedOrigin && originStationId) {
      const stn = await prisma.stations.findUnique({ where: { id: originStationId } });
      if (stn) resolvedOrigin = stn.city || stn.name;
    }
    if (!resolvedDestination && destinationStationId) {
      const stn = await prisma.stations.findUnique({ where: { id: destinationStationId } });
      if (stn) resolvedDestination = stn.city || stn.name;
    }

    resolvedOrigin = resolvedOrigin || 'Origin Terminal';
    resolvedDestination = resolvedDestination || 'Destination Terminal';

    return prisma.routes.create({
      data: {
        organization_id: organizationId,
        origin: resolvedOrigin,
        destination: resolvedDestination,
        origin_station_id: originStationId,
        destination_station_id: destinationStationId,
        distance_km: distanceKm,
        estimated_duration_hours: estimatedDurationHours,
        is_active: isActive,
      },
      include: {
        origin_station: {
          select: { id: true, name: true, city: true, code: true },
        },
        destination_station: {
          select: { id: true, name: true, city: true, code: true },
        },
      },
    });
  }

  async findById(routeId, organizationId = null) {
    if (!routeId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(routeId)) {
      return null;
    }
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
        origin_station: {
          select: { id: true, name: true, city: true, code: true },
        },
        destination_station: {
          select: { id: true, name: true, city: true, code: true },
        },
      },
    });
  }

  async findDuplicate(organizationId, originOrStation1, destOrStation2) {
    if (!originOrStation1 || !destOrStation2) return null;
    const isUuid = (val) => typeof val === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

    const orConditions = [
      {
        origin: { equals: originOrStation1, mode: 'insensitive' },
        destination: { equals: destOrStation2, mode: 'insensitive' },
      },
    ];

    if (isUuid(originOrStation1) && isUuid(destOrStation2)) {
      orConditions.push({
        origin_station_id: originOrStation1,
        destination_station_id: destOrStation2,
      });
    }

    return prisma.routes.findFirst({
      where: {
        organization_id: organizationId,
        OR: orConditions,
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
        { origin_station: { name: { contains: search, mode: 'insensitive' } } },
        { origin_station: { city: { contains: search, mode: 'insensitive' } } },
        { destination_station: { name: { contains: search, mode: 'insensitive' } } },
        { destination_station: { city: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [total, routes] = await Promise.all([
      prisma.routes.count({ where }),
      prisma.routes.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          origin_station: {
            select: { id: true, name: true, city: true, code: true },
          },
          destination_station: {
            select: { id: true, name: true, city: true, code: true },
          },
        },
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
    if (data.originStationId !== undefined) {
      data.origin_station_id = data.originStationId;
      delete data.originStationId;
    }
    if (data.destinationStationId !== undefined) {
      data.destination_station_id = data.destinationStationId;
      delete data.destinationStationId;
    }

    return prisma.routes.update({
      where: { id: routeId, organization_id: organizationId },
      data,
      include: {
        origin_station: {
          select: { id: true, name: true, city: true, code: true },
        },
        destination_station: {
          select: { id: true, name: true, city: true, code: true },
        },
      },
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
