import { Router } from 'express';
import bookingController from '../../controllers/coordinator/booking.controller.js';

const router = Router({ mergeParams: true });

router.get('/', bookingController.getBookings);
router.get('/:bookingId', bookingController.getBookingById);

export default router;
