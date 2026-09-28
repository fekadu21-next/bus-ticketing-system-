import { Router } from 'express';
import dashboardRoutes from './dashboard.route.js';
import organizationRoutes from './organization.route.js';
import adminOverviewController from '../../controllers/admin/overview.controller.js';
import authenticate from '../../middleware/authenticate.middleware.js';
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
router.get('/routes', adminOverviewController.getRoutes);
router.get('/trips', adminOverviewController.getTrips);
router.get('/bookings', adminOverviewController.getBookings);
router.get('/payments', adminOverviewController.getPayments);
router.get('/audit-logs', adminOverviewController.getAuditLogs);
router.get('/reports', adminOverviewController.getPlatformReports);
router.get('/stations', adminOverviewController.getStations);

export default router;
