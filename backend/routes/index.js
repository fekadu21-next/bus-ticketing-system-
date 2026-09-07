import { Router } from 'express';
import authRoutes from '../modules/auth/auth.route.js';
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

// Auth Routes
router.use('/auth', authRoutes);

export default router;