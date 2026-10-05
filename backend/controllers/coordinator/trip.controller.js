import tripService from '../../services/coordinator/trip.service.js';
import asyncHandler from '../../utils/asyncHandler.js';

export class TripController {
  createTrip = asyncHandler(async (req, res) => {
    const trip = await tripService.createTrip(req.organizationId, req.body);
    res.status(201).json({
      success: true,
      message: 'Trip scheduled successfully.',
      data: { trip },
    });
  });

  getTrips = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '20', 10);
    const { status, routeId, busId, fromDate, toDate } = req.query;

    const result = await tripService.getTrips(req.organizationId, {
      page,
      limit,
      status,
      routeId,
      busId,
      fromDate,
      toDate,
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  });

  getTripById = asyncHandler(async (req, res) => {
    const { tripId } = req.params;
    const trip = await tripService.getTripById(tripId, req.organizationId);
    res.status(200).json({
      success: true,
      data: { trip },
    });
  });

  updateTrip = asyncHandler(async (req, res) => {
    const { tripId } = req.params;
    const trip = await tripService.updateTrip(tripId, req.organizationId, req.body);
    res.status(200).json({
      success: true,
      message: 'Trip updated successfully.',
      data: { trip },
    });
  });

  cancelTrip = asyncHandler(async (req, res) => {
    const { tripId } = req.params;
    const trip = await tripService.cancelTrip(tripId, req.organizationId);
    res.status(200).json({
      success: true,
      message: 'Trip cancelled successfully.',
      data: { trip },
    });
  });

  publishTrip = asyncHandler(async (req, res) => {
    const { tripId } = req.params;
    const trip = await tripService.publishTrip(tripId, req.organizationId);
    res.status(200).json({
      success: true,
      message: 'Trip published successfully.',
      data: { trip },
    });
  });

  unpublishTrip = asyncHandler(async (req, res) => {
    const { tripId } = req.params;
    const trip = await tripService.unpublishTrip(tripId, req.organizationId);
    res.status(200).json({
      success: true,
      message: 'Trip unpublished (set to draft).',
      data: { trip },
    });
  });

  // Seat endpoints
  getTripSeats = asyncHandler(async (req, res) => {
    const { tripId } = req.params;
    const seats = await tripService.getTripSeats(tripId, req.organizationId);
    res.status(200).json({
      success: true,
      data: { seats },
    });
  });

  updateSeatStatus = asyncHandler(async (req, res) => {
    const { tripId, seatId } = req.params;
    const { status } = req.body;
    const seat = await tripService.updateSeatStatus(tripId, seatId, req.organizationId, status);
    res.status(200).json({
      success: true,
      message: 'Seat status updated successfully.',
      data: { seat },
    });
  });

  batchUpdateSeats = asyncHandler(async (req, res) => {
    const { tripId } = req.params;
    const { seatNumbers, status } = req.body;
    await tripService.batchUpdateSeats(tripId, req.organizationId, seatNumbers, status);
    res.status(200).json({
      success: true,
      message: 'Seats updated successfully.',
    });
  });
}

export const tripController = new TripController();
export default tripController;
