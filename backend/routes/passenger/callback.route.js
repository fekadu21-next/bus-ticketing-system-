import { Router } from 'express';
import passengerPaymentController from '../../controllers/passenger/payment.controller.js';

const router = Router();

// Payment callback routes (public - for Chapa/Telebirr redirects)
// Providers redirect back with GET requests containing tx_ref and status
router.get('/chapa', passengerPaymentController.verifyPayment);
router.get('/telebirr', passengerPaymentController.verifyPayment);

// Webhook routes (public - for server-to-server notifications)
router.post('/chapa/webhook', passengerPaymentController.verifyPayment);
router.post('/telebirr/webhook', passengerPaymentController.verifyPayment);

export default router;
