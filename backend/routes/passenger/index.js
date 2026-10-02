import { Router } from 'express';
import tripRoutes from './trip.route.js';
import bookingRoutes from './booking.route.js';

const router = Router();

router.use('/trips', tripRoutes);
router.use('/bookings', bookingRoutes);

export default router;
