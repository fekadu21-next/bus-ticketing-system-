import { z } from 'zod';

export const createBusSchema = z.object({
  plateNumber: z.string().trim().min(3, 'Plate number must be at least 3 characters').max(50),
  model: z.string().trim().max(100).optional(),
  capacity: z.number().int().min(1, 'Capacity must be at least 1').max(200).default(50),
  isActive: z.boolean().optional().default(true),
});

export const updateBusSchema = z.object({
  plateNumber: z.string().trim().min(3).max(50).optional(),
  model: z.string().trim().max(100).nullable().optional(),
  capacity: z.number().int().min(1).max(200).optional(),
  isActive: z.boolean().optional(),
});
