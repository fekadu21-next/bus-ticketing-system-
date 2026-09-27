import { Router } from 'express';
import userController from '../controllers/user.controller.js';
import authenticate from '../middleware/authenticate.middleware.js';
import { authorizeRole } from '../middleware/authorize.middleware.js';
import validate from '../middleware/validate.middleware.js';
import {
  createUserSchema,
  updateUserSchema,
  toggleUserStatusSchema,
} from '../validation/user.validation.js';
import { ROLES } from '../constants/index.js';

const router = Router();

// All user management routes require authentication
router.use(authenticate);

// List users (Admin only)
router.get('/', authorizeRole(ROLES.ADMIN), userController.getUsers);

// Create user by Admin (Admin only)
router.post(
  '/',
  authorizeRole(ROLES.ADMIN),
  validate(createUserSchema),
  userController.createUser
);

// Get single user (Admin or Self)
router.get('/:id', userController.getUserById);

// Update user details (Admin only)
router.patch(
  '/:id',
  authorizeRole(ROLES.ADMIN),
  validate(updateUserSchema),
  userController.updateUser
);

// Toggle user active status (Admin only)
router.patch(
  '/:id/status',
  authorizeRole(ROLES.ADMIN),
  validate(toggleUserStatusSchema),
  userController.toggleStatus
);

export default router;
