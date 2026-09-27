import { z } from 'zod';

export const createTripSchema = z.object({
  busId: z.string().uuid('Invalid bus ID format').optional(),
  routeId: z.string().uuid('Invalid route ID format').optional(),
  origin: z.string().trim().min(2).optional(),
  destination: z.string().trim().min(2).optional(),
  departureTime: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid departure date/time' }),
  arrivalTime: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid arrival date/time' }).optional().nullable(),
  fare: z.number().positive('Fare must be greater than 0').optional(),
  price: z.number().positive('Price must be greater than 0').optional(),
}).refine(
  (data) => (data.busId && data.routeId) || (data.origin && data.destination),
  { message: 'Either (busId and routeId) or (origin and destination) must be provided', path: ['routeId'] }
).refine(
  (data) => data.fare !== undefined || data.price !== undefined,
  { message: 'Fare or price is required', path: ['fare'] }
);

export const updateTripSchema = z.object({
  busId: z.string().uuid().optional(),
  routeId: z.string().uuid().optional(),
  departureTime: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid departure date/time' }).optional(),
  arrivalTime: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid arrival date/time' }).optional().nullable(),
  fare: z.number().positive().optional(),
  price: z.number().positive().optional(),
  status: z.enum(['SCHEDULED', 'IN_TRANSIT', 'COMPLETED', 'CANCELLED']).optional(),
});
