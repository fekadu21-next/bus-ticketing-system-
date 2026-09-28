import prisma from '../../Config/db.js';
import { ORGANIZATION_STATUS } from '../../constants/organization.js';

export class AdminDashboardRepository {
  /**
   * Aggregate real organization counts by lifecycle status
   */
  async getOrganizationStats() {
    const [total, pending, approved, rejected, suspended] = await Promise.all([
      prisma.organizations.count(),
      prisma.organizations.count({ where: { status: ORGANIZATION_STATUS.PENDING } }),
      prisma.organizations.count({ where: { status: ORGANIZATION_STATUS.APPROVED } }),
      prisma.organizations.count({ where: { status: ORGANIZATION_STATUS.REJECTED } }),
      prisma.organizations.count({ where: { status: ORGANIZATION_STATUS.SUSPENDED } }),
    ]);

    return {
      total,
      pending,
      approved,
      rejected,
      suspended,
    };
  }

  /**
   * Aggregate real user platform statistics supported by existing schema
   */
  async getUserStats() {
    const [total, active, emailVerified] = await Promise.all([
      prisma.users.count(),
      prisma.users.count({ where: { is_active: true } }),
      prisma.users.count({ where: { email_verified: true } }),
    ]);

    return {
      total,
      active,
      emailVerified,
    };
  }
}

export const adminDashboardRepository = new AdminDashboardRepository();
export default adminDashboardRepository;
