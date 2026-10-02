import prisma from '../../Config/db.js';

export class VerifierRepository {
  async findTripsForOrganization(organizationId, { page = 1, limit = 20, date = null, status = null } = {}) {
    const skip = (page - 1) * limit;
    const where = { organization_id: organizationId };

    if (status) {
      where.status = status;
    }

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setUTCHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setUTCHours(23, 59, 59, 999);

      where.departure_time = {
        gte: startOfDay,
        lte: endOfDay,
      };
    }

    const [total, trips] = await Promise.all([
      prisma.trips.count({ where }),
      prisma.trips.findMany({
        where,
        skip,
        take: limit,
        orderBy: { departure_time: 'desc' },
        include: {
          organizations: {
            select: { id: true, name: true, type: true },
          },
          routes: {
            select: { id: true, origin: true, destination: true, distance_km: true },
          },
          buses: {
            select: { id: true, plate_number: true, model: true, capacity: true },
          },
          _count: {
            select: {
              seats: true,
              bookings: true,
              tickets: true,
            },
          },
        },
      }),
    ]);

    // Calculate verification stats for each trip
    const tripsWithStats = await Promise.all(
      trips.map(async (trip) => {
        const [verifiedCount, totalTickets] = await Promise.all([
          prisma.tickets.count({
            where: { trip_id: trip.id, status: 'USED' },
          }),
          prisma.tickets.count({
            where: { trip_id: trip.id },
          }),
        ]);

        return {
          id: trip.id,
          operator: trip.organizations,
          route: trip.routes,
          bus: trip.buses,
          departureDate: trip.departure_time.toISOString().split('T')[0],
          departureTime: trip.departure_time,
          arrivalTime: trip.arrival_time,
          status: trip.status,
          fare: Number(trip.fare),
          capacity: trip.buses?.capacity || 0,
          totalBookings: trip._count.bookings,
          verificationSummary: {
            totalTickets,
            verifiedTickets: verifiedCount,
            unverifiedTickets: totalTickets - verifiedCount,
          },
        };
      })
    );

    return {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      trips: tripsWithStats,
    };
  }

  async findTripById(tripId, organizationId) {
    const where = { id: tripId };
    if (organizationId) {
      where.organization_id = organizationId;
    }

    return prisma.trips.findFirst({
      where,
      include: {
        organizations: {
          select: { id: true, name: true, type: true },
        },
        routes: true,
        buses: true,
        tickets: {
          include: {
            passenger: {
              select: { id: true, first_name: true, last_name: true, phone: true },
            },
            seats: {
              select: { seat_number: true },
            },
          },
        },
      },
    });
  }

  async findTicketByToken(qrToken) {
    return prisma.tickets.findUnique({
      where: { qr_token: qrToken },
      include: {
        passenger: {
          select: { id: true, first_name: true, last_name: true, email: true, phone: true },
        },
        trips: {
          include: {
            routes: true,
            buses: true,
            organizations: true,
          },
        },
        bookings: {
          select: { id: true, status: true, total_fare: true },
        },
        seats: {
          select: { id: true, seat_number: true, status: true },
        },
        organizations: {
          select: { id: true, name: true },
        },
      },
    });
  }

  async findTicketById(ticketId) {
    return prisma.tickets.findUnique({
      where: { id: ticketId },
      include: {
        passenger: {
          select: { id: true, first_name: true, last_name: true, email: true, phone: true },
        },
        trips: {
          include: {
            routes: true,
            buses: true,
            organizations: true,
          },
        },
        bookings: {
          select: { id: true, status: true, total_fare: true },
        },
        seats: {
          select: { id: true, seat_number: true, status: true },
        },
        organizations: {
          select: { id: true, name: true },
        },
      },
    });
  }

  async createVerificationAuditRecord({ ticketId, bookingId, tripId, verifierId, organizationId, result, notes }) {
    return prisma.ticket_verifications.create({
      data: {
        ticket_id: ticketId || null,
        booking_id: bookingId || null,
        trip_id: tripId || null,
        verifier_id: verifierId,
        organization_id: organizationId,
        result,
        notes: notes || null,
      },
    });
  }

  async atomicallyVerifyTicket(ticketId, verifierId) {
    return prisma.$transaction(async (tx) => {
      const updateResult = await tx.tickets.updateMany({
        where: {
          id: ticketId,
          status: 'UNUSED',
        },
        data: {
          status: 'USED',
          verified_at: new Date(),
          verified_by: verifierId,
          updated_at: new Date(),
        },
      });

      return updateResult.count > 0;
    }, { maxWait: 10000, timeout: 25000 });
  }

  async getRecentVerifications(verifierId, organizationId, limit = 20) {
    return prisma.ticket_verifications.findMany({
      where: {
        verifier_id: verifierId,
        organization_id: organizationId,
      },
      take: limit,
      orderBy: { created_at: 'desc' },
      include: {
        tickets: {
          select: { ticket_number: true, seat_number: true },
        },
        trips: {
          include: { routes: { select: { origin: true, destination: true } } },
        },
      },
    });
  }
}

export const verifierRepository = new VerifierRepository();
export default verifierRepository;
