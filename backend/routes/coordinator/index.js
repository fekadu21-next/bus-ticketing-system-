import { Router } from 'express';
import busRoutes from './bus.route.js';
import routeRoutes from './route.route.js';
import tripRoutes from './trip.route.js';
import bookingRoutes from './booking.route.js';
import paymentRoutes from './payment.route.js';
import reportRoutes from './report.route.js';
import staffRoutes from './staff.route.js';
import feedbackRoutes from './feedback.route.js';
import stationsController from '../../controllers/admin/stations.controller.js';
import { coordinatorStaffController } from '../../controllers/coordinator/staff.controller.js';

const router = Router({ mergeParams: true });

router.use('/buses', busRoutes);
router.use('/routes', routeRoutes);
router.use('/trips', tripRoutes);
router.use('/bookings', bookingRoutes);
router.use('/payments', paymentRoutes);
router.use('/reports', reportRoutes);
router.use('/staff', staffRoutes);
router.use('/feedback', feedbackRoutes);

// Driver endpoints (direct path for easier access)
router.get('/drivers', coordinatorStaffController.getDrivers);
router.get('/drivers/:driverId', coordinatorStaffController.getDriverById);
router.post('/drivers', coordinatorStaffController.createDriver);
router.patch('/drivers/:driverId', coordinatorStaffController.updateDriver);
router.patch('/drivers/:driverId/status', coordinatorStaffController.toggleDriverStatus);
router.delete('/drivers/:driverId', coordinatorStaffController.deleteDriver);

// Assign driver to trip
router.patch('/trips/:tripId/assign-driver', coordinatorStaffController.assignDriverToTrip);

// Stations - read-only access for operators (for route creation)
router.get('/stations/active', stationsController.getActiveStations);

export default router;
