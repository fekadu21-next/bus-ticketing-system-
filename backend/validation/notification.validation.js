import { z } from 'zod';
import { ALL_NOTIFICATION_TYPES } from '../constants/notification.js';

const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

export const getNotificationsQuerySchema = z.object({
  page: z.coerce.number().int().min(1, 'Page must be at least 1').default(1),
  limit: z.coerce.number().int().min(1, 'Limit must be at least 1').max(100, 'Limit cannot exceed 100').default(20),
  unreadOnly: z
    .preprocess((val) => {
      if (typeof val === 'string') return val.toLowerCase() === 'true';
      return Boolean(val);
    }, z.boolean())
    .optional(),
  type: z.enum(ALL_NOTIFICATION_TYPES).optional(),
});

export const notificationIdParamSchema = z.object({
  id: z.string({ required_error: 'Notification ID is required' }).regex(uuidRegex, 'Invalid notification UUID format'),
});
