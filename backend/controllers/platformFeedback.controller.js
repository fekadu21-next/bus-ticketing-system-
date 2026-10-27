import platformFeedbackService from '../services/platformFeedback.service.js';
import asyncHandler from '../utils/asyncHandler.js';

export class PlatformFeedbackController {
  submitFeedback = asyncHandler(async (req, res) => {
    const feedback = await platformFeedbackService.submitFeedback(req.user.id, req.body);
    res.status(201).json({
      success: true,
      message: 'Thank you for your feedback! It helps us improve the platform.',
      data: { feedback },
    });
  });

  getMyFeedbacks = asyncHandler(async (req, res) => {
    const feedbacks = await platformFeedbackService.getMyFeedbacks(req.user.id);
    res.status(200).json({
      success: true,
      data: { feedbacks },
    });
  });

  getAllFeedbacks = asyncHandler(async (req, res) => {
    const result = await platformFeedbackService.getAllFeedbacks(req.query);
    res.status(200).json({
      success: true,
      data: result,
    });
  });

  respondToFeedback = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updated = await platformFeedbackService.respondToFeedback(id, req.user.id, req.body);
    res.status(200).json({
      success: true,
      message: 'Feedback updated successfully.',
      data: { feedback: updated },
    });
  });
}

export const platformFeedbackController = new PlatformFeedbackController();
export default platformFeedbackController;
