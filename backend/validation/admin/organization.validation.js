import { z } from 'zod';
import { ALL_ORGANIZATION_TYPES, ALL_ORGANIZATION_STATUSES } from '../../constants/organization.js';

export const uuidParamSchema = z.object({
  id: z
    .string({ required_error: 'Organization ID is required' })
    .regex(
      /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/,
      'Invalid organization ID format. Must be a valid UUID.'
    ),
});

export const adminOrganizationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().trim().optional(),
  status: z.enum(ALL_ORGANIZATION_STATUSES, {
    errorMap: () => ({ message: `Status must be one of: ${ALL_ORGANIZATION_STATUSES.join(', ')}` }),
  }).optional(),
  type: z.enum(ALL_ORGANIZATION_TYPES, {
    errorMap: () => ({ message: `Type must be one of: ${ALL_ORGANIZATION_TYPES.join(', ')}` }),
  }).optional(),
});

export const rejectOrganizationSchema = z.object({
  reason: z.string().trim().max(500, 'Rejection reason cannot exceed 500 characters').optional(),
});

export const suspendOrganizationSchema = z.object({
  reason: z.string().trim().max(500, 'Suspension reason cannot exceed 500 characters').optional(),
});

export default {
  uuidParamSchema,
  adminOrganizationQuerySchema,
  rejectOrganizationSchema,
  suspendOrganizationSchema,
};
