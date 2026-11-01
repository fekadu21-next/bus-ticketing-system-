import { z } from 'zod';

export const getVerifierTripsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid date format' }).optional(),
  status: z.enum(['SCHEDULED', 'PUBLISHED', 'IN_TRANSIT', 'COMPLETED', 'CANCELLED']).optional(),
});

export const tripIdParamSchema = z.object({
  tripId: z.string().uuid('Invalid trip ID format'),
});

export const verifyTicketSchema = z
  .object({
    qrToken: z.string().min(1).optional(),
    qrCode: z.string().min(1).optional(),
    tripId: z.string().uuid('Invalid trip ID format').optional(),
  })
  .refine((data) => Boolean(data.qrToken || data.qrCode), {
    message: 'qrToken or qrCode is required',
    path: ['qrToken'],
  });
