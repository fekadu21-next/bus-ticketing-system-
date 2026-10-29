import { Router } from 'express';
import passengerPaymentController from '../../controllers/passenger/payment.controller.js';
import validate from '../../middleware/validate.middleware.js';
import {
  initializePaymentSchema,
  verifyPaymentSchema,
} from '../../validation/passenger/payment.validation.js';

const router = Router();

import authenticate, { optionalAuthenticate } from '../../middleware/authenticate.middleware.js';
import { authorizeRole } from '../../middleware/authorize.middleware.js';
import { ROLES } from '../../constants/index.js';

// Payment initialization (optional auth: uses logged in user or creates/matches guest info)
router.post('/initialize', optionalAuthenticate, validate(initializePaymentSchema), passengerPaymentController.initializePayment);

// Payment verification (optional auth: supports user direct verification or callback from payment providers)
router.post('/verify', optionalAuthenticate, validate(verifyPaymentSchema), passengerPaymentController.verifyPayment);

// Authenticated payment status check (requires auth)
router.get('/booking/:bookingId', authenticate, authorizeRole(ROLES.PASSENGER), passengerPaymentController.getPaymentStatus);


export default router;
