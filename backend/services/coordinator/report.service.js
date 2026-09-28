import reportRepository from '../../repository/coordinator/report.repository.js';
import ApiError from '../../utils/apiError.js';

export class ReportService {
  async getOperationalStats(organizationId) {
    if (!organizationId) {
      throw new ApiError(400, 'Organization context is required.');
    }
    return reportRepository.getOperationalStats(organizationId);
  }
}

export const reportService = new ReportService();
export default reportService;
