import passengerBookingRepository from '../../repository/passenger/booking.repository.js';
import ApiError from '../../utils/apiError.js';

export class PassengerBookingService {
  async createBooking(passengerId, bookingData) {
    if (!passengerId) {
      throw new ApiError(401, 'User authentication required.');
    }

    const { tripId, seatId, seatNumber } = bookingData;

    const booking = await passengerBookingRepository.createBookingAtomic({
      passengerId,
      tripId,
      seatId,
      seatNumber,
    });

    return {
      id: booking.id,
      tripId: booking.trip_id,
      seatId: booking.seat_id,
      seatNumber: booking.seat_number,
      totalFare: Number(booking.total_fare),
      status: booking.status,
      operator: booking.organizations,
      route: booking.trips?.routes,
      departureTime: booking.trips?.departure_time,
      bus: booking.trips?.buses,
      createdAt: booking.created_at,
    };
  }

  async getBookings(passengerId, query) {
    if (!passengerId) {
      throw new ApiError(401, 'User authentication required.');
    }

    return passengerBookingRepository.findPassengerBookings(passengerId, query);
  }

  async getBookingById(bookingId, passengerId) {
    if (!passengerId) {
      throw new ApiError(401, 'User authentication required.');
    }

    const booking = await passengerBookingRepository.findPassengerBookingById(bookingId, passengerId);

    if (!booking) {
      throw new ApiError(404, 'Booking not found.');
    }

    return booking;
  }
}

export const passengerBookingService = new PassengerBookingService();
export default passengerBookingService;
