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

  getTripFeedback = asyncHandler(async (req, res) => {
    const { tripId } = req.params;
    const feedback = await passengerFeedbackService.getTripFeedback(req.user.id, tripId);

    res.status(200).json({
      success: true,
      data: { feedback: feedback || null, isRated: Boolean(feedback) },
    });
  });
}

export const passengerFeedbackController = new PassengerFeedbackController();
export default passengerFeedbackController;
