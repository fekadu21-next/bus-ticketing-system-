import { api } from '../services/api';

export const notificationApi = {
  /**
   * Fetch paginated notifications for current user
   */
  getNotifications: async ({ page = 1, limit = 20, unreadOnly = false, type = null } = {}) => {
    const params = { page, limit };
    if (unreadOnly) params.unreadOnly = true;
    if (type) params.type = type;

    const response = await api.get('/notifications', { params });
    return response.data?.data || response.data;
  },

  /**
   * Fetch unread notification count
   */
  getUnreadCount: async () => {
    const response = await api.get('/notifications/unread-count');
    return response.data?.data || response.data;
  },

  /**
   * Mark a single notification as read
   */
  markAsRead: async (id) => {
    const response = await api.patch(`/notifications/${id}/read`);
    return response.data?.data || response.data;
  },

  /**
   * Mark all unread notifications as read
   */
  markAllAsRead: async () => {
    const response = await api.patch('/notifications/read-all');
    return response.data?.data || response.data;
  },
};

export default notificationApi;
