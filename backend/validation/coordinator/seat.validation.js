import { z } from 'zod';

export const updateSeatStatusSchema = z.object({
  status: z.enum(['AVAILABLE', 'LOCKED', 'BOOKED'], {
    errorMap: () => ({ message: 'Status must be one of: AVAILABLE, LOCKED, BOOKED' }),
  }),
});

export const batchUpdateSeatsSchema = z.object({
  seatNumbers: z.array(z.number().int().positive()).min(1, 'At least one seat number is required'),
  status: z.enum(['AVAILABLE', 'LOCKED'], {
    errorMap: () => ({ message: 'Batch update status must be AVAILABLE or LOCKED' }),
  }),
});
