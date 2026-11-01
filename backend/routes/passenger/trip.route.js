import { Router } from 'express';
import passengerTripController from '../../controllers/passenger/trip.controller.js';
import validate from '../../middleware/validate.middleware.js';
import {
  searchTripsQuerySchema,
  tripIdParamSchema,
} from '../../validation/passenger/trip.validation.js';

const router = Router();

// Public passenger catalog - Cached for edge CDN & browser with stale-while-revalidate
router.get(
  '/',
  (req, res, next) => {
    res.setHeader('Cache-Control', 'public, max-age=30, stale-while-revalidate=120');
    next();
  },
  validate(searchTripsQuerySchema, 'query'),
  passengerTripController.searchTrips
);

// Trip Details - Cached for 30s
router.get(
  '/:tripId',
  (req, res, next) => {
    res.setHeader('Cache-Control', 'public, max-age=30, stale-while-revalidate=60');
    next();
  },
  validate(tripIdParamSchema, 'params'),
  passengerTripController.getTripById
);

// Real-time Seat Map - Strictly uncached to avoid booking race collisions
router.get(
  '/:tripId/seats',
  (req, res, next) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    next();
  },
  validate(tripIdParamSchema, 'params'),
  passengerTripController.getTripSeats
);

export default router;
