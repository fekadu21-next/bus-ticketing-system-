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
}

export const adminOverviewService = new AdminOverviewService();
export default adminOverviewService;
