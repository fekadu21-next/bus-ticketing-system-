import passengerBookingService from '../../services/passenger/booking.service.js';
import asyncHandler from '../../utils/asyncHandler.js';

export class PassengerBookingController {
  createBooking = asyncHandler(async (req, res) => {
    const booking = await passengerBookingService.createBooking(req.user.id, req.body);

    res.status(201).json({
      success: true,
      message: 'Booking created successfully. Please proceed to payment.',
      data: { booking },
    });
  });

  getBookings = asyncHandler(async (req, res) => {
    const result = await passengerBookingService.getBookings(req.user.id, req.query);

    res.status(200).json({
      success: true,
      data: result,
    });
  });

  getBookingById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const booking = await passengerBookingService.getBookingById(id, req.user.id);

    res.status(200).json({
      success: true,
      data: { booking },
    });
  });
}

export const passengerBookingController = new PassengerBookingController();
export default passengerBookingController;
