import { z } from 'zod';

export const initializePaymentSchema = z.union([
  z.object({
    tripId: z.string().uuid('Invalid trip ID format'),
    seatNumbers: z.array(z.union([z.string(), z.number()])).min(1, 'At least one seat must be selected'),
    amount: z.number().positive('Amount must be positive').optional(),
    paymentMethod: z.enum(['CHAPA', 'TELEBIRR', 'CBE_BIRR', 'STATION_PAY']).default('TELEBIRR'),
    platform: z.string().optional(),
    returnUrl: z.string().optional(),
    passengerInfo: z.object({
      firstName: z.string().min(1, 'First name is required'),
      lastName: z.string().min(1, 'Last name is required'),
      email: z.string().email('Invalid email format'),
      phone: z.string().min(7, 'Phone number is required'),
      pickupLocation: z.string().optional(),
      dropoffLocation: z.string().optional(),
    }).optional(),
  }),
  z.object({
    bookingId: z.string().uuid('Invalid booking ID format'),
    amount: z.number().positive('Amount must be positive').optional(),
    paymentMethod: z.enum(['CHAPA', 'TELEBIRR', 'CBE_BIRR', 'STATION_PAY']).default('TELEBIRR'),
    platform: z.string().optional(),
    returnUrl: z.string().optional(),
    phoneNumber: z.string().optional(),
  }),
]);

export const verifyPaymentSchema = z.object({
  bookingId: z.string().uuid('Invalid booking ID format').optional(),
  transactionReference: z.string().min(3).optional(),
  paymentMethod: z.string().optional(),
}).refine(
  (data) => data.bookingId !== undefined || data.transactionReference !== undefined,
  { message: 'Either bookingId or transactionReference must be provided', path: ['bookingId'] }
);
