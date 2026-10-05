import driverRepository from '../../repository/driver/driver.repository.js';
import userRepository from '../../repository/user.repository.js';
import ApiError from '../../utils/apiError.js';
import { logAuditEvent } from '../../utils/auditLogger.js';

export class DriverService {
  /**
   * Get driver profile details safely
   */
  async getDriverProfile(driverUser) {
    const user = await userRepository.findById(driverUser.id);
    if (!user) {
      throw new ApiError(404, 'Driver profile not found.');
    }

    const orgContext = driverUser.orgContexts?.[0] || {};

    return {
      id: user.id,
      firstName: user.first_name,
      lastName: user.last_name,
      name: `${user.first_name} ${user.last_name}`.trim(),
      email: user.email,
      phone: user.phone,
      avatarUrl: user.avatar_url,
      isActive: user.is_active,
      organizationId: orgContext.organizationId || null,
      organizationName: orgContext.organizationName || null,
      organizationType: orgContext.organizationType || null,
      roles: driverUser.roles || ['DRIVER'],
      createdAt: user.created_at,
    };
  }

  /**
   * Get list of trips assigned strictly to the authenticated driver
   */
  async getAssignedTrips(driverId, organizationId, query) {
    if (!organizationId) {
      throw new ApiError(400, 'Organization context is required.');
    }

    return driverRepository.findAssignedTrips({
      driverId,
      organizationId,
      page: query.page,
      limit: query.limit,
      status: query.status,
      date: query.date,
    });
  }

  /**
   * Get trip details for an assigned trip with strict ownership validation
   */
  async getAssignedTripDetails(tripId, driverId, organizationId) {
    if (!organizationId) {
      throw new ApiError(400, 'Organization context is required.');
    }

    const trip = await driverRepository.findAssignedTripById(tripId, driverId, organizationId);
    if (!trip) {
      // Check whether trip exists anywhere to distinguish 404 from forbidden without leaking
      const tripInOrg = await driverRepository.findTripByIdInOrg(tripId, organizationId);
      if (tripInOrg && tripInOrg.driver_id !== driverId) {
        throw new ApiError(403, 'Forbidden: You are not assigned to this trip.');
      }
      throw new ApiError(404, 'Trip not found or does not belong to your organization.');
    }

    return {
      id: trip.id,
      organizationId: trip.organization_id,
      operator: trip.organizations,
      status: trip.status,
      departureTime: trip.departure_time,
      arrivalTime: trip.arrival_time,
      fare: Number(trip.fare),
      bus: {
        id: trip.buses?.id,
        plateNumber: trip.buses?.plate_number,
        model: trip.buses?.model,
        capacity: trip.buses?.capacity,
      },
      route: {
        id: trip.routes?.id,
        origin: trip.routes?.origin,
        destination: trip.routes?.destination,
        distanceKm: trip.routes?.distance_km,
        estimatedDurationHours: trip.routes?.estimated_duration_hours,
      },
      totalSeats: trip.buses?.capacity || 0,
      totalBookings: trip._count?.bookings || 0,
      problemReports: trip.trip_problem_reports || [],
      createdAt: trip.created_at,
    };
  }

  /**
   * Driver starts assigned trip
   */
  async startTrip(tripId, driverId, organizationId, reqMeta = {}) {
    const trip = await driverRepository.findAssignedTripById(tripId, driverId, organizationId);
    if (!trip) {
      const tripInOrg = await driverRepository.findTripByIdInOrg(tripId, organizationId);
      if (tripInOrg && tripInOrg.driver_id !== driverId) {
        throw new ApiError(403, 'Forbidden: You cannot operate a trip not assigned to you.');
      }
      throw new ApiError(404, 'Trip not found or does not belong to your organization.');
    }

    // State machine check
    if (['IN_TRANSIT', 'IN_PROGRESS'].includes(trip.status)) {
      throw new ApiError(400, 'Trip is already in progress.');
    }
    if (trip.status === 'COMPLETED') {
      throw new ApiError(400, 'Cannot start an already completed trip.');
    }
    if (trip.status === 'CANCELLED') {
      throw new ApiError(400, 'Cannot start a cancelled trip.');
    }

    const updated = await driverRepository.startTrip(tripId, driverId, organizationId);

    await logAuditEvent({
      userId: driverId,
      action: 'DRIVER_STARTED_TRIP',
      details: { tripId, organizationId, status: 'IN_TRANSIT' },
      ipAddress: reqMeta.clientIp,
      userAgent: reqMeta.userAgent,
    });

    return updated;
  }

