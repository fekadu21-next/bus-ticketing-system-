import prisma from '../../Config/db.js';

export class DriverRepository {
  /**
   * Find trips assigned to a specific driver strictly scoped to their organization
   */
  async findAssignedTrips({ driverId, organizationId, page = 1, limit = 20, status = null, date = null }) {
    const skip = (page - 1) * limit;
    const where = {
      driver_id: driverId,
      organization_id: organizationId,
    };

    if (status) {
      if (status === 'IN_PROGRESS' || status === 'IN_TRANSIT') {
        where.status = { in: ['IN_TRANSIT', 'IN_PROGRESS'] };
      } else {
        where.status = status;
      }
    }

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      where.departure_time = { gte: startOfDay, lte: endOfDay };
    }

    const [total, trips] = await Promise.all([
      prisma.trips.count({ where }),
      prisma.trips.findMany({
        where,
        skip,
        take: limit,
        orderBy: { departure_time: 'asc' },
        include: {
          buses: {
            select: { id: true, plate_number: true, model: true, capacity: true },
          },
          routes: {
            select: { id: true, origin: true, destination: true, distance_km: true, estimated_duration_hours: true },
          },
          organizations: {
            select: { id: true, name: true, type: true },
          },
          _count: {
            select: {
              seats: true,
              bookings: true,
            },
          },
        },
      }),
    ]);

