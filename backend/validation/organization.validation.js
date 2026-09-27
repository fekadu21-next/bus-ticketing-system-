import { z } from 'zod';

export const createOrganizationSchema = z.object({
  name: z
    .string({ required_error: 'Organization name is required' })
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(150, 'Name must not exceed 150 characters'),
  type: z
    .string()
    .trim()
    .max(50, 'Type must not exceed 50 characters')
    .default('COMPANY'),
  isActive: z.boolean().default(true),
});

export const updateOrganizationSchema = z.object({
  name: z.string().trim().min(2).max(150).optional(),
  type: z.string().trim().max(50).optional(),
  isActive: z.boolean().optional(),
});

export default {
  createOrganizationSchema,
  updateOrganizationSchema,
};
