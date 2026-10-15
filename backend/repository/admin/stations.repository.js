import prisma from '../../Config/db.js';

export class StationsRepository {
  async create({ name, city, code, address, latitude, longitude, isActive = true }) {
    return prisma.stations.create({
      data: {
        name,
        city,
        code,
        address,
        latitude,
        longitude,
        is_active: isActive,
      },
    });
  }

  async findById(stationId) {
    return prisma.stations.findUnique({
      where: { id: stationId },
      include: {
        origin_routes: {
          select: {
            id: true,
            destination_station: {
              select: { name: true, city: true },
            },
          },
        },
        destination_routes: {
          select: {
            id: true,
            origin_station: {
              select: { name: true, city: true },
            },
          },
        },
      },
    });
  }

  async findByCode(code) {
    return prisma.stations.findUnique({
      where: { code },
    });
  }

  async findAll({ page = 1, limit = 20, search = '', city = '', isActive = null } = {}) {
    const skip = (page - 1) * limit;
    const where = {};

    if (isActive !== null && isActive !== undefined) {
      where.is_active = isActive;
    }

    if (city) {
      where.city = { contains: city, mode: 'insensitive' };
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, stations] = await Promise.all([
      prisma.stations.count({ where }),
      prisma.stations.findMany({
        where,
        skip,
        take: limit,
        orderBy: { city: 'asc' },
        include: {
          _count: {
            select: {
              origin_routes: true,
              destination_routes: true,
            },
          },
        },
      }),
    ]);

    return { total, page, limit, stations };
  }

  async update(stationId, updateData) {
    const data = {};
    if (updateData.name !== undefined) data.name = updateData.name;
    if (updateData.city !== undefined) data.city = updateData.city;
    if (updateData.code !== undefined) data.code = updateData.code;
    if (updateData.address !== undefined) data.address = updateData.address;
    if (updateData.latitude !== undefined) data.latitude = updateData.latitude;
    if (updateData.longitude !== undefined) data.longitude = updateData.longitude;
    const activeVal = updateData.isActive !== undefined ? updateData.isActive : updateData.is_active;
    if (activeVal !== undefined) data.is_active = Boolean(activeVal);
    data.updated_at = new Date();

    return prisma.stations.update({
      where: { id: stationId },
      data,
    });
  }

  async delete(stationId) {
    const station = await this.findById(stationId);

    if (!station) {
      throw new Error('Station not found');
    }

    const activeRouteCount = station.origin_routes.length + station.destination_routes.length;
    if (activeRouteCount > 0) {
      throw new Error(`Cannot delete station with ${activeRouteCount} linked route(s). Remove or reassign the routes first.`);
    }

    return prisma.stations.delete({
      where: { id: stationId },
    });
  }

  async getAllActive() {
    return prisma.stations.findMany({
      where: { is_active: true },
      orderBy: { city: 'asc' },
      select: {
        id: true,
        name: true,
        city: true,
        code: true,
        address: true,
      },
    });
  }
}

export const stationsRepository = new StationsRepository();
export default stationsRepository;
