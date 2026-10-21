import { z } from 'zod';

export const createRouteSchema = z.object({
  origin: z.string().trim().min(2).max(100).optional(),
  destination: z.string().trim().min(2).max(100).optional(),
  originStationId: z.string().uuid().optional().nullable(),
  destinationStationId: z.string().uuid().optional().nullable(),
  distanceKm: z.number().positive('Distance must be greater than 0').optional().nullable(),
  estimatedDurationHours: z.number().positive('Duration must be greater than 0').optional().nullable(),
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
  originStationId: z.string().uuid().optional().nullable(),
  destinationStationId: z.string().uuid().optional().nullable(),
  distanceKm: z.number().positive().optional().nullable(),
  estimatedDurationHours: z.number().positive().optional().nullable(),
  isActive: z.boolean().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});
