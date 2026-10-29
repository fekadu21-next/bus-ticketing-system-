import { z } from 'zod';

// Convert empty string to null for nullable UUID fields
const uuidOrNull = z.preprocess(
  (val) => (typeof val === 'string' && val.trim() === '' ? null : val),
  z.string().uuid().optional().nullable()
);

// Coerce string numbers to number for numeric fields
const positiveNumberOrNull = z.preprocess(
  (val) => (val !== undefined && val !== null && val !== '' ? Number(val) : undefined),
  z.number().positive().optional().nullable()
);

export const createRouteSchema = z.object({
  origin: z.string().trim().min(2).max(100).optional(),
  destination: z.string().trim().min(2).max(100).optional(),
  originStationId: uuidOrNull,
  destinationStationId: uuidOrNull,
  distanceKm: positiveNumberOrNull,
  estimatedDurationHours: positiveNumberOrNull,
  isActive: z.boolean().optional().default(true),
}).refine(
  (data) => Boolean((data.origin && data.destination) || (data.originStationId && data.destinationStationId)),
  {
    message: 'Either origin/destination names or origin/destination station IDs are required',
    path: ['destination'],
  }
).refine(
  (data) => {
    if (data.origin && data.destination) {
      return data.origin.toLowerCase() !== data.destination.toLowerCase();
    }
    if (data.originStationId && data.destinationStationId) {
      return data.originStationId !== data.destinationStationId;
    }
    return true;
  },
  {
    message: 'Origin and destination cannot be identical',
    path: ['destination'],
  }
);

export const updateRouteSchema = z.object({
  origin: z.string().trim().min(2).max(100).optional(),
  destination: z.string().trim().min(2).max(100).optional(),
  originStationId: uuidOrNull,
  destinationStationId: uuidOrNull,
  distanceKm: positiveNumberOrNull,
  estimatedDurationHours: positiveNumberOrNull,
  isActive: z.boolean().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});
