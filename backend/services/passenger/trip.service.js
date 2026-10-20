import passengerTripRepository from '../../repository/passenger/trip.repository.js';
import ApiError from '../../utils/apiError.js';

export class PassengerTripService {
  async searchTrips(filters) {
    return passengerTripRepository.searchTrips(filters);
  }

  async getTripDetails(tripId) {
    const trip = await passengerTripRepository.findTripById(tripId);

    if (!trip) {
      throw new ApiError(404, 'Trip not found.');
    }

    if (!['SCHEDULED', 'PUBLISHED'].includes(trip.status)) {
      throw new ApiError(400, 'Trip is not available for booking.');
    }

    if (trip.departure_time < new Date()) {
      throw new ApiError(400, 'This trip has already departed.');
    }

    if (!trip.organizations?.is_active || trip.organizations?.status === 'REJECTED' || trip.organizations?.status === 'SUSPENDED') {
      throw new ApiError(400, 'Trip operator is currently inactive.');
    }

    const activeBookedSeatNums = new Set(
      (trip.bookings || []).map((b) => b.seat_number)
    );

    const mappedSeats = (trip.seats || []).map((s) => {
      let status = s.status;
      if (activeBookedSeatNums.has(s.seat_number) && status === 'AVAILABLE') {
        status = 'BOOKED';
      }
      return {
        id: s.id,
        seatNumber: s.seat_number,
        status,
      };
    });

    const availableSeatsCount = mappedSeats.filter((s) => s.status === 'AVAILABLE').length;
    const bookedSeatsCount = mappedSeats.filter((s) => s.status === 'BOOKED').length;
    const heldSeatsCount = mappedSeats.filter((s) => s.status === 'HELD' || s.status === 'LOCKED').length;
    const blockedSeatsCount = mappedSeats.filter((s) => s.status === 'BLOCKED').length;

    return {
      id: trip.id,
      operator: {
        id: trip.organizations.id,
        name: trip.organizations.name,
        type: trip.organizations.type,
      },
      route: trip.routes,
      origin: trip.routes?.origin,
      destination: trip.routes?.destination,
      departureDate: trip.departure_time.toISOString().split('T')[0],
      departureTime: trip.departure_time,
      arrivalTime: trip.arrival_time,
      bus: trip.buses,
      fare: Number(trip.fare),
      price: Number(trip.fare),
      status: trip.status,
      totalSeats: trip.buses?.capacity || trip.seats.length,
      availableSeats: availableSeatsCount,
      availableSeatsCount,
      bookedSeatsCount,
      heldSeatsCount,
      blockedSeatsCount,
      seats: mappedSeats,
    };
  }

  async getTripSeats(tripId) {
    const trip = await passengerTripRepository.findTripById(tripId);

    if (!trip) {
      throw new ApiError(404, 'Trip not found.');
    }

    if (!['SCHEDULED', 'PUBLISHED'].includes(trip.status)) {
      throw new ApiError(400, 'Trip is not available for booking.');
    }

    const activeBookedSeatNums = new Set(
      (trip.bookings || []).map((b) => b.seat_number)
    );

    const seats = await passengerTripRepository.getTripSeats(tripId);
    const mappedSeats = (seats || []).map((seat) => {
      let status = seat.status;
      if (activeBookedSeatNums.has(seat.seat_number) && status === 'AVAILABLE') {
        status = 'BOOKED';
      }
      return {
        id: seat.id,
        seatNumber: seat.seat_number,
        status,
      };
    });

    const availableCount = mappedSeats.filter((s) => s.status === 'AVAILABLE').length;
    const bookedCount = mappedSeats.filter((s) => s.status === 'BOOKED').length;
    const heldCount = mappedSeats.filter((s) => s.status === 'HELD' || s.status === 'LOCKED').length;
    const blockedCount = mappedSeats.filter((s) => s.status === 'BLOCKED').length;

    return {
      tripId: trip.id,
      bus: trip.buses,
      totalSeats: trip.buses?.capacity || mappedSeats.length,
      availableSeats: availableCount,
      availableSeatsCount: availableCount,
      bookedSeatsCount: bookedCount,
      heldSeatsCount: heldCount,
      blockedSeatsCount: blockedCount,
      seats: mappedSeats,
    };
  }
}

export const passengerTripService = new PassengerTripService();
export default passengerTripService;
