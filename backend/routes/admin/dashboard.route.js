import { Router } from 'express';
import adminDashboardController from '../../controllers/admin/dashboard.controller.js';
import authenticate from '../../middleware/authenticate.middleware.js';
import { authorizeRole } from '../../middleware/authorize.middleware.js';
import { ROLES } from '../../constants/index.js';

const router = Router();

// Platform Admin Dashboard - Requires authentication & ADMIN role
router.get(
  '/',
  authenticate,
  authorizeRole(ROLES.ADMIN),
  adminDashboardController.getDashboard
);

export default router;
