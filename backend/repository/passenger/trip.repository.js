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
    const skip = (page - 1) * limit;

    // Filters for passenger-visible bookable trips
    const where = {
      status: { in: ['SCHEDULED', 'PUBLISHED'] },
      departure_time: { gte: new Date() },
      organizations: {
        is_active: true,
        // If organization has status, must be APPROVED
        status: { in: ['APPROVED', 'ACTIVE'] },
      },
    };

    if (operatorId) {
      where.organization_id = operatorId;
    }

    if (operator) {
      where.organizations = {
        ...where.organizations,
        name: { contains: operator, mode: 'insensitive' },
      };
    }

    if (origin || destination) {
      where.routes = { is_active: true };
      if (origin) {
        where.routes.origin = { contains: origin, mode: 'insensitive' };
      }
      if (destination) {
        where.routes.destination = { contains: destination, mode: 'insensitive' };
      }
    }

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setUTCHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setUTCHours(23, 59, 59, 999);

      // Must be on the specified travel date and not in past
      const minDate = startOfDay > new Date() ? startOfDay : new Date();
      where.departure_time = {
        gte: minDate,
        lte: endOfDay,
      };
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
        take: limit,
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
            select: { id: true, status: true },
          },
        },
      }),
    ]);

    const formattedTrips = trips.map((trip) => {
      const availableSeats = trip.seats.filter((s) => s.status === 'AVAILABLE').length;
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
      };
    });

    return {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
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
