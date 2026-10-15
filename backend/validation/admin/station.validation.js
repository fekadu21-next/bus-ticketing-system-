import { z } from 'zod';

export const createStationSchema = z.object({
  name: z.string().trim().min(2, 'Station name must be at least 2 characters').max(150),
  city: z.string().trim().min(2, 'City must be at least 2 characters').max(100),
  code: z.string().trim().min(2, 'Station code is required').max(20),
  address: z.string().trim().max(500).nullable().optional(),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
  isActive: z.boolean().optional(),
  is_active: z.boolean().optional(),
});

export const updateStationSchema = createStationSchema.partial();

export default { createStationSchema, updateStationSchema };
