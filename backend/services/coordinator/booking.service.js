import bookingRepository from '../../repository/coordinator/booking.repository.js';
import ApiError from '../../utils/apiError.js';

export class BookingService {
  async getBookings(organizationId, query) {
    if (!organizationId) {
      throw new ApiError(400, 'Organization context is required.');
    }
    return bookingRepository.findAll(organizationId, query);
  }

  async getBookingById(bookingId, organizationId) {
    if (!organizationId) {
      throw new ApiError(400, 'Organization context is required.');
    }

    const booking = await bookingRepository.findById(bookingId, organizationId);
    if (!booking) {
      throw new ApiError(404, 'Booking not found or does not belong to your organization.');
    }

    return booking;
  }
}

export const bookingService = new BookingService();
export default bookingService;
