import adminOverviewService from '../../services/admin/overview.service.js';
import asyncHandler from '../../utils/asyncHandler.js';

export class AdminOverviewController {
  getBuses = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '50', 10);
    const { organizationId, search } = req.query;
    const isActive = req.query.isActive !== undefined ? req.query.isActive === 'true' : null;

    const result = await adminOverviewService.getAllBuses({ page, limit, organizationId, search, isActive });
    res.status(200).json({ success: true, data: result });
  });

  getRoutes = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '50', 10);
    const { organizationId, search } = req.query;

    const result = await adminOverviewService.getAllRoutes({ page, limit, organizationId, search });
    res.status(200).json({ success: true, data: result });
  });

  getTrips = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '50', 10);
    const { organizationId, search, status } = req.query;

    const result = await adminOverviewService.getAllTrips({ page, limit, organizationId, search, status });
    res.status(200).json({ success: true, data: result });
  });

  getBookings = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '50', 10);
    const { organizationId, search, status } = req.query;

    const result = await adminOverviewService.getAllBookings({ page, limit, organizationId, search, status });
    res.status(200).json({ success: true, data: result });
  });

  getPayments = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '50', 10);
    const { organizationId, status } = req.query;

    const result = await adminOverviewService.getAllPayments({ page, limit, organizationId, status });
    res.status(200).json({ success: true, data: result });
  });

  getAuditLogs = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '50', 10);
    const { search } = req.query;

    const result = await adminOverviewService.getAuditLogs({ page, limit, search });
    res.status(200).json({ success: true, data: result });
  });

  getPlatformReports = asyncHandler(async (req, res) => {
    const result = await adminOverviewService.getPlatformReports();
    res.status(200).json({ success: true, data: result });
  });

  getStations = asyncHandler(async (req, res) => {
    const result = await adminOverviewService.getStations();
    res.status(200).json({ success: true, data: result });
  });
}

export const adminOverviewController = new AdminOverviewController();
export default adminOverviewController;
