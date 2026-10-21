import prisma from '../../Config/db.js';

export class TripRepository {
  async create({ organizationId, busId, routeId, departureTime, arrivalTime, fare, capacity, driverId = null, verifierId = null }) {
    return prisma.$transaction(async (tx) => {
      const trip = await tx.trips.create({
        data: {
          organization_id: organizationId,
          bus_id: busId,
          route_id: routeId,
          driver_id: driverId || null,
          verifier_id: verifierId || null,
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

      // Manually fetch driver & verifier information if assigned
      let driver = null;
      if (trip.driver_id) {
        driver = await tx.users.findUnique({
          where: { id: trip.driver_id },
          select: { id: true, first_name: true, last_name: true, email: true, phone: true },
        });
      }

      let verifier = null;
      if (trip.verifier_id) {
        verifier = await tx.users.findUnique({
          where: { id: trip.verifier_id },
          select: { id: true, first_name: true, last_name: true, email: true, phone: true },
        });
      }

      return {
        ...trip,
        driver,
        verifier,
      };
    }, { timeout: 30000, maxWait: 10000 });
  }

  async findById(tripId, organizationId = null) {
    if (!tripId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(tripId)) {
      return null;
    }
    const where = { id: tripId };
    if (organizationId) {
      where.organization_id = organizationId;
    }
    const trip = await prisma.trips.findFirst({
      where,
      include: {
        buses: true,
        routes: {
          include: {
            origin_station: {
              select: { id: true, name: true, city: true, code: true },
            },
            destination_station: {
              select: { id: true, name: true, city: true, code: true },
            },
          },
        },
        organizations: {
          select: { id: true, name: true },
        },
        _count: {
          select: {
            seats: true,
            bookings: {
              where: { status: { in: ['CONFIRMED', 'PENDING'] } },
            },
          },
        },
      },
    });

    if (!trip) return null;

    // Manually fetch driver and verifier information
    let driver = null;
    if (trip.driver_id) {
      driver = await prisma.users.findUnique({
        where: { id: trip.driver_id },
        select: { id: true, first_name: true, last_name: true, email: true, phone: true },
      });
    }

    let verifier = null;
    if (trip.verifier_id) {
      verifier = await prisma.users.findUnique({
        where: { id: trip.verifier_id },
        select: { id: true, first_name: true, last_name: true, email: true, phone: true },
      });
    }

    return {
      ...trip,
      driver,
      verifier,
    };
  }

  async findAll(organizationId, { page = 1, limit = 20, status = null, routeId = null, busId = null, driverId = null, fromDate = null, toDate = null } = {}) {
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
    if (driverId) {
      where.driver_id = driverId;
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
            include: {
              origin_station: {
                select: { id: true, name: true, city: true, code: true },
              },
              destination_station: {
                select: { id: true, name: true, city: true, code: true },
              },
            },
          },
          seats: {
            select: { id: true, status: true, seat_number: true },
          },
          _count: {
            select: {
              seats: true,
              bookings: {
                where: { status: { in: ['CONFIRMED', 'PENDING'] } },
              },
            },
          },
        },
      }),
    ]);

    // Manually fetch driver and verifier information to avoid relation issues
    const tripsWithStaff = await Promise.all(
      trips.map(async (trip) => {
        let driver = null;
        if (trip.driver_id) {
          driver = await prisma.users.findUnique({
            where: { id: trip.driver_id },
            select: { id: true, first_name: true, last_name: true, email: true, phone: true },
          });
        }

        let verifier = null;
        if (trip.verifier_id) {
          verifier = await prisma.users.findUnique({
            where: { id: trip.verifier_id },
            select: { id: true, first_name: true, last_name: true, email: true, phone: true },
          });
        }

        const seats = trip.seats || [];
        const activeBookingsCount = trip._count?.bookings || 0;
        const availableCount = seats.filter((s) => s.status === 'AVAILABLE').length;
        const bookedCount = seats.filter((s) => s.status === 'BOOKED').length;
        const blockedCount = seats.filter((s) => s.status === 'BLOCKED').length;
        const heldCount = seats.filter((s) => s.status === 'HELD' || s.status === 'LOCKED').length;

        return {
          ...trip,
          driver,
          verifier,
          availableSeatsCount: availableCount,
          bookedSeatsCount: Math.max(bookedCount, activeBookingsCount),
          blockedSeatsCount: blockedCount,
          heldSeatsCount: heldCount,
        };
      })
    );

    return { total, page, limit, trips: tripsWithStaff };
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
    if (data.driverId !== undefined) {
      data.driver_id = data.driverId || null;
      delete data.driverId;
    }
    if (data.verifierId !== undefined) {
      data.verifier_id = data.verifierId || null;
      delete data.verifierId;
    }

    const trip = await prisma.trips.update({
      where: { id: tripId, organization_id: organizationId },
      data,
      include: {
        buses: true,
        routes: true,
      },
    });

    // Manually fetch driver and verifier information
    let driver = null;
    if (trip.driver_id) {
      driver = await prisma.users.findUnique({
        where: { id: trip.driver_id },
        select: { id: true, first_name: true, last_name: true, email: true, phone: true },
      });
    }

    let verifier = null;
    if (trip.verifier_id) {
      verifier = await prisma.users.findUnique({
        where: { id: trip.verifier_id },
        select: { id: true, first_name: true, last_name: true, email: true, phone: true },
      });
    }

    return {
      ...trip,
      driver,
      verifier,
    };
  }

  async assignDriver(tripId, organizationId, driverId) {
    const trip = await prisma.trips.update({
      where: { id: tripId, organization_id: organizationId },
      data: {
        driver_id: driverId || null,
        updated_at: new Date(),
      },
      include: {
        buses: true,
        routes: true,
      },
    });

    // Manually fetch driver information
    let driver = null;
    if (trip.driver_id) {
      driver = await prisma.users.findUnique({
        where: { id: trip.driver_id },
        select: { id: true, first_name: true, last_name: true, email: true, phone: true },
      });
    }

    let verifier = null;
    if (trip.verifier_id) {
      verifier = await prisma.users.findUnique({
        where: { id: trip.verifier_id },
        select: { id: true, first_name: true, last_name: true, email: true, phone: true },
      });
    }

    return {
      ...trip,
      driver,
      verifier,
    };
  }

  async assignVerifier(tripId, organizationId, verifierId) {
    const trip = await prisma.trips.update({
      where: { id: tripId, organization_id: organizationId },
      data: {
        verifier_id: verifierId || null,
        updated_at: new Date(),
      },
      include: {
        buses: true,
        routes: true,
      },
    });

    let driver = null;
    if (trip.driver_id) {
      driver = await prisma.users.findUnique({
        where: { id: trip.driver_id },
        select: { id: true, first_name: true, last_name: true, email: true, phone: true },
      });
    }

    let verifier = null;
    if (trip.verifier_id) {
      verifier = await prisma.users.findUnique({
        where: { id: trip.verifier_id },
        select: { id: true, first_name: true, last_name: true, email: true, phone: true },
      });
    }

    return {
      ...trip,
      driver,
      verifier,
    };
  }

  async delete(tripId, organizationId) {
    return prisma.$transaction(async (tx) => {
      await tx.seats.deleteMany({
        where: { trip_id: tripId },
      });
      return tx.trips.delete({
        where: { id: tripId, organization_id: organizationId },
      });
    });
  }

  async countActiveBookings(tripId) {
    return prisma.bookings.count({
      where: {
        trip_id: tripId,
        status: { in: ['CONFIRMED', 'PENDING'] },
      },
    });
  }

  async findDriverConflictingTrip(driverId, departureTime, arrivalTime, excludeTripId = null) {
    const where = {
      driver_id: driverId,
      status: { in: ['SCHEDULED', 'PUBLISHED', 'IN_TRANSIT', 'IN_PROGRESS'] },
    };
    if (excludeTripId) {
      where.id = { not: excludeTripId };
    }

    const departure = new Date(departureTime);
    const estimatedArrival = arrivalTime ? new Date(arrivalTime) : new Date(departure.getTime() + 4 * 60 * 60 * 1000);

    const activeTrips = await prisma.trips.findMany({
      where,
    });

    return activeTrips.find((t) => {
      const tripDep = new Date(t.departure_time);
      const tripArr = t.arrival_time ? new Date(t.arrival_time) : new Date(tripDep.getTime() + 4 * 60 * 60 * 1000);
      return departure < tripArr && estimatedArrival > tripDep;
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
    }, { timeout: 30000, maxWait: 10000 });
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
    if (!seatId) return null;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(seatId));
    if (isUuid) {
      return prisma.seats.findFirst({
        where: { id: seatId, trip_id: tripId },
      });
    }
    const seatNum = parseInt(seatId, 10);
    if (!isNaN(seatNum)) {
      return prisma.seats.findFirst({
        where: { trip_id: tripId, seat_number: seatNum },
      });
    }
    return null;
  }

  async updateSeatStatus(seatId, tripId, status) {
    const seat = await this.findSeatById(seatId, tripId);
    if (!seat) {
      throw new Error('Seat not found for this trip.');
    }
    return prisma.seats.update({
      where: { id: seat.id },
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
