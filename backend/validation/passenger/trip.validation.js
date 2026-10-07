import { z } from 'zod';

export const searchTripsQuerySchema = z.object({
  origin: z.string().trim().min(1).optional(),
  destination: z.string().trim().min(1).optional(),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid travel date format' }).optional(),
  operator: z.string().trim().optional(),
  operatorId: z.string().uuid('Invalid operator ID format').optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.enum(['departureTime', 'fare', 'price']).default('departureTime'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export const tripIdParamSchema = z.object({
  tripId: z.string().uuid('Invalid trip ID format'),
});
