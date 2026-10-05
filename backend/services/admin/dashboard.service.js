import adminDashboardRepository from '../../repository/admin/dashboard.repository.js';

export class AdminDashboardService {
  /**
   * Return platform-level summary statistics using real database aggregations.
   */
  async getDashboardSummary() {
    const [organizations, users, fleet, trips, bookings, financials] = await Promise.all([
      adminDashboardRepository.getOrganizationStats(),
      adminDashboardRepository.getUserStats(),
      adminDashboardRepository.getFleetStats(),
      adminDashboardRepository.getTripStats(),
      adminDashboardRepository.getBookingStats(),
      adminDashboardRepository.getFinancialStats(),
    ]);

    return {
      organizations,
      users,
      fleet,
      trips,
      bookings,
      financials,
    };
  }
}

export const adminDashboardService = new AdminDashboardService();
export default adminDashboardService;
