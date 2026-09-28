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

// Update organization (Admin only)
router.patch(
  '/:orgId',
  authorizeRole(ROLES.ADMIN),
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
const requireCoordinator = authorizeOrgRole([ROLES.BOOKING_COORDINATOR], (req) => req.params.orgId);

router.use('/:orgId/buses', requireCoordinator, busRoutes);
router.use('/:orgId/routes', requireCoordinator, routeRoutes);
router.use('/:orgId/trips', requireCoordinator, tripRoutes);
router.use('/:orgId/bookings', requireCoordinator, bookingRoutes);
router.use('/:orgId/payments', requireCoordinator, paymentRoutes);
router.use('/:orgId/reports', requireCoordinator, reportRoutes);
router.use('/:orgId/coordinator', requireCoordinator, coordinatorRouter);

// Verify ticket for organization (Admin, BOOKING_COORDINATOR, or TICKET_VERIFIER of that org)
router.post(
  '/:orgId/verify-ticket',
  authorizeOrgRole([ROLES.TICKET_VERIFIER, ROLES.BOOKING_COORDINATOR], (req) => req.params.orgId),
  organizationController.verifyTicket
);

export default router;
