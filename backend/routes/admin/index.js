import { Router } from 'express';
import dashboardRoutes from './dashboard.route.js';
import organizationRoutes from './organization.route.js';
import adminOverviewController from '../../controllers/admin/overview.controller.js';
import stationsController from '../../controllers/admin/stations.controller.js';
import authenticate from '../../middleware/authenticate.middleware.js';
import validate from '../../middleware/validate.middleware.js';
import { createStationSchema, updateStationSchema } from '../../validation/admin/station.validation.js';
import { authorizeRole } from '../../middleware/authorize.middleware.js';
import { ROLES } from '../../constants/index.js';

const router = Router();

// /api/v1/admin/dashboard
router.use('/dashboard', dashboardRoutes);

// /api/v1/admin/organizations
router.use('/organizations', organizationRoutes);

// Platform-wide Administration Monitors (Admin only)
router.use(authenticate);
router.use(authorizeRole(ROLES.ADMIN));

router.get('/buses', adminOverviewController.getBuses);
router.patch('/buses/:id/status', adminOverviewController.updateBusStatus);
router.get('/routes', adminOverviewController.getRoutes);
router.patch('/routes/:id/status', adminOverviewController.updateRouteStatus);
router.get('/trips', adminOverviewController.getTrips);
router.patch('/trips/:id/status', adminOverviewController.updateTripStatus);
router.get('/bookings', adminOverviewController.getBookings);
router.patch('/bookings/:id/status', adminOverviewController.updateBookingStatus);
router.get('/payments', adminOverviewController.getPayments);
router.patch('/payments/:id/status', adminOverviewController.updatePaymentStatus);
router.get('/audit-logs', adminOverviewController.getAuditLogs);
router.patch('/audit-logs/:id', adminOverviewController.updateAuditLog);
router.get('/reports', adminOverviewController.getPlatformReports);

// Stations CRUD - Note: specific routes must come before parameterized routes
router.get('/stations', stationsController.getStations);
router.get('/stations/active', stationsController.getActiveStations);
router.post('/stations', validate(createStationSchema), stationsController.createStation);
router.get('/stations/:stationId', stationsController.getStationById);
router.put('/stations/:stationId', validate(updateStationSchema), stationsController.updateStation);
router.patch('/stations/:stationId', validate(updateStationSchema), stationsController.updateStation);
router.delete('/stations/:stationId', stationsController.deleteStation);

export default router;
