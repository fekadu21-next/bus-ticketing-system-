import paymentRepository from '../../repository/coordinator/payment.repository.js';
import ApiError from '../../utils/apiError.js';

export class PaymentService {
  async getPayments(organizationId, query) {
    if (!organizationId) {
      throw new ApiError(400, 'Organization context is required.');
    }
    return paymentRepository.findAll(organizationId, query);
  }

  async getPaymentById(paymentId, organizationId) {
    if (!organizationId) {
      throw new ApiError(400, 'Organization context is required.');
    }

    const payment = await paymentRepository.findById(paymentId, organizationId);
    if (!payment) {
      throw new ApiError(404, 'Payment record not found or does not belong to your organization.');
    }

    return payment;
  }
}

export const paymentService = new PaymentService();
export default paymentService;
