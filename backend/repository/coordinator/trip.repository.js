import prisma from '../../Config/db.js';

export class TripRepository {
  async create({ organizationId, busId, routeId, departureTime, arrivalTime, fare, capacity }) {
    return prisma.$transaction(async (tx) => {
      const trip = await tx.trips.create({
        data: {
          organization_id: organizationId,
          bus_id: busId,
          route_id: routeId,
          departure_time: new Date(departureTime),
          arrival_time: arrivalTime ? new Date(arrivalTime) : null,
          fare,
          status: 'SCHEDULED',
        },
        include: {
          buses: true,
          routes: true,
        },
      });

      // Automatically initialize seats for this trip based on bus capacity
      const seatCount = capacity || 50;
      const seatData = [];
      for (let i = 1; i <= seatCount; i++) {
        seatData.push({
          trip_id: trip.id,
          seat_number: i,
          status: 'AVAILABLE',
        });
      }

      await tx.seats.createMany({
        data: seatData,
      });

      return trip;
    });
  }

  async findById(tripId, organizationId = null) {
    const where = { id: tripId };
    if (organizationId) {
      where.organization_id = organizationId;
    }
    return prisma.trips.findFirst({
      where,
      include: {
        buses: true,
        routes: true,
        organizations: {
          select: { id: true, name: true },
        },
        _count: {
          select: {
            seats: true,
            bookings: true,
          },
        },
      },
    });
  }

  async findAll(organizationId, { page = 1, limit = 20, status = null, routeId = null, busId = null, fromDate = null, toDate = null } = {}) {
    const skip = (page - 1) * limit;
    const where = { organization_id: organizationId };

    if (status) {
      where.status = status;
    }
    if (routeId) {
      where.route_id = routeId;
    }
    if (busId) {
      where.bus_id = busId;
    }
    if (fromDate || toDate) {
      where.departure_time = {};
      if (fromDate) where.departure_time.gte = new Date(fromDate);
      if (toDate) where.departure_time.lte = new Date(toDate);
    }

    const [total, trips] = await Promise.all([
      prisma.trips.count({ where }),
      prisma.trips.findMany({
        where,
        skip,
        take: limit,
        orderBy: { departure_time: 'desc' },
        include: {
          buses: {
            select: { id: true, plate_number: true, model: true, capacity: true },
          },
          routes: {
            select: { id: true, origin: true, destination: true, distance_km: true },
          },
          _count: {
            select: {
              seats: true,
              bookings: true,
            },
          },
        },
      }),
    ]);

    return { total, page, limit, trips };
  }

  async update(tripId, organizationId, updateData) {
    const data = { ...updateData, updated_at: new Date() };
    if (data.departureTime) {
      data.departure_time = new Date(data.departureTime);
      delete data.departureTime;
    }
    if (data.arrivalTime !== undefined) {
      data.arrival_time = data.arrivalTime ? new Date(data.arrivalTime) : null;
      delete data.arrivalTime;
    }
    if (data.busId) {
      data.bus_id = data.busId;
      delete data.busId;
    }
    if (data.routeId) {
      data.route_id = data.routeId;
      delete data.routeId;
    }

    return prisma.trips.update({
      where: { id: tripId, organization_id: organizationId },
      data,
      include: {
        buses: true,
        routes: true,
      },
    });
  }

  async cancel(tripId, organizationId) {
    return prisma.$transaction(async (tx) => {
      const trip = await tx.trips.update({
        where: { id: tripId, organization_id: organizationId },
        data: {
          status: 'CANCELLED',
          updated_at: new Date(),
        },
      });

      // Update seats to AVAILABLE or leave record
      await tx.seats.updateMany({
        where: { trip_id: tripId, status: 'LOCKED' },
        data: { status: 'AVAILABLE' },
      });

      return trip;
    });
  }

  // --- Seat Management Methods ---
  async getSeats(tripId) {
    return prisma.seats.findMany({
      where: { trip_id: tripId },
      orderBy: { seat_number: 'asc' },
    });
  }

  async findSeatByNumber(tripId, seatNumber) {
    return prisma.seats.findUnique({
      where: {
        trip_id_seat_number: {
          trip_id: tripId,
          seat_number: seatNumber,
        },
      },
    });
  }

  async findSeatById(seatId, tripId) {
    return prisma.seats.findFirst({
      where: { id: seatId, trip_id: tripId },
    });
  }

  async updateSeatStatus(seatId, tripId, status) {
    return prisma.seats.update({
      where: { id: seatId, trip_id: tripId },
      data: {
        status,
        updated_at: new Date(),
      },
    });
  }

  async updateSeatsBatch(tripId, seatNumbers, status) {
    return prisma.seats.updateMany({
      where: {
        trip_id: tripId,
        seat_number: { in: seatNumbers },
      },
      data: {
        status,
        updated_at: new Date(),
      },
    });
  }
}

export const tripRepository = new TripRepository();
export default tripRepository;
