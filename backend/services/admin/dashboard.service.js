import adminDashboardRepository from '../../repository/admin/dashboard.repository.js';

export class AdminDashboardService {
  /**
   * Return platform-level summary statistics using real database aggregations.
   */
  async getDashboardSummary({ organizationId = null } = {}) {
    const [organizations, users, fleet, trips, bookings, financials] = await Promise.all([
      adminDashboardRepository.getOrganizationStats({ organizationId }),
      adminDashboardRepository.getUserStats({ organizationId }),
      adminDashboardRepository.getFleetStats({ organizationId }),
      adminDashboardRepository.getTripStats({ organizationId }),
      adminDashboardRepository.getBookingStats({ organizationId }),
      adminDashboardRepository.getFinancialStats({ organizationId }),
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
