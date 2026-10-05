import { z } from 'zod';

export const createBookingSchema = z.object({
  tripId: z.string().uuid('Invalid trip ID format'),
  seatId: z.string().uuid('Invalid seat ID format').optional(),
  seatNumber: z.number().int().positive().optional(),
}).refine(
  (data) => data.seatId !== undefined || data.seatNumber !== undefined,
  { message: 'Either seatId or seatNumber must be provided', path: ['seatId'] }
);

export const bookingIdParamSchema = z.object({
  id: z.string().uuid('Invalid booking ID format'),
});

export const getBookingsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: z.enum(['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED']).optional(),
});
