import coordinatorFeedbackService from '../../services/coordinator/feedback.service.js';
import asyncHandler from '../../utils/asyncHandler.js';

export class CoordinatorFeedbackController {
  getOrganizationFeedbacks = asyncHandler(async (req, res) => {
    const orgId = req.organizationId;
    const result = await coordinatorFeedbackService.getOrganizationFeedbacks(orgId, req.query);
    res.status(200).json({
      success: true,
      data: result,
    });
  });
}

export const coordinatorFeedbackController = new CoordinatorFeedbackController();
export default coordinatorFeedbackController;
