import { Router } from 'express';
import paymentController from '../../controllers/coordinator/payment.controller.js';

const router = Router({ mergeParams: true });

router.get('/', paymentController.getPayments);
router.get('/:paymentId', paymentController.getPaymentById);

export default router;
