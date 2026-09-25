import { Router } from 'express';
import authRoutes from './auth.route.js';
import authenticate from '../middleware/authenticate.middleware.js';
import { authorizeRole, authorizePermission } from '../middleware/authorize.middleware.js';
import authorizeOrganization from '../middleware/organization.middleware.js';

const router = Router();

// API Health Check
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

router.get(
  '/admin/test',
  authenticate,
  authorizeRole('PLATFORM_ADMIN'),
  (req, res) => {
    res.status(200).json({
      success: true,
      message: 'PLATFORM_ADMIN access granted',
      user: req.user,
    });
  }
);

router.get(
  '/admin/users-test',
  authenticate,
  authorizePermission('MANAGE_USERS'),
  (req, res) => {
    res.status(200).json({
      success: true,
      message: 'MANAGE_USERS permission granted',
      user: req.user,
    });
  }
);
// Auth Routes
router.use('/auth', authRoutes);

export default router;