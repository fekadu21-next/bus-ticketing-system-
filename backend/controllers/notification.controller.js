import notificationService from '../services/notification.service.js';
import asyncHandler from '../utils/asyncHandler.js';

export class NotificationController {
  /**
   * GET /api/v1/notifications
   * List authenticated user's notifications with pagination
   */
  getNotifications = asyncHandler(async (req, res) => {
    const result = await notificationService.getUserNotifications(req.user.id, req.query);

    res.status(200).json({
      success: true,
      message: 'Notifications retrieved successfully.',
      data: result,
    });
  });

  /**
   * GET /api/v1/notifications/unread-count
   * Return unread count for badge
   */
  getUnreadCount = asyncHandler(async (req, res) => {
    const result = await notificationService.getUnreadCount(req.user.id);

    res.status(200).json({
      success: true,
      data: result,
    });
  });

  /**
   * PATCH /api/v1/notifications/:id/read
   * Mark a single notification as read
   */
  markAsRead = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const notification = await notificationService.markAsRead(id, req.user.id);

    res.status(200).json({
      success: true,
      message: 'Notification marked as read.',
      data: { notification },
    });
  });

  /**
   * PATCH /api/v1/notifications/read-all
   * Mark all unread notifications of authenticated user as read
   */
  markAllAsRead = asyncHandler(async (req, res) => {
    const result = await notificationService.markAllAsRead(req.user.id);

    res.status(200).json({
      success: true,
      message: result.message,
      data: result,
    });
  });

  /**
   * GET /api/v1/notifications/preferences
   * Retrieve notification preferences for authenticated user
   */
  getPreferences = asyncHandler(async (req, res) => {
    const preferences = await notificationService.getUserPreferences(req.user.id);

    res.status(200).json({
      success: true,
      message: 'Notification preferences retrieved successfully.',
      data: { preferences },
    });
  });

  /**
   * PUT or PATCH /api/v1/notifications/preferences
   * Update notification preferences
   */
  updatePreferences = asyncHandler(async (req, res) => {
    const preferences = await notificationService.updateUserPreferences(req.user.id, req.body);

    res.status(200).json({
      success: true,
      message: 'Notification preferences updated successfully.',
      data: { preferences },
    });
  });

  /**
   * POST /api/v1/notifications/device-token
   * Register or update FCM push notification device token
   */
  registerDeviceToken = asyncHandler(async (req, res) => {
    const { token, deviceType = 'web' } = req.body;
    const result = await notificationService.registerDeviceToken(req.user.id, token, deviceType);

    res.status(200).json({
      success: true,
      message: 'Device token registered successfully for push notifications.',
      data: result,
    });
  });

  /**
   * DELETE or POST /api/v1/notifications/device-token
   * Unregister FCM device token (e.g. on logout)
   */
  unregisterDeviceToken = asyncHandler(async (req, res) => {
    const token = req.body?.token || req.query?.token;
    const result = await notificationService.unregisterDeviceToken(req.user.id, token);

    res.status(200).json({
      success: true,
      message: 'Device token unregistered successfully.',
      data: result,
    });
  });
}

export const notificationController = new NotificationController();
export default notificationController;
