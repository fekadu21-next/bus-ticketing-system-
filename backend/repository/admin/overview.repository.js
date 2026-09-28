import prisma from '../../Config/db.js';

export class AdminOverviewRepository {
  /**
   * Get all buses platform-wide with organization metadata
   */
  async getAllBuses({ page = 1, limit = 50, organizationId = null, search = '', isActive = null } = {}) {
    const skip = (page - 1) * limit;
    const where = {};

    if (organizationId) where.organization_id = organizationId;
    if (isActive !== null) where.is_active = isActive;
    if (search) {
      where.OR = [
        { plate_number: { contains: search, mode: 'insensitive' } },
        { model: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, buses] = await Promise.all([
      prisma.buses.count({ where }),
      prisma.buses.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          organizations: {
            select: { id: true, name: true, type: true },
          },
        },
      }),
    ]);

    return { total, page, limit, buses };
  }

  /**
   * Get all routes platform-wide
   */
  async getAllRoutes({ page = 1, limit = 50, organizationId = null, search = '' } = {}) {
    const skip = (page - 1) * limit;
    const where = {};

    if (organizationId) where.organization_id = organizationId;
    if (search) {
      where.OR = [
        { origin: { contains: search, mode: 'insensitive' } },
        { destination: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, routes] = await Promise.all([
      prisma.routes.count({ where }),
      prisma.routes.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          organizations: {
            select: { id: true, name: true },
          },
        },
      }),
    ]);

    return { total, page, limit, routes };
  }

  /**
   * Get all trips platform-wide
   */
  async getAllTrips({ page = 1, limit = 50, organizationId = null, search = '', status = null } = {}) {
    const skip = (page - 1) * limit;
    const where = {};

    if (organizationId) where.organization_id = organizationId;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { routes: { origin: { contains: search, mode: 'insensitive' } } },
        { routes: { destination: { contains: search, mode: 'insensitive' } } },
        { buses: { plate_number: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [total, trips] = await Promise.all([
      prisma.trips.count({ where }),
      prisma.trips.findMany({
        where,
        skip,
        take: limit,
        orderBy: { departure_time: 'desc' },
        include: {
          organizations: { select: { id: true, name: true } },
          buses: { select: { id: true, plate_number: true, model: true, capacity: true } },
          routes: { select: { id: true, origin: true, destination: true, distance_km: true } },
          _count: { select: { seats: true, bookings: true } },
        },
      }),
    ]);

    return { total, page, limit, trips };
  }

  /**
   * Get all bookings platform-wide
   */
  async getAllBookings({ page = 1, limit = 50, organizationId = null, search = '', status = null } = {}) {
    const skip = (page - 1) * limit;
    const where = {};

    if (organizationId) where.organization_id = organizationId;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { users: { first_name: { contains: search, mode: 'insensitive' } } },
        { users: { last_name: { contains: search, mode: 'insensitive' } } },
        { users: { email: { contains: search, mode: 'insensitive' } } },
        { users: { phone: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [total, bookings] = await Promise.all([
      prisma.bookings.count({ where }),
      prisma.bookings.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          organizations: { select: { id: true, name: true } },
          users: { select: { id: true, first_name: true, last_name: true, email: true, phone: true } },
          trips: {
            include: {
              routes: { select: { origin: true, destination: true } },
              buses: { select: { plate_number: true } },
            },
          },
          seats: { select: { seat_number: true } },
          payments: { select: { id: true, amount: true, currency: true, payment_method: true, status: true, transaction_reference: true } },
        },
      }),
    ]);

    return { total, page, limit, bookings };
  }

  /**
   * Get all payments platform-wide
   */
  async getAllPayments({ page = 1, limit = 50, organizationId = null, status = null } = {}) {
    const skip = (page - 1) * limit;
    const where = {};

    if (organizationId) where.organization_id = organizationId;
    if (status) where.status = status;

    const [total, payments] = await Promise.all([
      prisma.payments.count({ where }),
      prisma.payments.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          organizations: { select: { id: true, name: true } },
          bookings: {
            include: {
              users: { select: { id: true, first_name: true, last_name: true, email: true, phone: true } },
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

  /**
   * Get all audit logs platform-wide
   */
  async getAuditLogs({ page = 1, limit = 50, search = '' } = {}) {
    const skip = (page - 1) * limit;
    const where = {};

    if (search) {
      where.OR = [
        { action: { contains: search, mode: 'insensitive' } },
        { ip_address: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, logs] = await Promise.all([
      prisma.audit_logs.count({ where }),
      prisma.audit_logs.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          users: { select: { id: true, first_name: true, last_name: true, email: true } },
        },
      }),
    ]);

    return { total, page, limit, logs };
  }

  /**
   * Platform-wide aggregated reports
   */
  async getPlatformReports() {
    const [
      totalOrgs,
      activeOrgs,
      totalBuses,
      activeBuses,
      totalRoutes,
      totalTrips,
      tripStatusCounts,
      totalBookings,
      bookingStatusCounts,
      paymentAggregate,
    ] = await Promise.all([
      prisma.organizations.count(),
      prisma.organizations.count({ where: { status: 'APPROVED' } }),
      prisma.buses.count(),
      prisma.buses.count({ where: { is_active: true } }),
      prisma.routes.count(),
      prisma.trips.count(),
      prisma.trips.groupBy({ by: ['status'], _count: { _all: true } }),
      prisma.bookings.count(),
      prisma.bookings.groupBy({ by: ['status'], _count: { _all: true } }),
      prisma.payments.aggregate({
        where: { status: 'COMPLETED' },
        _sum: { amount: true },
        _count: { _all: true },
      }),
    ]);

    const totalRevenue = Number(paymentAggregate._sum.amount || 0);
    const platformCommission = Number((totalRevenue * 0.035).toFixed(2));

    return {
      organizations: { total: totalOrgs, active: activeOrgs },
      fleet: { total: totalBuses, active: activeBuses },
      routes: { total: totalRoutes },
      trips: { total: totalTrips, byStatus: tripStatusCounts },
      bookings: { total: totalBookings, byStatus: bookingStatusCounts },
      financials: {
        totalRevenue,
        platformCommission,
        completedTransactions: paymentAggregate._count._all || 0,
        currency: 'ETB',
      },
    };
  }

  /**
   * Aggregate active physical terminals / stations from operational routes
   */
  async getStations() {
    const routes = await prisma.routes.findMany({
      where: { is_active: true },
      select: { origin: true, destination: true },
    });

    const stationMap = new Map();
    routes.forEach((r) => {
      [r.origin, r.destination].forEach((name) => {
        if (!name) return;
        const count = stationMap.get(name) || 0;
        stationMap.set(name, count + 1);
      });
    });

    const stations = Array.from(stationMap.entries()).map(([name, activeRoutesCount], idx) => ({
      id: `stn-${idx + 1}`,
      name: `${name} Intercity Terminal`,
      city: name,
      code: `${name.substring(0, 3).toUpperCase()}-01`,
      address: `Central Bus Station, ${name}, Ethiopia`,
      activeRoutesCount,
      status: 'ACTIVE',
      createdAt: '2024-01-01',
    }));

    return { total: stations.length, stations };
  }
}

export const adminOverviewRepository = new AdminOverviewRepository();
export default adminOverviewRepository;
