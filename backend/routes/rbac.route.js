import { Router } from 'express';
import rbacController from '../controllers/rbac.controller.js';
import authenticate from '../middleware/authenticate.middleware.js';
import { authorizeRole } from '../middleware/authorize.middleware.js';
import validate from '../middleware/validate.middleware.js';
import { assignRoleSchema } from '../validation/rbac.validation.js';
import { ROLES } from '../constants/index.js';

const router = Router();

// All RBAC routes require authentication
router.use(authenticate);

// List roles & permissions (Authenticated)
router.get('/roles', rbacController.getRoles);
router.get('/roles/:id', rbacController.getRoleById);
router.get('/permissions', rbacController.getPermissions);

// Inspect user roles (Self or Admin)
router.get('/users/:userId/roles', rbacController.getUserRoles);

// Assign role to user (Admin only)
router.post(
  '/users/:userId/roles',
  authorizeRole(ROLES.ADMIN),
  validate(assignRoleSchema),
  rbacController.assignRole
);

// Revoke role from user (Admin only)
router.delete(
  '/users/:userId/roles/:userRoleId',
  authorizeRole(ROLES.ADMIN),
  rbacController.revokeRole
);

export default router;
