import passengerFeedbackRepository from '../../repository/passenger/feedback.repository.js';
import ApiError from '../../utils/apiError.js';

export class PassengerFeedbackService {
  async submitFeedback(passengerId, { tripId, rating, comment }) {
    if (!passengerId) {
      throw new ApiError(401, 'User authentication required.');
    }

    // 1. Verify passenger has a valid confirmed/completed booking for this trip
    const booking = await passengerFeedbackRepository.findCompletedBookingForTrip(tripId, passengerId);
    if (!booking) {
      throw new ApiError(403, 'You cannot submit feedback for a trip you did not book or complete.');
    }

    // 2. Verify trip has departed or completed
    const trip = booking.trips;
    const now = new Date();
    const hasDepartedOrCompleted = trip.status === 'COMPLETED' || trip.departure_time <= now;

    if (!hasDepartedOrCompleted) {
      throw new ApiError(400, 'Feedback can only be submitted after the trip has departed or completed.');
    }

    // 3. Check for duplicate feedback
    const existing = await passengerFeedbackRepository.findExistingFeedback(tripId, passengerId);
    if (existing) {
      throw new ApiError(409, 'You have already submitted feedback for this trip.');
    }

    // 4. Create feedback
    const feedback = await passengerFeedbackRepository.createFeedback({
      tripId,
      passengerId,
      bookingId: booking.id,
      organizationId: trip.organization_id,
      rating,
      comment,
    });

    return {
      id: feedback.id,
      tripId: feedback.trip_id,
      rating: feedback.rating,
      comment: feedback.comment,
      createdAt: feedback.created_at,
    };
  }

  async getMyFeedbacks(passengerId) {
    if (!passengerId) {
      throw new ApiError(401, 'User authentication required.');
    }

    return passengerFeedbackRepository.findPassengerFeedbacks(passengerId);
  }
}

export const passengerFeedbackService = new PassengerFeedbackService();
export default passengerFeedbackService;
