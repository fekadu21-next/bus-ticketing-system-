import reportService from '../../services/coordinator/report.service.js';
import asyncHandler from '../../utils/asyncHandler.js';

export class ReportController {
  getOperationalStats = asyncHandler(async (req, res) => {
    const stats = await reportService.getOperationalStats(req.organizationId);
    res.status(200).json({
      success: true,
      data: { stats },
    });
  });
}

export const reportController = new ReportController();
export default reportController;
