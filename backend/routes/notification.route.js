import { Router } from 'express';
import notificationController from '../controllers/notification.controller.js';
import authenticate from '../middleware/authenticate.middleware.js';
import validate from '../middleware/validate.middleware.js';
import {
  getNotificationsQuerySchema,
  notificationIdParamSchema,
  updatePreferencesSchema,
  deviceTokenSchema,
} from '../validation/notification.validation.js';

const router = Router();

// All notification routes require authentication
router.use(authenticate);

// 1. Get unread count (placed before /:id)
router.get('/unread-count', notificationController.getUnreadCount);

// 2. Mark all as read (placed before /:id)
router.patch('/read-all', notificationController.markAllAsRead);

// 3. User Notification Preferences (placed before /:id)
router.get('/preferences', notificationController.getPreferences);
router.put('/preferences', validate(updatePreferencesSchema, 'body'), notificationController.updatePreferences);
router.patch('/preferences', validate(updatePreferencesSchema, 'body'), notificationController.updatePreferences);

// 4. FCM Device Tokens for Push Notifications (placed before /:id)
router.post('/device-token', validate(deviceTokenSchema, 'body'), notificationController.registerDeviceToken);
router.delete('/device-token', notificationController.unregisterDeviceToken);

// 5. List paginated notifications
router.get(
  '/',
  validate(getNotificationsQuerySchema, 'query'),
  notificationController.getNotifications
);

// 6. Mark specific notification as read
router.patch(
  '/:id/read',
  validate(notificationIdParamSchema, 'params'),
  notificationController.markAsRead
);

export default router;
