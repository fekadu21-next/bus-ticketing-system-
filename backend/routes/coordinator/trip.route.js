import { Router } from 'express';
import tripController from '../../controllers/coordinator/trip.controller.js';
import validate from '../../middleware/validate.middleware.js';
import { createTripSchema, updateTripSchema } from '../../validation/coordinator/trip.validation.js';
import { updateSeatStatusSchema, batchUpdateSeatsSchema } from '../../validation/coordinator/seat.validation.js';

const router = Router({ mergeParams: true });

router.route('/')
  .get(tripController.getTrips)
  .post(validate(createTripSchema), tripController.createTrip);

router.route('/:tripId')
  .get(tripController.getTripById)
  .patch(validate(updateTripSchema), tripController.updateTrip);

router.post('/:tripId/cancel', tripController.cancelTrip);
router.post('/:tripId/publish', tripController.publishTrip);
router.post('/:tripId/unpublish', tripController.unpublishTrip);

// Seat management sub-routes
router.get('/:tripId/seats', tripController.getTripSeats);
router.patch('/:tripId/seats/batch', validate(batchUpdateSeatsSchema), tripController.batchUpdateSeats);
router.patch('/:tripId/seats/:seatId', validate(updateSeatStatusSchema), tripController.updateSeatStatus);

export default router;
