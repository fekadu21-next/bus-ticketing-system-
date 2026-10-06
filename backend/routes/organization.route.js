import { Router } from 'express';
import organizationController from '../controllers/organization.controller.js';
import authenticate from '../middleware/authenticate.middleware.js';
import { authorizeRole } from '../middleware/authorize.middleware.js';
import { authorizeOrganization, authorizeOrgRole } from '../middleware/organization.middleware.js';
import validate from '../middleware/validate.middleware.js';
import {
  createOrganizationSchema,
  updateOrganizationSchema,
} from '../validation/organization.validation.js';
import { ROLES } from '../constants/index.js';

const router = Router();

// All organization routes require authentication
router.use(authenticate);

// List organizations (Any authenticated user)
router.get('/', organizationController.getOrganizations);

// Register organization (Admin only)
router.post(
  '/',
  authorizeRole(ROLES.ADMIN),
  validate(createOrganizationSchema),
  organizationController.createOrganization
);

// View specific organization (Admin or Member of that org)
router.get(
  '/:orgId',
  authorizeOrganization((req) => req.params.orgId),
  organizationController.getOrganizationById
);

// Update organization (Admin or Coordinator/Manager of that org)
router.patch(
  '/:orgId',
  authorizeOrgRole([ROLES.BOOKING_COORDINATOR, ROLES.OPERATIONAL_MANAGER], (req) => req.params.orgId),
  validate(updateOrganizationSchema),
  organizationController.updateOrganization
);

import coordinatorRouter from './coordinator/index.js';
import busRoutes from './coordinator/bus.route.js';
import routeRoutes from './coordinator/route.route.js';
import tripRoutes from './coordinator/trip.route.js';
import bookingRoutes from './coordinator/booking.route.js';
import paymentRoutes from './coordinator/payment.route.js';
import reportRoutes from './coordinator/report.route.js';

// Coordinator sub-routes scoped to organization
const requireCoordinator = authorizeOrgRole([ROLES.BOOKING_COORDINATOR, ROLES.OPERATIONAL_MANAGER], (req) => req.params.orgId);

import coordinatorStaffController from '../controllers/coordinator/staff.controller.js';
import driverController from '../controllers/driver/driver.controller.js';

router.use('/:orgId/buses', requireCoordinator, busRoutes);
router.use('/:orgId/routes', requireCoordinator, routeRoutes);
router.use('/:orgId/trips', requireCoordinator, tripRoutes);
router.use('/:orgId/bookings', requireCoordinator, bookingRoutes);
router.use('/:orgId/payments', requireCoordinator, paymentRoutes);
router.use('/:orgId/reports', requireCoordinator, reportRoutes);
router.use('/:orgId/coordinator', requireCoordinator, coordinatorRouter);

// Staff management
router.get('/:orgId/staff', requireCoordinator, coordinatorStaffController.getStaff);
router.post('/:orgId/staff', requireCoordinator, coordinatorStaffController.createStaff);
router.patch('/:orgId/staff/:staffId/status', requireCoordinator, coordinatorStaffController.toggleStaffStatus);
router.patch('/:orgId/staff/:staffId', requireCoordinator, coordinatorStaffController.updateStaff);

// Dedicated Driver management endpoints
router.get('/:orgId/drivers', requireCoordinator, coordinatorStaffController.getDrivers);
router.post('/:orgId/drivers', requireCoordinator, coordinatorStaffController.createDriver);
router.get('/:orgId/drivers/:driverId', requireCoordinator, coordinatorStaffController.getDriverById);
router.patch('/:orgId/drivers/:driverId', requireCoordinator, coordinatorStaffController.updateDriver);
router.patch('/:orgId/drivers/:driverId/status', requireCoordinator, coordinatorStaffController.toggleDriverStatus);

// Organization Problem Reports
router.get('/:orgId/problems', requireCoordinator, driverController.getOrganizationProblems);
router.patch('/:orgId/problems/:problemId/resolve', requireCoordinator, driverController.resolveProblem);

// Verify ticket for organization (Admin, BOOKING_COORDINATOR, or TICKET_VERIFIER of that org)
router.post(
  '/:orgId/verify-ticket',
  authorizeOrgRole([ROLES.TICKET_VERIFIER, ROLES.BOOKING_COORDINATOR, ROLES.OPERATIONAL_MANAGER], (req) => req.params.orgId),
  organizationController.verifyTicket
);

export default router;
