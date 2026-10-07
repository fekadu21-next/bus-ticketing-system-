import { Router } from 'express';
import passengerTripController from '../../controllers/passenger/trip.controller.js';
import validate from '../../middleware/validate.middleware.js';
import {
  searchTripsQuerySchema,
  tripIdParamSchema,
} from '../../validation/passenger/trip.validation.js';

const router = Router();

router.get('/', validate(searchTripsQuerySchema, 'query'), passengerTripController.searchTrips);
router.get('/:tripId', validate(tripIdParamSchema, 'params'), passengerTripController.getTripById);
router.get('/:tripId/seats', validate(tripIdParamSchema, 'params'), passengerTripController.getTripSeats);

export default router;
