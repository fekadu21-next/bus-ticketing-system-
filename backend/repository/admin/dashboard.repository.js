import prisma from '../../Config/db.js';
import { ORGANIZATION_STATUS } from '../../constants/organization.js';

/** Returns true only for strings that look like a real UUID */
const isValidUUID = (val) =>
  typeof val === 'string' &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

export class AdminDashboardRepository {
  /**
   * Aggregate real organization counts by lifecycle status
   */
  async getOrganizationStats({ organizationId = null } = {}) {
    const where = isValidUUID(organizationId) ? { id: organizationId } : {};
    const [total, pending, approved, rejected, suspended] = await Promise.all([
      prisma.organizations.count({ where }),
      prisma.organizations.count({ where: { ...where, status: ORGANIZATION_STATUS.PENDING } }),
      prisma.organizations.count({ where: { ...where, status: ORGANIZATION_STATUS.APPROVED } }),
      prisma.organizations.count({ where: { ...where, status: ORGANIZATION_STATUS.REJECTED } }),
      prisma.organizations.count({ where: { ...where, status: ORGANIZATION_STATUS.SUSPENDED } }),
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
  async getUserStats({ organizationId = null } = {}) {
    const where = isValidUUID(organizationId)
      ? { user_roles: { some: { organization_id: organizationId } } }
      : {};
    const [total, active, emailVerified] = await Promise.all([
      prisma.users.count({ where }),
      prisma.users.count({ where: { ...where, is_active: true } }),
      prisma.users.count({ where: { ...where, email_verified: true } }),
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
  async getFleetStats({ organizationId = null } = {}) {
    const where = isValidUUID(organizationId) ? { organization_id: organizationId } : {};
    const [total, active] = await Promise.all([
      prisma.buses.count({ where }),
      prisma.buses.count({ where: { ...where, is_active: true } }),
    ]);
    return { total, active, maintenance: total - active, status: 'UNAVAILABLE' };
  }

  /**
   * Real trip statistics
   */
  async getTripStats({ organizationId = null } = {}) {
    const where = isValidUUID(organizationId) ? { organization_id: organizationId } : {};
    const now = new Date();
    const [total, scheduled, inTransit, completed, cancelled, upcoming, draft] = await Promise.all([
      prisma.trips.count({ where }),
      prisma.trips.count({ where: { ...where, status: 'SCHEDULED' } }),
      prisma.trips.count({ where: { ...where, status: 'IN_TRANSIT' } }),
      prisma.trips.count({ where: { ...where, status: 'COMPLETED' } }),
      prisma.trips.count({ where: { ...where, status: 'CANCELLED' } }),
      prisma.trips.count({
        where: {
          ...where,
          departure_time: { gte: now },
          status: { notIn: ['COMPLETED', 'CANCELLED'] },
        },
      }),
      prisma.trips.count({ where: { ...where, status: 'DRAFT' } }),
    ]);
    return { total, scheduled, inTransit, completed, cancelled, upcoming, draft, status: 'UNAVAILABLE' };
  }

  /**
   * Real booking statistics
   */
  async getBookingStats({ organizationId = null } = {}) {
    const where = isValidUUID(organizationId) ? { organization_id: organizationId } : {};
    const [total, confirmed, pending, cancelled] = await Promise.all([
      prisma.bookings.count({ where }),
      prisma.bookings.count({ where: { ...where, status: 'CONFIRMED' } }),
      prisma.bookings.count({ where: { ...where, status: 'PENDING' } }),
      prisma.bookings.count({ where: { ...where, status: 'CANCELLED' } }),
    ]);
    return { total, confirmed, pending, cancelled, status: 'UNAVAILABLE' };
  }

  /**
   * Real financial statistics
   */
  async getFinancialStats({ organizationId = null } = {}) {
    const where = isValidUUID(organizationId) ? { organization_id: organizationId } : {};
    const [aggregate, pendingTransactions] = await Promise.all([
      prisma.payments.aggregate({
        where: { ...where, status: 'COMPLETED' },
        _sum: { amount: true },
        _count: { _all: true },
      }),
      prisma.payments.count({ where: { ...where, status: 'PENDING' } }),
    ]);

    const totalRevenue = Number(aggregate._sum.amount || 0);
    const platformCommission = Number((totalRevenue * 0.05).toFixed(2));

    return {
      totalRevenue,
      platformCommission,
      completedTransactions: aggregate._count._all || 0,
      pendingTransactions,
      currency: 'ETB',
      status: 'UNAVAILABLE',
    };
  }
}

export const adminDashboardRepository = new AdminDashboardRepository();
export default adminDashboardRepository;
