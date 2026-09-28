import { z } from 'zod';
import { ROLES } from '../constants/index.js';

const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

export const assignRoleSchema = z.object({
  roleName: z.enum(Object.values(ROLES), {
    required_error: 'Role name is required',
    invalid_type_error: `Role must be one of: ${Object.values(ROLES).join(', ')}`,
  }),
  organizationId: z.string().regex(uuidRegex, 'Invalid organization ID format').optional().nullable(),
});

export const revokeRoleSchema = z.object({
  userRoleId: z.string().regex(uuidRegex, 'Invalid userRoleId format').optional(),
  roleName: z.enum(Object.values(ROLES)).optional(),
  organizationId: z.string().regex(uuidRegex, 'Invalid organization ID format').optional().nullable(),
});

export default {
  assignRoleSchema,
  revokeRoleSchema,
};
