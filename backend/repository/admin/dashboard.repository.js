import prisma from '../../Config/db.js';
import { ORGANIZATION_STATUS } from '../../constants/organization.js';

export class AdminDashboardRepository {
  /**
   * Aggregate real organization counts by lifecycle status
   */
  async getOrganizationStats() {
    const [total, pending, approved, rejected, suspended] = await Promise.all([
      prisma.organizations.count(),
      prisma.organizations.count({ where: { status: ORGANIZATION_STATUS.PENDING } }),
      prisma.organizations.count({ where: { status: ORGANIZATION_STATUS.APPROVED } }),
      prisma.organizations.count({ where: { status: ORGANIZATION_STATUS.REJECTED } }),
      prisma.organizations.count({ where: { status: ORGANIZATION_STATUS.SUSPENDED } }),
    ]);

    return {
      total,
      pending,
      approved,
      rejected,
      suspended,
    };
  }

  /**
   * Aggregate real user platform statistics supported by existing schema
   */
  async getUserStats() {
    const [total, active, emailVerified] = await Promise.all([
      prisma.users.count(),
      prisma.users.count({ where: { is_active: true } }),
      prisma.users.count({ where: { email_verified: true } }),
    ]);

    return {
      total,
      active,
      emailVerified,
    };
  }

  /**
   * Real fleet statistics
   */
  async getFleetStats() {
    const [total, active] = await Promise.all([
      prisma.buses.count(),
      prisma.buses.count({ where: { is_active: true } }),
    ]);
    return { total, active, maintenance: total - active, status: 'UNAVAILABLE' };
  }

  /**
   * Real trip statistics
   */
  async getTripStats() {
    const [total, scheduled, inTransit, completed, cancelled] = await Promise.all([
      prisma.trips.count(),
      prisma.trips.count({ where: { status: 'SCHEDULED' } }),
      prisma.trips.count({ where: { status: 'IN_TRANSIT' } }),
      prisma.trips.count({ where: { status: 'COMPLETED' } }),
      prisma.trips.count({ where: { status: 'CANCELLED' } }),
    ]);
    return { total, scheduled, inTransit, completed, cancelled, status: 'UNAVAILABLE' };
  }

  /**
   * Real booking statistics
   */
  async getBookingStats() {
    const [total, confirmed, pending, cancelled] = await Promise.all([
      prisma.bookings.count(),
      prisma.bookings.count({ where: { status: 'CONFIRMED' } }),
      prisma.bookings.count({ where: { status: 'PENDING' } }),
      prisma.bookings.count({ where: { status: 'CANCELLED' } }),
    ]);
    return { total, confirmed, pending, cancelled, status: 'UNAVAILABLE' };
  }

  /**
   * Real financial statistics
   */
  async getFinancialStats() {
    const aggregate = await prisma.payments.aggregate({
      where: { status: 'COMPLETED' },
      _sum: { amount: true },
      _count: { _all: true },
    });

    const totalRevenue = Number(aggregate._sum.amount || 0);
    const platformCommission = Number((totalRevenue * 0.035).toFixed(2));

    return {
      totalRevenue,
      platformCommission,
      completedTransactions: aggregate._count._all || 0,
      currency: 'ETB',
      status: 'UNAVAILABLE',
    };
  }
}

export const adminDashboardRepository = new AdminDashboardRepository();
export default adminDashboardRepository;
