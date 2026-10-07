import passengerFeedbackService from '../../services/passenger/feedback.service.js';
import asyncHandler from '../../utils/asyncHandler.js';

export class PassengerFeedbackController {
  submitFeedback = asyncHandler(async (req, res) => {
    const feedback = await passengerFeedbackService.submitFeedback(req.user.id, req.body);

    res.status(201).json({
      success: true,
      message: 'Thank you for your feedback! It helps us improve our service.',
      data: { feedback },
    });
  });

  getMyFeedbacks = asyncHandler(async (req, res) => {
    const feedbacks = await passengerFeedbackService.getMyFeedbacks(req.user.id);

    res.status(200).json({
      success: true,
      data: { feedbacks },
    });
  });
}

export const passengerFeedbackController = new PassengerFeedbackController();
export default passengerFeedbackController;
