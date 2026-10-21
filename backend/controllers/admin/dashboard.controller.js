import adminDashboardService from '../../services/admin/dashboard.service.js';
import asyncHandler from '../../utils/asyncHandler.js';

export class AdminDashboardController {
  getDashboard = asyncHandler(async (req, res) => {
    const { organizationId } = req.query;
    const summary = await adminDashboardService.getDashboardSummary({ organizationId });
    res.status(200).json({
      success: true,
      data: summary,
    });
  });
}

export const adminDashboardController = new AdminDashboardController();
export default adminDashboardController;
