import prisma from '../../Config/db.js';

export class PassengerTripRepository {
  async searchTrips({
    origin,
    destination,
    date,
    operator,
    operatorId,
    page = 1,
    limit = 20,
    sortBy = 'departureTime',
    sortOrder = 'asc',
  }) {
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    // Build filters for passenger-visible bookable trips
    // NOTE: Use Prisma's 'is:' wrapper for filtering on related models
    const where = {
      status: { in: ['SCHEDULED', 'PUBLISHED', 'ACTIVE', 'OPEN'] },
      departure_time: { gte: new Date() }, // Always only show future/upcoming trips
      organizations: {
        is: {
          is_active: true,
          status: { notIn: ['REJECTED', 'SUSPENDED', 'BANNED'] },
        },
      },
    };


    if (operatorId) {
      where.organization_id = operatorId;
    }

    if (operator) {
      const cleanOp = operator.trim().toLowerCase();
      // Build search candidates (e.g., "anbesa buses" -> ["anbesa", "bus"], "abesa" -> "anbesa", "mekele" -> "mekelle")
      const candidates = [cleanOp];
      if (cleanOp.includes('abesa') || cleanOp.includes('anbesa')) {
        candidates.push('anbesa');
      }
      if (cleanOp.includes('mekele') || cleanOp.includes('mekelle') || cleanOp.includes('mekel')) {
        candidates.push('mekel');
      }
      if (cleanOp.includes('selam')) {
        candidates.push('selam');
      }
      cleanOp.split(/\s+/).forEach((w) => {
        const stem = w.replace(/(es|s|lines|line|buses|bus)$/, '');
        if (stem.length >= 3) candidates.push(stem);
      });

      const uniqueCandidates = Array.from(new Set(candidates));

      where.organizations = {
        is: {
          ...where.organizations?.is,
          OR: uniqueCandidates.map((c) => ({
            name: { contains: c, mode: 'insensitive' },
          })),
        },
      };
    }

    if (origin || destination) {
      where.routes = { is: {} };
      if (origin) {
        where.routes.is.origin = { contains: origin, mode: 'insensitive' };
      }
      if (destination) {
        where.routes.is.destination = { contains: destination, mode: 'insensitive' };
      }
    }

    if (date) {
      const datePart = typeof date === 'string' ? date.split('T')[0] : new Date(date).toISOString().split('T')[0];
      // Span ±24h around the selected date to handle timezone differences (EAT = UTC+3)
      const startOfDay = new Date(`${datePart}T00:00:00.000Z`);
      const localDayStart = new Date(startOfDay.getTime() - 4 * 60 * 60 * 1000);
      const localDayEnd = new Date(startOfDay.getTime() + 28 * 60 * 60 * 1000);
      where.departure_time = { gte: localDayStart, lte: localDayEnd };
    }

    const orderBy = [];
    if (sortBy === 'fare' || sortBy === 'price') {
      orderBy.push({ fare: sortOrder });
    } else {
      orderBy.push({ departure_time: sortOrder });
    }

    const [total, trips] = await Promise.all([
      prisma.trips.count({ where }),
      prisma.trips.findMany({
        where,
        skip,
        take: limitNum,
        orderBy,
        include: {
          organizations: {
            select: { id: true, name: true, type: true },
          },
          routes: {
            select: {
              id: true,
              origin: true,
              destination: true,
              distance_km: true,
              estimated_duration_hours: true,
            },
          },
          buses: {
            select: {
              id: true,
              plate_number: true,
              model: true,
              capacity: true,
            },
          },
          seats: {
            select: { id: true, status: true, seat_number: true },
          },
          bookings: {
            where: { status: { in: ['CONFIRMED', 'PENDING'] } },
            select: { seat_number: true, status: true },
          },
        },
      }),
    ]);

    const formattedTrips = trips.map((trip) => {
      const activeBookedSeatNums = new Set(
        (trip.bookings || []).map((b) => b.seat_number)
      );

      const availableSeats = (trip.seats || []).filter(
        (s) => s.status === 'AVAILABLE' && !activeBookedSeatNums.has(s.seat_number)
      ).length;
      const departureDate = trip.departure_time.toISOString().split('T')[0];

      return {
        id: trip.id,
        operator: trip.organizations,
        route: trip.routes,
        origin: trip.routes?.origin,
        destination: trip.routes?.destination,
        departureDate,
        departureTime: trip.departure_time,
        arrivalTime: trip.arrival_time,
        bus: trip.buses,
        fare: Number(trip.fare),
        price: Number(trip.fare),
        status: trip.status,
        totalSeats: trip.buses?.capacity || trip.seats.length,
        availableSeats,
        availableSeatsCount: availableSeats,
      };
    });

    return {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
      trips: formattedTrips,
    };
  }

  async findTripById(tripId) {
    const trip = await prisma.trips.findUnique({
      where: { id: tripId },
      include: {
        organizations: {
          select: { id: true, name: true, type: true, status: true, is_active: true },
        },
        routes: {
          select: {
            id: true,
            origin: true,
            destination: true,
            distance_km: true,
            estimated_duration_hours: true,
          },
        },
        buses: {
          select: {
            id: true,
            plate_number: true,
            model: true,
            capacity: true,
          },
        },
        seats: {
          orderBy: { seat_number: 'asc' },
          select: {
            id: true,
            seat_number: true,
            status: true,
          },
        },
        bookings: {
          where: { status: { in: ['CONFIRMED', 'PENDING'] } },
          select: {
            id: true,
            seat_number: true,
            status: true,
            updated_at: true,
          },
        },
      },
    });

    return trip;
  }

  async getTripSeats(tripId) {
    return prisma.seats.findMany({
      where: { trip_id: tripId },
      orderBy: { seat_number: 'asc' },
      select: {
        id: true,
        seat_number: true,
        status: true,
      },
    });
  }
}

export const passengerTripRepository = new PassengerTripRepository();
export default passengerTripRepository;
