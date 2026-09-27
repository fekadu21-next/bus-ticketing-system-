import prisma from '../../Config/db.js';

export class BookingRepository {
  async findAll(organizationId, { page = 1, limit = 20, status = null, tripId = null, search = '' } = {}) {
    const skip = (page - 1) * limit;
    const where = { organization_id: organizationId };

    if (status) {
      where.status = status;
    }
    if (tripId) {
      where.trip_id = tripId;
    }
    if (search) {
      where.users = {
        OR: [
          { first_name: { contains: search, mode: 'insensitive' } },
          { last_name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } },
        ],
      };
    }

    const [total, bookings] = await Promise.all([
      prisma.bookings.count({ where }),
      prisma.bookings.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          users: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              email: true,
              phone: true,
            },
          },
          trips: {
            include: {
              buses: { select: { id: true, plate_number: true, model: true } },
              routes: { select: { id: true, origin: true, destination: true } },
            },
          },
          seats: {
            select: { id: true, seat_number: true, status: true },
          },
          payments: {
            select: { id: true, amount: true, currency: true, payment_method: true, status: true, transaction_reference: true },
          },
        },
      }),
    ]);

    return { total, page, limit, bookings };
  }

  async findById(bookingId, organizationId = null) {
    const where = { id: bookingId };
    if (organizationId) {
      where.organization_id = organizationId;
    }

    return prisma.bookings.findFirst({
      where,
      include: {
        users: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
            phone: true,
          },
        },
        trips: {
          include: {
            buses: true,
            routes: true,
          },
        },
        seats: true,
        payments: true,
        organizations: {
          select: { id: true, name: true },
        },
      },
    });
  }
}

export const bookingRepository = new BookingRepository();
export default bookingRepository;
