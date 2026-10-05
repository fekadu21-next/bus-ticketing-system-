import { Router } from 'express';
import driverController from '../../controllers/driver/driver.controller.js';
import validate from '../../middleware/validate.middleware.js';
import {
  tripIdParamSchema,
  reportProblemSchema,
  getDriverTripsQuerySchema,
} from '../../validation/driver/driver.validation.js';

const router = Router();

// Profile
router.get('/me', driverController.getProfile);

// Dashboard
router.get('/dashboard', driverController.getDashboard);

// Trips
router.get('/trips', validate(getDriverTripsQuerySchema, 'query'), driverController.getAssignedTrips);
router.get('/trips/:tripId', validate(tripIdParamSchema, 'params'), driverController.getTripDetails);

// Trip Operations
router.post('/trips/:tripId/start', validate(tripIdParamSchema, 'params'), driverController.startTrip);
router.post('/trips/:tripId/complete', validate(tripIdParamSchema, 'params'), driverController.completeTrip);

// Problem Reporting
router.post(
  '/trips/:tripId/problems',
  validate(tripIdParamSchema, 'params'),
  validate(reportProblemSchema, 'body'),
  driverController.reportProblem
);
router.get('/trips/:tripId/problems', validate(tripIdParamSchema, 'params'), driverController.getTripProblems);
router.get('/problems', driverController.getDriverProblems);

export default router;
