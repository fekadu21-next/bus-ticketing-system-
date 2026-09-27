import prisma from '../../Config/db.js';

export class ReportRepository {
  async getOperationalStats(organizationId) {
    const [
      totalBuses,
      activeBuses,
      totalRoutes,
      activeRoutes,
      tripStats,
      bookingStats,
      paymentAggregate,
      paymentStatusCounts,
    ] = await Promise.all([
      prisma.buses.count({ where: { organization_id: organizationId } }),
      prisma.buses.count({ where: { organization_id: organizationId, is_active: true } }),
      prisma.routes.count({ where: { organization_id: organizationId } }),
      prisma.routes.count({ where: { organization_id: organizationId, is_active: true } }),
      prisma.trips.groupBy({
        by: ['status'],
        where: { organization_id: organizationId },
        _count: { _all: true },
      }),
      prisma.bookings.groupBy({
        by: ['status'],
        where: { organization_id: organizationId },
        _count: { _all: true },
      }),
      prisma.payments.aggregate({
        where: { organization_id: organizationId, status: 'COMPLETED' },
        _sum: { amount: true },
        _count: { _all: true },
      }),
      prisma.payments.groupBy({
        by: ['status'],
        where: { organization_id: organizationId },
        _count: { _all: true },
      }),
    ]);

    // Format trip counts by status
    const trips = {
      total: 0,
      scheduled: 0,
      inTransit: 0,
      completed: 0,
      cancelled: 0,
    };
    for (const row of tripStats) {
      const count = row._count._all;
      trips.total += count;
      if (row.status === 'SCHEDULED') trips.scheduled = count;
      else if (row.status === 'IN_TRANSIT') trips.inTransit = count;
      else if (row.status === 'COMPLETED') trips.completed = count;
      else if (row.status === 'CANCELLED') trips.cancelled = count;
    }

    // Format booking counts by status
    const bookings = {
      total: 0,
      confirmed: 0,
      pending: 0,
      cancelled: 0,
    };
    for (const row of bookingStats) {
      const count = row._count._all;
      bookings.total += count;
      if (row.status === 'CONFIRMED') bookings.confirmed = count;
      else if (row.status === 'PENDING') bookings.pending = count;
      else if (row.status === 'CANCELLED') bookings.cancelled = count;
    }

    // Format payments
    const payments = {
      totalCompletedTransactions: paymentAggregate._count._all || 0,
      totalRevenue: Number(paymentAggregate._sum.amount || 0),
      currency: 'ETB',
      byStatus: {},
    };
    for (const row of paymentStatusCounts) {
      payments.byStatus[row.status] = row._count._all;
    }

    return {
      buses: {
        total: totalBuses,
        active: activeBuses,
        inactive: totalBuses - activeBuses,
      },
      routes: {
        total: totalRoutes,
        active: activeRoutes,
        inactive: totalRoutes - activeRoutes,
      },
      trips,
      bookings,
      payments,
    };
  }
}

export const reportRepository = new ReportRepository();
export default reportRepository;
