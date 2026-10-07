import { z } from 'zod';

export const initializePaymentSchema = z.object({
  bookingId: z.string().uuid('Invalid booking ID format'),
  paymentMethod: z.enum(['CHAPA', 'TELEBIRR', 'CBE_BIRR', 'CREDIT_CARD', 'CASH']).default('TELEBIRR'),
});

export const verifyPaymentSchema = z.object({
  bookingId: z.string().uuid('Invalid booking ID format').optional(),
  transactionReference: z.string().min(3).optional(),
}).refine(
  (data) => data.bookingId !== undefined || data.transactionReference !== undefined,
  { message: 'Either bookingId or transactionReference must be provided', path: ['bookingId'] }
);
