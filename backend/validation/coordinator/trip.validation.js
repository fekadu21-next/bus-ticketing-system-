import { z } from 'zod';

// Helper: convert empty string or non-UUID string to undefined
const uuidOrUndefined = z.preprocess(
  (val) => (typeof val === 'string' && val.trim() === '' ? undefined : val),
  z.string().uuid().optional()
);

// Helper: convert empty string or non-UUID string to null (nullable field)
const uuidOrNull = z.preprocess(
  (val) => (typeof val === 'string' && val.trim() === '' ? null : val),
  z.string().uuid().optional().nullable()
);

// Helper: coerce string numbers to number
const positiveNumber = z.preprocess(
  (val) => (val !== undefined && val !== null && val !== '' ? Number(val) : undefined),
  z.number().positive().optional()
);

export const createTripSchema = z.object({
  busId: uuidOrUndefined,
  routeId: uuidOrUndefined,
  origin: z.string().trim().min(2).optional(),
  destination: z.string().trim().min(2).optional(),
  originStationId: uuidOrNull,
  destinationStationId: uuidOrNull,
  departureTime: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid departure date/time' }),
  arrivalTime: z.preprocess(
    (val) => (typeof val === 'string' && val.trim() === '' ? null : val),
    z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid arrival date/time' }).optional().nullable()
  ),
  fare: positiveNumber,
  price: positiveNumber,
  fareAmount: positiveNumber,
  driverId: uuidOrNull,
  verifierId: uuidOrNull,
}).refine(
  (data) => (data.busId && data.routeId) || (data.origin && data.destination),
  { message: 'Either (busId and routeId) or (origin and destination) must be provided', path: ['routeId'] }
).refine(
  (data) => data.fare !== undefined || data.price !== undefined || data.fareAmount !== undefined,
  { message: 'Fare or price is required', path: ['fare'] }
);

export const updateTripSchema = z.object({
  busId: uuidOrUndefined,
  routeId: uuidOrUndefined,
  driverId: uuidOrNull,
  verifierId: uuidOrNull,
  departureTime: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid departure date/time' }).optional(),
  arrivalTime: z.preprocess(
    (val) => (typeof val === 'string' && val.trim() === '' ? null : val),
    z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid arrival date/time' }).optional().nullable()
  ),
  fare: positiveNumber,
  price: positiveNumber,
  status: z.enum(['DRAFT', 'PUBLISHED', 'SCHEDULED', 'BOARDING', 'IN_TRANSIT', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
});

export const assignDriverSchema = z.object({
  driverId: uuidOrNull,
});

export const assignVerifierSchema = z.object({
  verifierId: uuidOrNull,
});
