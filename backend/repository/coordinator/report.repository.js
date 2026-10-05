import prisma from '../../Config/db.js';

export class ReportRepository {
  async getOperationalStats(organizationId) {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const [
      totalBuses,
      activeBuses,
      totalRoutes,
      activeRoutes,
      tripStats,
      bookingStats,
      paymentAggregate,
      paymentStatusCounts,
      staffList,
      todayTripsCount,
      todayBookingsCount,
      todayPaymentsAggregate,
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
      prisma.user_roles.findMany({
        where: { organization_id: organizationId },
        include: { roles: true, users: true },
      }),
      prisma.trips.count({
        where: {
          organization_id: organizationId,
          departure_time: { gte: startOfToday, lte: endOfToday },
        },
      }),
      prisma.bookings.count({
        where: {
          organization_id: organizationId,
          created_at: { gte: startOfToday, lte: endOfToday },
        },
      }),
      prisma.payments.aggregate({
        where: {
          organization_id: organizationId,
          status: 'COMPLETED',
          created_at: { gte: startOfToday, lte: endOfToday },
        },
        _sum: { amount: true },
        _count: { _all: true },
      }),
    ]);

    // Format trip counts by status
    const trips = {
      total: 0,
      scheduled: 0,
      published: 0,
      inTransit: 0,
      completed: 0,
      cancelled: 0,
    };
    for (const row of tripStats) {
      const count = row._count._all;
      trips.total += count;
      if (row.status === 'SCHEDULED') trips.scheduled = count;
      else if (row.status === 'PUBLISHED') trips.published = count;
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

    // Format staff counts
    const staff = {
      total: staffList.length,
      drivers: {
        total: staffList.filter((s) => s.roles.name === 'DRIVER').length,
        active: staffList.filter((s) => s.roles.name === 'DRIVER' && s.users.is_active).length,
      },
      verifiers: {
        total: staffList.filter((s) => s.roles.name === 'TICKET_VERIFIER').length,
        active: staffList.filter((s) => s.roles.name === 'TICKET_VERIFIER' && s.users.is_active).length,
      },
      coordinators: {
        total: staffList.filter((s) => s.roles.name === 'BOOKING_COORDINATOR').length,
      },
    };

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

    // Today's metrics
    const today = {
      tripsCount: todayTripsCount,
      bookingsCount: todayBookingsCount,
      revenue: Number(todayPaymentsAggregate._sum.amount || 0),
    };

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
      staff,
      today,
    };
  }
}

export const reportRepository = new ReportRepository();
export default reportRepository;
