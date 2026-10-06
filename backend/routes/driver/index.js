import { Router } from 'express';
import driverRoutes from './driver.route.js';

const router = Router({ mergeParams: true });

router.use('/', driverRoutes);

export default router;
