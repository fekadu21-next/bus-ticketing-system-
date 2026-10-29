import { Router } from 'express';
import tripRoutes from './trip.route.js';
import bookingRoutes from './booking.route.js';
import ticketRoutes from './ticket.route.js';
import feedbackRoutes from './feedback.route.js';
import callbackRoutes from './callback.route.js';

const router = Router();

router.use('/trips', tripRoutes);
router.use('/bookings', bookingRoutes);
router.use('/tickets', ticketRoutes);
router.use('/feedback', feedbackRoutes);
router.use('/callback', callbackRoutes);

export default router;
