import driverService from '../../services/driver/driver.service.js';
import asyncHandler from '../../utils/asyncHandler.js';

export class DriverController {
  /**
   * Helper to resolve driver organization ID from request context
   */
  #resolveOrgId(req) {
    return req.organizationId || req.user.orgContexts?.[0]?.organizationId || null;
  }

  getProfile = asyncHandler(async (req, res) => {
    const profile = await driverService.getDriverProfile(req.user);
    res.status(200).json({
      success: true,
      data: { driver: profile, user: profile },
    });
  });

  getAssignedTrips = asyncHandler(async (req, res) => {
    const orgId = this.#resolveOrgId(req);
    const result = await driverService.getAssignedTrips(req.user.id, orgId, req.query);
    res.status(200).json({
      success: true,
      data: result,
    });
  });

  getTripDetails = asyncHandler(async (req, res) => {
    const orgId = this.#resolveOrgId(req);
    const { tripId } = req.params;
    const trip = await driverService.getAssignedTripDetails(tripId, req.user.id, orgId);
    res.status(200).json({
      success: true,
      data: { trip },
    });
  });

  startTrip = asyncHandler(async (req, res) => {
    const orgId = this.#resolveOrgId(req);
    const { tripId } = req.params;
    const trip = await driverService.startTrip(tripId, req.user.id, orgId, {
      clientIp: req.ip,
      userAgent: req.get('user-agent'),
    });
    res.status(200).json({
      success: true,
      message: 'Trip started successfully. Status changed to IN_TRANSIT.',
      data: { trip },
    });
  });

  completeTrip = asyncHandler(async (req, res) => {
    const orgId = this.#resolveOrgId(req);
    const { tripId } = req.params;
    const trip = await driverService.completeTrip(tripId, req.user.id, orgId, {
      clientIp: req.ip,
      userAgent: req.get('user-agent'),
    });
    res.status(200).json({
      success: true,
      message: 'Trip completed successfully.',
      data: { trip },
    });
  });

  reportProblem = asyncHandler(async (req, res) => {
    const orgId = this.#resolveOrgId(req);
    const { tripId } = req.params;
    const { type, description } = req.body;
    const report = await driverService.reportProblem(tripId, req.user.id, orgId, { type, description }, {
      clientIp: req.ip,
      userAgent: req.get('user-agent'),
    });
    res.status(201).json({
      success: true,
      message: 'Problem report submitted successfully to operations manager.',
      data: { report },
    });
  });

  getTripProblems = asyncHandler(async (req, res) => {
    const orgId = this.#resolveOrgId(req);
    const { tripId } = req.params;
    const reports = await driverService.getTripProblems(tripId, req.user.id, orgId);
    res.status(200).json({
      success: true,
      data: { reports },
    });
  });

  getDriverProblems = asyncHandler(async (req, res) => {
    const orgId = this.#resolveOrgId(req);
    const reports = await driverService.getDriverProblems(req.user.id, orgId);
    res.status(200).json({
      success: true,
      data: { reports },
    });
  });

  getDashboard = asyncHandler(async (req, res) => {
    const orgId = this.#resolveOrgId(req);
    const dashboard = await driverService.getDriverDashboard(req.user.id, orgId, req.user);
    res.status(200).json({
      success: true,
      data: dashboard,
    });
  });

  // Manager Operations
  getOrganizationProblems = asyncHandler(async (req, res) => {
    const orgId = req.organizationId;
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '20', 10);
    const { status, type, tripId } = req.query;

    const result = await driverService.getOrganizationProblems(orgId, {
      status,
      type,
      tripId,
      page,
      limit,
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  });

  resolveProblem = asyncHandler(async (req, res) => {
    const orgId = req.organizationId;
    const { problemId } = req.params;
    const updated = await driverService.resolveProblem(problemId, orgId, req.user, req.body, {
      clientIp: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(200).json({
      success: true,
      message: 'Problem report resolved successfully.',
      data: { report: updated },
    });
  });
}

export const driverController = new DriverController();
export default driverController;
