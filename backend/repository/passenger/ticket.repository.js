import prisma from '../../Config/db.js';

export class PassengerTicketRepository {
  formatTicket(ticket) {
    if (!ticket) return null;

    return {
      id: ticket.id,
      ticketNumber: ticket.ticket_number,
      bookingId: ticket.booking_id,
      status: ticket.status,
      qrToken: ticket.qr_token,
      verifiedAt: ticket.verified_at,
      createdAt: ticket.created_at,
      seat: {
        id: ticket.seat_id,
        seatNumber: ticket.seat_number,
      },
      passenger: {
        id: ticket.passenger?.id || ticket.passenger_id,
        firstName: ticket.passenger?.first_name,
        lastName: ticket.passenger?.last_name,
        email: ticket.passenger?.email,
      },
      trip: {
        id: ticket.trips?.id || ticket.trip_id,
        departureTime: ticket.trips?.departure_time,
        departureDate: ticket.trips?.departure_time
          ? ticket.trips.departure_time.toISOString().split('T')[0]
          : null,
        arrivalTime: ticket.trips?.arrival_time,
        status: ticket.trips?.status,
        fare: ticket.trips ? Number(ticket.trips.fare) : undefined,
      },
      operator: {
        id: ticket.organizations?.id || ticket.organization_id,
        name: ticket.organizations?.name,
      },
      route: ticket.trips?.routes
        ? {
            id: ticket.trips.routes.id,
            origin: ticket.trips.routes.origin,
            destination: ticket.trips.routes.destination,
            distanceKm: ticket.trips.routes.distance_km,
            durationHours: ticket.trips.routes.estimated_duration_hours,
          }
        : null,
      bus: ticket.trips?.buses
        ? {
            id: ticket.trips.buses.id,
            plateNumber: ticket.trips.buses.plate_number,
            model: ticket.trips.buses.model,
          }
        : null,
    };
  }

  async findPassengerTickets(passengerId, { page = 1, limit = 20, status = null } = {}) {
    const skip = (page - 1) * limit;
    const where = { passenger_id: passengerId };

    if (status) {
      where.status = status;
    }

    const [total, rawTickets] = await Promise.all([
      prisma.tickets.count({ where }),
      prisma.tickets.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          passenger: {
            select: { id: true, first_name: true, last_name: true, email: true },
          },
          trips: {
            include: {
              routes: true,
              buses: true,
            },
          },
          organizations: {
            select: { id: true, name: true },
          },
        },
      }),
    ]);

    const tickets = rawTickets.map((t) => this.formatTicket(t));

    return {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      tickets,
    };
  }

  async findPassengerTicketById(ticketId, passengerId) {
    const rawTicket = await prisma.tickets.findFirst({
      where: {
        id: ticketId,
        passenger_id: passengerId,
      },
      include: {
        passenger: {
          select: { id: true, first_name: true, last_name: true, email: true },
        },
        trips: {
          include: {
            routes: true,
            buses: true,
          },
        },
        organizations: {
          select: { id: true, name: true },
        },
      },
    });

    return this.formatTicket(rawTicket);
  }
}

export const passengerTicketRepository = new PassengerTicketRepository();
export default passengerTicketRepository;
