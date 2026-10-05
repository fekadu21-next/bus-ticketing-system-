import { z } from 'zod';

export const submitFeedbackSchema = z.object({
  tripId: z.string().uuid('Invalid trip ID format'),
  rating: z.number().int().min(1, 'Rating must be at least 1').max(5, 'Rating cannot exceed 5'),
  comment: z.string().trim().max(1000, 'Comment cannot exceed 1000 characters').optional().nullable(),
});

export const tripFeedbackParamSchema = z.object({
  tripId: z.string().uuid('Invalid trip ID format'),
});
