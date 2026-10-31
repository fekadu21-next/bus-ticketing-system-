import { Router } from 'express';
import notificationController from '../controllers/notification.controller.js';
import authenticate from '../middleware/authenticate.middleware.js';
import validate from '../middleware/validate.middleware.js';
import {
  getNotificationsQuerySchema,
  notificationIdParamSchema,
} from '../validation/notification.validation.js';

const router = Router();

// All notification routes require authentication
router.use(authenticate);

// 1. Get unread count (placed before /:id)
router.get('/unread-count', notificationController.getUnreadCount);

// 2. Mark all as read (placed before /:id)
router.patch('/read-all', notificationController.markAllAsRead);

// 3. List paginated notifications
router.get(
  '/',
  validate(getNotificationsQuerySchema, 'query'),
  notificationController.getNotifications
);

// 4. Mark specific notification as read
router.patch(
  '/:id/read',
  validate(notificationIdParamSchema, 'params'),
  notificationController.markAsRead
);

export default router;
