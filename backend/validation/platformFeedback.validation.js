import { z } from 'zod';

export const submitPlatformFeedbackSchema = z.object({
  rating: z
    .number({ required_error: 'Rating is required' })
    .int('Rating must be an integer')
    .min(1, 'Rating must be at least 1 star')
    .max(5, 'Rating cannot exceed 5 stars'),
  category: z
    .enum(['BUG_REPORT', 'USABILITY', 'FEATURE_REQUEST', 'PERFORMANCE', 'OTHER'], {
      errorMap: () => ({ message: 'Category must be BUG_REPORT, USABILITY, FEATURE_REQUEST, PERFORMANCE, or OTHER' }),
    })
    .default('OTHER'),
  comment: z
    .string({ required_error: 'Feedback comment is required' })
    .trim()
    .min(5, 'Feedback comment must be at least 5 characters')
    .max(2000, 'Feedback comment cannot exceed 2000 characters'),
});

export const updatePlatformFeedbackStatusSchema = z.object({
  status: z
    .enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'], {
      errorMap: () => ({ message: 'Status must be OPEN, IN_PROGRESS, RESOLVED, or CLOSED' }),
    })
    .optional(),
  adminResponse: z
    .string()
    .trim()
    .max(2000, 'Admin response cannot exceed 2000 characters')
    .optional()
    .nullable(),
});

