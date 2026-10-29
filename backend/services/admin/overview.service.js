import adminOverviewRepository from '../../repository/admin/overview.repository.js';

export class AdminOverviewService {
  async getAllBuses(params) {
    return adminOverviewRepository.getAllBuses(params);
  }

  async getAllRoutes(params) {
    return adminOverviewRepository.getAllRoutes(params);
  }

  async getAllTrips(params) {
    return adminOverviewRepository.getAllTrips(params);
  }

  async getAllBookings(params) {
    return adminOverviewRepository.getAllBookings(params);
  }

  async getAllPayments(params) {
    return adminOverviewRepository.getAllPayments(params);
  }

  async getAuditLogs(params) {
    return adminOverviewRepository.getAuditLogs(params);
  }

  async getPlatformReports() {
    return adminOverviewRepository.getPlatformReports();
  }

  async getStations() {
    return adminOverviewRepository.getStations();
  }

  async updateBusStatus(id, data) {
    return adminOverviewRepository.updateBusStatus(id, data);
  }

  async updateRouteStatus(id, data) {
    return adminOverviewRepository.updateRouteStatus(id, data);
  }

  async updateTripStatus(id, data) {
    return adminOverviewRepository.updateTripStatus(id, data);
  }

  async updateBookingStatus(id, data) {
    return adminOverviewRepository.updateBookingStatus(id, data);
  }

  async updatePaymentStatus(id, data) {
    return adminOverviewRepository.updatePaymentStatus(id, data);
  }

  async updateTicketStatus(id, data) {
    return adminOverviewRepository.updateTicketStatus(id, data);
  }

  async updateAuditLog(id, data) {
    return adminOverviewRepository.updateAuditLog(id, data);
  }
}

export const adminOverviewService = new AdminOverviewService();
export default adminOverviewService;
