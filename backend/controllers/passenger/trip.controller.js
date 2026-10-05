import passengerTripService from '../../services/passenger/trip.service.js';
import asyncHandler from '../../utils/asyncHandler.js';

export class PassengerTripController {
  searchTrips = asyncHandler(async (req, res) => {
    const result = await passengerTripService.searchTrips(req.query);

    res.status(200).json({
      success: true,
      data: result,
    });
  });

  getTripById = asyncHandler(async (req, res) => {
    const { tripId } = req.params;
    const trip = await passengerTripService.getTripDetails(tripId);

    res.status(200).json({
      success: true,
      data: { trip },
    });
  });

  getTripSeats = asyncHandler(async (req, res) => {
    const { tripId } = req.params;
    const seatsData = await passengerTripService.getTripSeats(tripId);

    res.status(200).json({
      success: true,
      data: seatsData,
    });
  });
}

export const passengerTripController = new PassengerTripController();
export default passengerTripController;
