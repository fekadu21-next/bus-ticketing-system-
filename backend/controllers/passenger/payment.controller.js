import passengerPaymentService from '../../services/passenger/payment.service.js';
import asyncHandler from '../../utils/asyncHandler.js';

export class PassengerPaymentController {
  initializePayment = asyncHandler(async (req, res) => {
    const result = await passengerPaymentService.initializePayment(req.user.id, req.body);

    res.status(200).json({
      success: true,
      message: 'Payment initialized successfully.',
      data: result,
    });
  });

  verifyPayment = asyncHandler(async (req, res) => {
    const result = await passengerPaymentService.verifyPayment(req.user.id, req.body);

    res.status(200).json({
      success: true,
      data: result,
    });
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
