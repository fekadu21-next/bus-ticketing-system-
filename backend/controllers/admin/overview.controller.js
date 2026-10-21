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
    const upcoming = req.query.upcoming === 'true';

    const result = await adminOverviewService.getAllTrips({ page, limit, organizationId, search, status, upcoming });
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

  updateBusStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status, isActive } = req.body;
    const result = await adminOverviewService.updateBusStatus(id, { status, isActive });
    res.status(200).json({ success: true, message: 'Bus status updated', data: result });
  });

  updateRouteStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status, isActive } = req.body;
    const result = await adminOverviewService.updateRouteStatus(id, { status, isActive });
    res.status(200).json({ success: true, message: 'Route status updated', data: result });
  });

  updateTripStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const result = await adminOverviewService.updateTripStatus(id, { status });
    res.status(200).json({ success: true, message: 'Trip status updated', data: result });
  });

  updateBookingStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status, paymentStatus } = req.body;
    const result = await adminOverviewService.updateBookingStatus(id, { status, paymentStatus });
    res.status(200).json({ success: true, message: 'Booking status updated', data: result });
  });

  updatePaymentStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const result = await adminOverviewService.updatePaymentStatus(id, { status });
    res.status(200).json({ success: true, message: 'Payment status updated', data: result });
  });

  updateTicketStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const result = await adminOverviewService.updateTicketStatus(id, { status });
    res.status(200).json({ success: true, message: 'Ticket status updated', data: result });
  });

  updateAuditLog = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await adminOverviewService.updateAuditLog(id, req.body);
    res.status(200).json({ success: true, message: 'Audit log updated', data: result });
  });
}

export const adminOverviewController = new AdminOverviewController();
export default adminOverviewController;
