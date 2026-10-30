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

    // If this is a GET request (redirect from provider)
    if (req.method === 'GET') {
      const isMobile = req.query.platform === 'mobile';
      if (isMobile) {
        const appUrl = req.query.app_url || 'busticket://payment/callback';
        const sep = appUrl.includes('?') ? '&' : '?';
        const targetDeepLink = `${appUrl}${sep}tx_ref=${encodeURIComponent(transactionReference)}&status=success`;
        const fallbackDeepLink = `busticket://payment/callback?tx_ref=${encodeURIComponent(transactionReference)}&status=success`;

        return res.status(200).send(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Successful - EthioBus</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0f172a; color: #fff; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; }
    .card { background: #1e293b; border: 1px solid #334155; border-radius: 20px; padding: 32px 24px; text-align: center; max-width: 400px; width: 100%; box-shadow: 0 10px 25px rgba(0,0,0,0.4); }
    .badge { width: 64px; height: 64px; background: rgba(16,185,129,0.15); border: 2px solid #10b981; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 32px; margin: 0 auto 20px; color: #10b981; }
    h1 { font-size: 20px; font-weight: 800; margin: 0 0 8px; color: #10b981; }
    p { font-size: 13px; color: #94a3b8; line-height: 1.5; margin: 0 0 24px; }
    .btn { display: block; background: #059669; color: white; text-decoration: none; padding: 14px; border-radius: 12px; font-weight: 800; font-size: 14px; margin-bottom: 12px; }
    .btn-alt { background: transparent; border: 1px solid #334155; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">✓</div>
    <h1>Payment Verified!</h1>
    <p>Your bus booking has been confirmed. Returning to the EthioBus mobile app...</p>
    <a class="btn" href="${targetDeepLink}">Open My Boarding Pass & Ticket</a>
    <a class="btn btn-alt" href="${fallbackDeepLink}">Open via busticket://</a>
  </div>
  <script>
    // Automatic immediate deep link redirect to mobile app
    window.location.href = "${targetDeepLink}";
    setTimeout(function() {
      window.location.href = "${fallbackDeepLink}";
    }, 400);
  </script>
</body>
</html>`);
      }

      const frontendUrl = process.env.CLIENT_URL || 'http://localhost:5173';
      return res.redirect(`${frontendUrl}/payment/callback?tx_ref=${transactionReference}&status=success&payment_method=${paymentMethod}`);
    } else {
      // For POST (webhook), return JSON response
      return res.status(200).json({
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
