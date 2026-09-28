import { z } from 'zod';
import { ROLES } from '../constants/index.js';

const passwordRule = z
  .string()
  .min(8, 'Password must be at least 8 characters long')
  .max(128, 'Password must not exceed 128 characters')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character');

export const createUserSchema = z.object({
  firstName: z
    .string({ required_error: 'First name is required' })
    .trim()
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name must not exceed 50 characters'),
  lastName: z
    .string({ required_error: 'Last name is required' })
    .trim()
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name must not exceed 50 characters'),
  email: z
    .string({ required_error: 'Email is required' })
    .trim()
    .toLowerCase()
    .email('Invalid email address'),
  phone: z
    .string()
    .trim()
    .regex(/^[0-9+\s-]{8,20}$/, 'Invalid phone number format')
    .optional()
    .nullable(),
  password: passwordRule,
  role: z.enum(Object.values(ROLES)).default(ROLES.PASSENGER),
  organizationId: z
    .string()
    .regex(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/, 'Invalid organization UUID')
    .optional()
    .nullable(),
  isActive: z.boolean().default(true),
  emailVerified: z.boolean().default(true), // Admin created users can be pre-verified
});

export const updateUserSchema = z.object({
  firstName: z.string().trim().min(2).max(50).optional(),
  lastName: z.string().trim().min(2).max(50).optional(),
  phone: z
    .string()
    .trim()
    .regex(/^[0-9+\s-]{8,20}$/, 'Invalid phone number format')
    .optional()
    .nullable(),
  isActive: z.boolean().optional(),
});

export const toggleUserStatusSchema = z.object({
  isActive: z.boolean({ required_error: 'isActive status boolean is required' }),
});

export default {
  createUserSchema,
  updateUserSchema,
  toggleUserStatusSchema,
};
