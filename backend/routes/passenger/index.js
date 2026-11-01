import { Router } from 'express';
import tripRoutes from './trip.route.js';
import bookingRoutes from './booking.route.js';
import ticketRoutes from './ticket.route.js';
import feedbackRoutes from './feedback.route.js';

const router = Router();

// Authenticated passenger endpoints
router.use('/trips', tripRoutes);
router.use('/bookings', bookingRoutes);
router.use('/tickets', ticketRoutes);
router.use('/feedback', feedbackRoutes);

export default router;
