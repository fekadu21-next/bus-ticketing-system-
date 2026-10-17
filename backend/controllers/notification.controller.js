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
}

export const notificationController = new NotificationController();
export default notificationController;
