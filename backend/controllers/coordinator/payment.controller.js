import paymentService from '../../services/coordinator/payment.service.js';
import asyncHandler from '../../utils/asyncHandler.js';

export class PaymentController {
  getPayments = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '20', 10);
    const { status, paymentMethod, fromDate, toDate } = req.query;

    const result = await paymentService.getPayments(req.organizationId, {
      page,
      limit,
      status,
      paymentMethod,
      fromDate,
      toDate,
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  });

  getPaymentById = asyncHandler(async (req, res) => {
    const { paymentId } = req.params;
    const payment = await paymentService.getPaymentById(paymentId, req.organizationId);
    res.status(200).json({
      success: true,
      data: { payment },
    });
  });
}

export const paymentController = new PaymentController();
export default paymentController;
