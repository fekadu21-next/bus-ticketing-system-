import { Router } from 'express';
import adminOrganizationController from '../../controllers/admin/organization.controller.js';
import authenticate from '../../middleware/authenticate.middleware.js';
import { authorizeRole } from '../../middleware/authorize.middleware.js';
import validate from '../../middleware/validate.middleware.js';
import {
  uuidParamSchema,
  adminOrganizationQuerySchema,
  rejectOrganizationSchema,
  suspendOrganizationSchema,
} from '../../validation/admin/organization.validation.js';
import { ROLES } from '../../constants/index.js';

const router = Router();

// Enforce authentication & ADMIN role platform-wide across all organization management endpoints
router.use(authenticate);
router.use(authorizeRole(ROLES.ADMIN));

// GET /api/v1/admin/organizations
router.get(
  '/',
  validate(adminOrganizationQuerySchema, 'query'),
  adminOrganizationController.getOrganizations
);

// GET /api/v1/admin/organizations/:id
router.get(
  '/:id',
  validate(uuidParamSchema, 'params'),
  adminOrganizationController.getOrganizationById
);

// PATCH /api/v1/admin/organizations/:id/approve
router.patch(
  '/:id/approve',
  validate(uuidParamSchema, 'params'),
  adminOrganizationController.approveOrganization
);

// PATCH /api/v1/admin/organizations/:id/reject
router.patch(
  '/:id/reject',
  validate(uuidParamSchema, 'params'),
  validate(rejectOrganizationSchema, 'body'),
  adminOrganizationController.rejectOrganization
);

// PATCH /api/v1/admin/organizations/:id/suspend
router.patch(
  '/:id/suspend',
  validate(uuidParamSchema, 'params'),
  validate(suspendOrganizationSchema, 'body'),
  adminOrganizationController.suspendOrganization
);

// PATCH /api/v1/admin/organizations/:id/activate
router.patch(
  '/:id/activate',
  validate(uuidParamSchema, 'params'),
  adminOrganizationController.activateOrganization
);

export default router;
