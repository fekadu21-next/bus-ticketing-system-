import { z } from 'zod';

export const ticketIdParamSchema = z.object({
  id: z.string().uuid('Invalid ticket ID format'),
});

export const getTicketsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: z.enum(['UNUSED', 'USED', 'CANCELLED']).optional(),
});
