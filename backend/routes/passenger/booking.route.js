import { Router } from 'express';
import passengerBookingController from '../../controllers/passenger/booking.controller.js';
import validate from '../../middleware/validate.middleware.js';
import {
  createBookingSchema,
  bookingIdParamSchema,
  getBookingsQuerySchema,
} from '../../validation/passenger/booking.validation.js';

const router = Router();

router.route('/')
  .post(validate(createBookingSchema), passengerBookingController.createBooking)
  .get(validate(getBookingsQuerySchema, 'query'), passengerBookingController.getBookings);

router.get('/:id', validate(bookingIdParamSchema, 'params'), passengerBookingController.getBookingById);

export default router;
