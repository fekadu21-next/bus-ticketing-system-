import { Router } from 'express';
import dashboardRoutes from './dashboard.route.js';
import organizationRoutes from './organization.route.js';

const router = Router();

// /api/v1/admin/dashboard
router.use('/dashboard', dashboardRoutes);

// /api/v1/admin/organizations
router.use('/organizations', organizationRoutes);

export default router;
