import bookingService from '../../services/coordinator/booking.service.js';
import asyncHandler from '../../utils/asyncHandler.js';

export class BookingController {
  getBookings = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '20', 10);
    const { status, tripId, search } = req.query;

    const result = await bookingService.getBookings(req.organizationId, {
      page,
      limit,
      status,
      tripId,
      search,
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  });

  getBookingById = asyncHandler(async (req, res) => {
    const { bookingId } = req.params;
    const booking = await bookingService.getBookingById(bookingId, req.organizationId);
    res.status(200).json({
      success: true,
      data: { booking },
    });
  });
}

export const bookingController = new BookingController();
export default bookingController;
