import { z } from 'zod';

export const createRouteSchema = z.object({
  origin: z.string().trim().min(2, 'Origin must be at least 2 characters').max(100),
  destination: z.string().trim().min(2, 'Destination must be at least 2 characters').max(100),
  distanceKm: z.number().positive('Distance must be greater than 0').optional().nullable(),
  estimatedDurationHours: z.number().positive('Duration must be greater than 0').optional().nullable(),
  isActive: z.boolean().optional().default(true),
}).refine((data) => data.origin.toLowerCase() !== data.destination.toLowerCase(), {
  message: 'Origin and destination cannot be identical',
  path: ['destination'],
});

export const updateRouteSchema = z.object({
  origin: z.string().trim().min(2).max(100).optional(),
  destination: z.string().trim().min(2).max(100).optional(),
  distanceKm: z.number().positive().optional().nullable(),
  estimatedDurationHours: z.number().positive().optional().nullable(),
  isActive: z.boolean().optional(),
});
