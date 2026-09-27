import { Router } from 'express';
import busRoutes from './bus.route.js';
import routeRoutes from './route.route.js';
import tripRoutes from './trip.route.js';
import bookingRoutes from './booking.route.js';
import paymentRoutes from './payment.route.js';
import reportRoutes from './report.route.js';

const router = Router({ mergeParams: true });

router.use('/buses', busRoutes);
router.use('/routes', routeRoutes);
router.use('/trips', tripRoutes);
router.use('/bookings', bookingRoutes);
router.use('/payments', paymentRoutes);
router.use('/reports', reportRoutes);

export default router;
