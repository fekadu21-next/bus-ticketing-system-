import adminDashboardRepository from '../../repository/admin/dashboard.repository.js';

export class AdminDashboardService {
  /**
   * Return platform-level summary statistics using real database aggregations.
   * Modules without DB tables/features are reported as unavailable.
   */
  async getDashboardSummary() {
    const [organizations, users] = await Promise.all([
      adminDashboardRepository.getOrganizationStats(),
      adminDashboardRepository.getUserStats(),
    ]);

    return {
      organizations,
      users,
      trips: {
        status: 'UNAVAILABLE',
        message: 'Trip scheduling module not yet implemented in database schema',
      },
      fleet: {
        status: 'UNAVAILABLE',
        message: 'Fleet/bus tracking module not yet implemented in database schema',
      },
      bookings: {
        status: 'UNAVAILABLE',
        message: 'Booking and ticketing module not yet implemented in database schema',
      },
      financials: {
        status: 'UNAVAILABLE',
        message: 'Revenue and payment gateway not yet implemented in database schema',
      },
    };
  }
}

export const adminDashboardService = new AdminDashboardService();
export default adminDashboardService;
