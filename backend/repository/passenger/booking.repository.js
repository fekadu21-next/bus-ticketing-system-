import prisma from '../../Config/db.js';
import ApiError from '../../utils/apiError.js';

export class PassengerBookingRepository {
  async createBookingAtomic({ passengerId, tripId, seatId, seatNumber }) {
    return prisma.$transaction(async (tx) => {
      // 1. Fetch trip and verify bookability
      const trip = await tx.trips.findUnique({
        where: { id: tripId },
        include: {
          organizations: {
            select: { id: true, name: true, is_active: true, status: true },
          },
          buses: {
            select: { id: true, plate_number: true, model: true, capacity: true },
          },
          routes: {
            select: { id: true, origin: true, destination: true },
          },
        },
      });

      if (!trip) {
        throw new ApiError(404, 'Trip not found.');
      }

      if (!['SCHEDULED', 'PUBLISHED'].includes(trip.status)) {
        throw new ApiError(400, 'Trip is not available for booking.');
      }

      if (trip.departure_time < new Date()) {
        throw new ApiError(400, 'Cannot book a trip that has already departed.');
      }

      if (!trip.organizations?.is_active || trip.organizations?.status === 'REJECTED' || trip.organizations?.status === 'SUSPENDED') {
        throw new ApiError(400, 'Trip operator is not currently active.');
      }

      // 2. Identify target seat
      let targetSeat;
      if (seatId) {
        targetSeat = await tx.seats.findFirst({
          where: { id: seatId, trip_id: tripId },
        });
      } else {
        targetSeat = await tx.seats.findFirst({
          where: { trip_id: tripId, seat_number: seatNumber },
        });
      }

      if (!targetSeat) {
        throw new ApiError(404, 'Selected seat does not exist on this trip.');
      }

      // 3. Atomically reserve seat to prevent double-booking
      const updateResult = await tx.seats.updateMany({
        where: {
          id: targetSeat.id,
          trip_id: tripId,
          status: 'AVAILABLE',
        },
        data: {
          status: 'LOCKED',
          updated_at: new Date(),
        },
      });

      if (updateResult.count === 0) {
        throw new ApiError(409, `Seat ${targetSeat.seat_number} is no longer available.`);
      }

      // 4. Create booking
      const booking = await tx.bookings.create({
        data: {
          organization_id: trip.organization_id,
          trip_id: trip.id,
          passenger_id: passengerId,
          seat_id: targetSeat.id,
          seat_number: targetSeat.seat_number,
          total_fare: trip.fare,
          status: 'PENDING',
        },
        include: {
          trips: {
            include: {
              routes: true,
              buses: true,
            },
          },
          seats: true,
          organizations: {
            select: { id: true, name: true },
          },
        },
      });

      return booking;
    }, { maxWait: 10000, timeout: 25000 });
  }

  async findPassengerBookings(passengerId, { page = 1, limit = 20, status = null } = {}) {
    const skip = (page - 1) * limit;
    const where = { passenger_id: passengerId };

    if (status) {
      where.status = status;
    }

    const [total, bookings] = await Promise.all([
      prisma.bookings.count({ where }),
      prisma.bookings.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          trips: {
            include: {
              routes: { select: { origin: true, destination: true } },
              buses: { select: { plate_number: true, model: true } },
            },
          },
          seats: { select: { id: true, seat_number: true, status: true } },
          payments: { select: { id: true, amount: true, currency: true, status: true, payment_method: true } },
          tickets: { select: { id: true, ticket_number: true, status: true, qr_token: true } },
          organizations: { select: { id: true, name: true } },
        },
      }),
    ]);

    return {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      bookings,
    };
  }

  async findPassengerBookingById(bookingId, passengerId) {
    const booking = await prisma.bookings.findFirst({
      where: {
        id: bookingId,
        passenger_id: passengerId,
      },
      include: {
        trips: {
          include: {
            routes: true,
            buses: true,
          },
        },
        seats: true,
        payments: true,
        tickets: true,
        organizations: {
          select: { id: true, name: true },
        },
      },
    });

    return booking;
  }
}

export const passengerBookingRepository = new PassengerBookingRepository();
export default passengerBookingRepository;
