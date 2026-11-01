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
        routes: {
          select: { id: true, origin: true, destination: true, distance_km: true, estimated_duration_hours: true },
        },
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

  async findTicketByIdentifiers({
    ticketId = null,
    ticketNumber = null,
    cleanTicketNumber = null,
    qrToken = null,
    bookingId = null,
    bookingNumber = null,
    seatNumber = null,
  } = {}) {
    const isUUID = (val) =>
      typeof val === 'string' &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(val.trim());

    const orConditions = [];

    if (ticketId && isUUID(ticketId)) {
      orConditions.push({ id: ticketId.trim() });
    }

    if (qrToken && typeof qrToken === 'string' && qrToken.trim()) {
      const q = qrToken.trim();
      orConditions.push({ qr_token: q });
      if (isUUID(q)) {
        orConditions.push({ id: q });
        orConditions.push({ booking_id: q });
      }
    }

    if (ticketNumber && typeof ticketNumber === 'string' && ticketNumber.trim()) {
      const tn = ticketNumber.trim();
      orConditions.push({ ticket_number: { equals: tn, mode: 'insensitive' } });
      orConditions.push({ qr_token: tn });
      if (isUUID(tn)) {
        orConditions.push({ id: tn });
        orConditions.push({ booking_id: tn });
      }
    }

    if (cleanTicketNumber && typeof cleanTicketNumber === 'string' && cleanTicketNumber.trim()) {
      const ctn = cleanTicketNumber.trim();
      if (ctn !== ticketNumber) {
        orConditions.push({ ticket_number: { equals: ctn, mode: 'insensitive' } });
        orConditions.push({ qr_token: ctn });
        if (isUUID(ctn)) {
          orConditions.push({ id: ctn });
          orConditions.push({ booking_id: ctn });
        }
      }
    }

    if (bookingId && isUUID(bookingId)) {
      if (seatNumber) {
        orConditions.push({
          booking_id: bookingId.trim(),
          seat_number: Number(seatNumber),
        });
      }
      orConditions.push({ booking_id: bookingId.trim() });
    }

    if (orConditions.length === 0) return null;

    return prisma.tickets.findFirst({
      where: { OR: orConditions },
      include: {
        passenger: {
          select: { id: true, first_name: true, last_name: true, email: true, phone: true },
        },
        trips: {
          include: {
            routes: {
              select: { id: true, origin: true, destination: true, distance_km: true, estimated_duration_hours: true },
            },
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

  async findTicketByToken(qrToken) {
    if (!qrToken) return null;
    return this.findTicketByIdentifiers({ qrToken, ticketNumber: qrToken });
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
            routes: {
              select: { id: true, origin: true, destination: true, distance_km: true, estimated_duration_hours: true },
            },
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
          status: { in: ['UNUSED', 'ACTIVE', 'VALID', 'CONFIRMED'] },
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