  /**
   * Driver completes assigned trip
   */
  async completeTrip(tripId, driverId, organizationId, reqMeta = {}) {
    const trip = await driverRepository.findAssignedTripById(tripId, driverId, organizationId);
    if (!trip) {
      const tripInOrg = await driverRepository.findTripByIdInOrg(tripId, organizationId);
      if (tripInOrg && tripInOrg.driver_id !== driverId) {
        throw new ApiError(403, 'Forbidden: You cannot complete a trip not assigned to you.');
      }
      throw new ApiError(404, 'Trip not found or does not belong to your organization.');
    }

    // State machine check
    if (trip.status === 'COMPLETED') {
      throw new ApiError(400, 'Trip is already completed.');
    }
    if (trip.status === 'CANCELLED') {
      throw new ApiError(400, 'Cannot complete a cancelled trip.');
    }
    if (['SCHEDULED', 'PUBLISHED', 'DRAFT'].includes(trip.status)) {
      throw new ApiError(400, 'Cannot complete a trip that has not been started yet.');
    }

    const updated = await driverRepository.completeTrip(tripId, driverId, organizationId);

    await logAuditEvent({
      userId: driverId,
      action: 'DRIVER_COMPLETED_TRIP',
      details: { tripId, organizationId, status: 'COMPLETED' },
      ipAddress: reqMeta.clientIp,
      userAgent: reqMeta.userAgent,
    });

    return updated;
  }

  /**
   * Driver reports an operational or vehicle problem for assigned trip
   */
  async reportProblem(tripId, driverId, organizationId, { type, description }, reqMeta = {}) {
    if (!description || description.trim().length === 0) {
      throw new ApiError(400, 'Problem description is required.');
    }

    const trip = await driverRepository.findAssignedTripById(tripId, driverId, organizationId);
    if (!trip) {
      const tripInOrg = await driverRepository.findTripByIdInOrg(tripId, organizationId);
      if (tripInOrg && tripInOrg.driver_id !== driverId) {
        throw new ApiError(403, 'Forbidden: You can report problems only for your assigned trips.');
      }
      throw new ApiError(404, 'Trip not found or does not belong to your organization.');
    }

    const report = await driverRepository.createProblemReport({
      tripId,
      driverId,
      organizationId,
      type,
      description: description.trim(),
    });

    await logAuditEvent({
      userId: driverId,
      action: 'DRIVER_REPORTED_PROBLEM',
      details: { reportId: report.id, tripId, type, organizationId },
      ipAddress: reqMeta.clientIp,
      userAgent: reqMeta.userAgent,
    });

    return report;
  }

  /**
   * Get problem reports for a specific trip
   */
  async getTripProblems(tripId, driverId, organizationId) {
    const trip = await driverRepository.findAssignedTripById(tripId, driverId, organizationId);
    if (!trip) {
      throw new ApiError(404, 'Trip not found or not assigned to you.');
    }
    return driverRepository.findTripProblemReports(tripId, organizationId);
  }

  /**
   * Get problem reports submitted by driver
   */
  async getDriverProblems(driverId, organizationId) {
    return driverRepository.findDriverProblemReports(driverId, organizationId);
  }

  /**
   * Get Driver dashboard summary
   */
  async getDriverDashboard(driverId, organizationId, driverUser) {
    const [profile, statsData] = await Promise.all([
      this.getDriverProfile(driverUser),
      driverRepository.getDriverDashboardStats(driverId, organizationId),
    ]);

    return {
      driver: profile,
      activeTrip: statsData.activeTrip || null,
      todayTrips: statsData.todayTrips || [],
      upcomingTrips: statsData.upcomingTrips || [],
      stats: statsData.stats,
    };
  }

  /**
   * Manager views organization problem reports
   */
  async getOrganizationProblems(organizationId, filters) {
    if (!organizationId) {
      throw new ApiError(400, 'Organization context is required.');
    }
    return driverRepository.findOrganizationProblemReports(organizationId, filters);
  }

  /**
   * Manager resolves a problem report
   */
  async resolveProblem(problemId, organizationId, managerUser, data, reqMeta = {}) {
    const report = await driverRepository.findProblemReportById(problemId, organizationId);
    if (!report) {
      throw new ApiError(404, 'Problem report not found in your organization.');
    }

    const updated = await driverRepository.resolveProblemReport(
      problemId,
      organizationId,
      managerUser?.id || null,
      data
    );

    await logAuditEvent({
      userId: managerUser?.id || null,
      action: 'PROBLEM_REPORT_RESOLVED',
      details: { problemId, organizationId, status: data.status || 'RESOLVED' },
      ipAddress: reqMeta.clientIp,
      userAgent: reqMeta.userAgent,
    });

    return updated;
  }
}

export const driverService = new DriverService();
export default driverService;
