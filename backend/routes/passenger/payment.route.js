import { Router } from 'express';
import passengerPaymentController from '../../controllers/passenger/payment.controller.js';
import validate from '../../middleware/validate.middleware.js';
import {
  initializePaymentSchema,
  verifyPaymentSchema,
} from '../../validation/passenger/payment.validation.js';

const router = Router();

router.post('/initialize', validate(initializePaymentSchema), passengerPaymentController.initializePayment);
router.post('/verify', validate(verifyPaymentSchema), passengerPaymentController.verifyPayment);
router.get('/booking/:bookingId', passengerPaymentController.getPaymentStatus);

export default router;
