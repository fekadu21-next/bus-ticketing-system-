import { Router } from 'express';
import tripRoutes from './trip.route.js';
import bookingRoutes from './booking.route.js';
import paymentRoutes from './payment.route.js';
import ticketRoutes from './ticket.route.js';

const router = Router();

router.use('/trips', tripRoutes);
router.use('/bookings', bookingRoutes);
router.use('/payments', paymentRoutes);
router.use('/tickets', ticketRoutes);

export default router;
