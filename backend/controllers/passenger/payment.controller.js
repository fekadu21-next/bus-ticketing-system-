import passengerPaymentService from '../../services/passenger/payment.service.js';
import asyncHandler from '../../utils/asyncHandler.js';

export class PassengerPaymentController {
  initializePayment = asyncHandler(async (req, res) => {
    // For public callback/webhook, user might not be authenticated
    const userId = req.user?.id || null;
    const result = await passengerPaymentService.initializePayment(userId, req.body);

    res.status(200).json({
      success: true,
      message: 'Payment initialized successfully.',
      data: result,
    });
  });

  verifyPayment = asyncHandler(async (req, res) => {
    // For public callback/webhook, user might not be authenticated
    const userId = req.user?.id || null;

    // Handle both GET (redirect from provider) and POST (webhook)
    const transactionReference = req.query.tx_ref || req.body.transactionReference;
    const paymentMethod = req.query.payment_method || req.body.paymentMethod || 'CHAPA';

    if (!transactionReference) {
      return res.status(400).json({
        success: false,
        message: 'Transaction reference is required',
      });
    }

    const result = await passengerPaymentService.verifyPayment(userId, {
      transactionReference,
      paymentMethod,
    });

    // If this is a GET request (redirect from provider), redirect to frontend callback page
    if (req.method === 'GET') {
      const frontendUrl = process.env.CLIENT_URL || 'http://localhost:5173';
      res.redirect(`${frontendUrl}/payment/callback?tx_ref=${transactionReference}&status=success&payment_method=${paymentMethod}`);
    } else {
      // For POST (webhook), return JSON response
      res.status(200).json({
        success: true,
        data: result,
      });
    }
  });

  getPaymentStatus = asyncHandler(async (req, res) => {
    const { bookingId } = req.params;
    const payment = await passengerPaymentService.getPaymentStatus(bookingId, req.user.id);

    res.status(200).json({
      success: true,
      data: { payment },
    });
  });
}
export const passengerPaymentController = new PassengerPaymentController();
export default passengerPaymentController;
