import { z } from 'zod';

export const tripIdParamSchema = z.object({
  tripId: z.string().uuid('Invalid trip ID format'),
});

export const reportProblemSchema = z.object({
  type: z.enum([
    'VEHICLE_PROBLEM',
    'ACCIDENT',
    'DELAY',
    'ROUTE_PROBLEM',
    'PASSENGER_ISSUE',
    'OTHER',
  ], {
    errorMap: () => ({ message: 'Invalid problem type. Must be one of VEHICLE_PROBLEM, ACCIDENT, DELAY, ROUTE_PROBLEM, PASSENGER_ISSUE, OTHER' }),
  }),
  description: z
    .string({ required_error: 'Description is required' })
    .trim()
    .min(3, 'Description must be at least 3 characters long'),
});

export const getDriverTripsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: z
    .enum(['SCHEDULED', 'PUBLISHED', 'IN_TRANSIT', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'])
    .optional(),
  date: z.string().optional(),
});

export const resolveProblemSchema = z.object({
  status: z.enum(['RESOLVED', 'DISMISSED', 'ACKNOWLEDGED']).default('RESOLVED'),
  notes: z.string().trim().optional(),
});
