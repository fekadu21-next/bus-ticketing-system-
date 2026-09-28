import { Router } from 'express';
import authRoutes from './auth.route.js';
import userRoutes from './user.route.js';
import rbacRoutes from './rbac.route.js';
import organizationRoutes from './organization.route.js';
import adminRoutes from './admin/index.js';
import coordinatorRoutes from './coordinator/index.js';
import authenticate from '../middleware/authenticate.middleware.js';
import { authorizeRole, authorizePermission } from '../middleware/authorize.middleware.js';
import { authorizeOrgRole } from '../middleware/organization.middleware.js';
import { ROLES, PERMISSIONS } from '../constants/index.js';

const router = Router();

// API Health Check
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Admin verification test routes
router.get(
  '/admin/test',
  authenticate,
  authorizeRole(ROLES.ADMIN),
  (req, res) => {
    res.status(200).json({
      success: true,
      message: 'ADMIN access granted',
      user: req.user,
    });
  }
);

router.get(
  '/admin/users-test',
  authenticate,
  authorizePermission(PERMISSIONS.MANAGE_USERS),
  (req, res) => {
    res.status(200).json({
      success: true,
      message: 'MANAGE_USERS permission granted',
      user: req.user,
    });
  }
);

// Route Modules
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/rbac', rbacRoutes);
router.use('/organizations', organizationRoutes);
router.use('/admin', adminRoutes);
router.use('/coordinator', authenticate, authorizeOrgRole([ROLES.BOOKING_COORDINATOR]), coordinatorRoutes);

export default router;
