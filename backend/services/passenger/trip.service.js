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

    const availableSeatsCount = trip.seats.filter((s) => s.status === 'AVAILABLE').length;
    const bookedSeatsCount = trip.seats.filter((s) => s.status === 'BOOKED').length;

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
      availableSeatsCount,
      bookedSeatsCount,
      seats: trip.seats.map((s) => ({
        id: s.id,
        seatNumber: s.seat_number,
        status: s.status,
      })),
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

    const seats = await passengerTripRepository.getTripSeats(tripId);
    const availableCount = seats.filter((s) => s.status === 'AVAILABLE').length;
    const bookedCount = seats.filter((s) => s.status === 'BOOKED').length;

    return {
      tripId: trip.id,
      bus: trip.buses,
      totalSeats: trip.buses?.capacity || seats.length,
      availableSeatsCount: availableCount,
      bookedSeatsCount: bookedCount,
      seats: seats.map((seat) => ({
        id: seat.id,
        seatNumber: seat.seat_number,
        status: seat.status,
      })),
    };
  }
}

export const passengerTripService = new PassengerTripService();
export default passengerTripService;
