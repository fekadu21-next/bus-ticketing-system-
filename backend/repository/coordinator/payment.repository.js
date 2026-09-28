import prisma from '../../Config/db.js';

export class PaymentRepository {
  async findAll(organizationId, { page = 1, limit = 20, status = null, paymentMethod = null, fromDate = null, toDate = null } = {}) {
    const skip = (page - 1) * limit;
    const where = { organization_id: organizationId };

    if (status) {
      where.status = status;
    }
    if (paymentMethod) {
      where.payment_method = paymentMethod;
    }
    if (fromDate || toDate) {
      where.created_at = {};
      if (fromDate) where.created_at.gte = new Date(fromDate);
      if (toDate) where.created_at.lte = new Date(toDate);
    }

    const [total, payments] = await Promise.all([
      prisma.payments.count({ where }),
      prisma.payments.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          bookings: {
            include: {
              users: {
                select: { id: true, first_name: true, last_name: true, email: true },
              },
              trips: {
                include: {
                  routes: { select: { origin: true, destination: true } },
                },
              },
            },
          },
        },
      }),
    ]);

    return { total, page, limit, payments };
  }

  async findById(paymentId, organizationId = null) {
    const where = { id: paymentId };
    if (organizationId) {
      where.organization_id = organizationId;
    }

    return prisma.payments.findFirst({
      where,
      include: {
        bookings: {
          include: {
            users: {
              select: { id: true, first_name: true, last_name: true, email: true, phone: true },
            },
            trips: {
              include: {
                buses: { select: { plate_number: true, model: true } },
                routes: { select: { origin: true, destination: true } },
              },
            },
            seats: { select: { seat_number: true } },
          },
        },
        organizations: {
          select: { id: true, name: true },
        },
      },
    });
  }
}

export const paymentRepository = new PaymentRepository();
export default paymentRepository;
