import adminDashboardService from '../../services/admin/dashboard.service.js';
import asyncHandler from '../../utils/asyncHandler.js';

export class AdminDashboardController {
  getDashboard = asyncHandler(async (req, res) => {
    const summary = await adminDashboardService.getDashboardSummary();
    res.status(200).json({
      success: true,
      data: summary,
    });
  });
}

export const adminDashboardController = new AdminDashboardController();
export default adminDashboardController;
