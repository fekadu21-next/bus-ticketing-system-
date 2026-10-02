import { Router } from 'express';
import tripRoutes from './trip.route.js';

const router = Router();

router.use('/trips', tripRoutes);

export default router;