    return { total, page, limit, trips };
  }

  /**
   * Find single assigned trip by ID strictly checking driver and organization ownership
   */
  async findAssignedTripById(tripId, driverId, organizationId) {
    return prisma.trips.findFirst({
      where: {
        id: tripId,
        driver_id: driverId,
        organization_id: organizationId,
      },
      include: {
        buses: {
          select: { id: true, plate_number: true, model: true, capacity: true },
        },
        routes: {
          select: { id: true, origin: true, destination: true, distance_km: true, estimated_duration_hours: true },
        },
        organizations: {
          select: { id: true, name: true, type: true },
        },
        trip_problem_reports: {
          orderBy: { created_at: 'desc' },
        },
        _count: {
          select: {
            seats: true,
            bookings: true,
          },
        },
      },
    });
  }

  /**
   * Find trip by ID regardless of driver assignment but within organization (for authorization checks)
   */
  async findTripByIdInOrg(tripId, organizationId) {
    return prisma.trips.findFirst({
      where: {
        id: tripId,
        organization_id: organizationId,
      },
    });
  }

  /**
   * Start assigned trip (status -> IN_TRANSIT)
   */
  async startTrip(tripId, driverId, organizationId) {
    return prisma.trips.update({
      where: {
        id: tripId,
        driver_id: driverId,
        organization_id: organizationId,
      },
      data: {
        status: 'IN_TRANSIT',
        updated_at: new Date(),
      },
      include: {
        buses: true,
        routes: true,
      },
    });
  }

  /**
   * Complete assigned trip (status -> COMPLETED)
   */
  async completeTrip(tripId, driverId, organizationId) {
    return prisma.trips.update({
      where: {
        id: tripId,
        driver_id: driverId,
        organization_id: organizationId,
      },
      data: {
        status: 'COMPLETED',
        arrival_time: new Date(),
        updated_at: new Date(),
      },
      include: {
        buses: true,
        routes: true,
      },
    });
  }

  /**
   * Create problem report for assigned trip
   */
  async createProblemReport({ tripId, driverId, organizationId, type, description }) {
    return prisma.trip_problem_reports.create({
      data: {
        trip_id: tripId,
        driver_id: driverId,
        organization_id: organizationId,
        type,
        description,
        status: 'REPORTED',
      },
      include: {
        trips: {
          select: {
            id: true,
            status: true,
            departure_time: true,
            buses: { select: { plate_number: true, model: true } },
            routes: { select: { origin: true, destination: true } },
          },
        },
        driver: {
          select: { id: true, first_name: true, last_name: true, email: true, phone: true },
        },
      },
    });
  }

  /**
   * Get reports for a specific trip
   */
  async findTripProblemReports(tripId, organizationId) {
    return prisma.trip_problem_reports.findMany({
      where: {
        trip_id: tripId,
        organization_id: organizationId,
      },
      include: {
        driver: {
          select: { id: true, first_name: true, last_name: true, email: true, phone: true },
        },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  /**
   * Get reports submitted by a driver
   */
  async findDriverProblemReports(driverId, organizationId) {
    return prisma.trip_problem_reports.findMany({
      where: {
        driver_id: driverId,
        organization_id: organizationId,
      },
      include: {
        trips: {
          select: {
            id: true,
            status: true,
            departure_time: true,
            buses: { select: { plate_number: true, model: true } },
            routes: { select: { origin: true, destination: true } },
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  /**
   * Get organization problem reports (for Operational Manager)
   */
  async findOrganizationProblemReports(organizationId, { status, type, tripId, page = 1, limit = 20 } = {}) {
    const skip = (page - 1) * limit;
    const where = { organization_id: organizationId };

    if (status) where.status = status;
    if (type) where.type = type;
    if (tripId) where.trip_id = tripId;

    const [total, reports] = await Promise.all([
      prisma.trip_problem_reports.count({ where }),
      prisma.trip_problem_reports.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          trips: {
            select: {
              id: true,
              status: true,
              departure_time: true,
              buses: { select: { plate_number: true, model: true } },
              routes: { select: { origin: true, destination: true } },
            },
          },
          driver: {
            select: { id: true, first_name: true, last_name: true, email: true, phone: true },
          },
          resolver: {
            select: { id: true, first_name: true, last_name: true, email: true },
          },
        },
      }),
    ]);

    return { total, page, limit, reports };
  }

  /**
   * Resolve a problem report (by Manager)
   */
  async resolveProblemReport(problemId, organizationId, resolvedById, { status = 'RESOLVED', notes = null } = {}) {
    return prisma.trip_problem_reports.update({
      where: {
        id: problemId,
        organization_id: organizationId,
      },
      data: {
        status,
        resolved_at: new Date(),
        resolved_by: resolvedById,
        updated_at: new Date(),
      },
      include: {
        trips: true,
        driver: {
          select: { id: true, first_name: true, last_name: true, email: true },
        },
        resolver: {
          select: { id: true, first_name: true, last_name: true, email: true },
        },
      },
    });
  }

  /**
   * Find problem report by ID within organization
   */
  async findProblemReportById(problemId, organizationId) {
    return prisma.trip_problem_reports.findFirst({
      where: {
        id: problemId,
        organization_id: organizationId,
      },
    });
  }

  /**
   * Dashboard statistics for driver
   */
  async getDriverDashboardStats(driverId, organizationId) {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const [activeTrip, todayTrips, upcomingTrips, completedCount, totalAssigned] = await Promise.all([
      // Currently active trip
      prisma.trips.findFirst({
        where: {
          driver_id: driverId,
          organization_id: organizationId,
          status: { in: ['IN_TRANSIT', 'IN_PROGRESS'] },
        },
        include: {
          buses: { select: { plate_number: true, model: true, capacity: true } },
          routes: { select: { origin: true, destination: true, distance_km: true } },
        },
      }),
      // Today's trips
      prisma.trips.findMany({
        where: {
          driver_id: driverId,
          organization_id: organizationId,
          departure_time: { gte: startOfToday, lte: endOfToday },
        },
        orderBy: { departure_time: 'asc' },
        include: {
          buses: { select: { plate_number: true, model: true } },
          routes: { select: { origin: true, destination: true } },
        },
      }),
      // Upcoming trips
      prisma.trips.findMany({
        where: {
          driver_id: driverId,
          organization_id: organizationId,
          departure_time: { gt: endOfToday },
          status: { in: ['SCHEDULED', 'PUBLISHED'] },
        },
        take: 5,
        orderBy: { departure_time: 'asc' },
        include: {
          buses: { select: { plate_number: true, model: true } },
          routes: { select: { origin: true, destination: true } },
        },
      }),
      // Completed count
      prisma.trips.count({
        where: {
          driver_id: driverId,
          organization_id: organizationId,
          status: 'COMPLETED',
        },
      }),
      // Total assigned
      prisma.trips.count({
        where: {
          driver_id: driverId,
          organization_id: organizationId,
        },
      }),
    ]);

    return {
      activeTrip,
      todayTrips,
      upcomingTrips,
      stats: {
        completedTrips: completedCount,
        totalAssignedTrips: totalAssigned,
      },
    };
  }
}

export const driverRepository = new DriverRepository();
export default driverRepository;
