import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { notificationApi } from '../api/notification.api';
import { getAccessToken } from '../services/api';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [preferences, setPreferences] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const socketRef = useRef(null);

  // 1. Fetch unread count from API
  const fetchUnreadCount = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const data = await notificationApi.getUnreadCount();
      setUnreadCount(data.unreadCount || 0);
    } catch (err) {
      // Quietly handle
    }
  }, [isAuthenticated]);

  // 2. Fetch notifications list
  const fetchNotifications = useCallback(
    async ({ page = 1, limit = 20, unreadOnly = false, type = null } = {}) => {
      if (!isAuthenticated) return { notifications: [], total: 0 };
      setIsLoading(true);
      try {
        const data = await notificationApi.getNotifications({ page, limit, unreadOnly, type });
        setNotifications(data.notifications || []);
        return data;
      } catch (err) {
        console.warn('Failed to fetch notifications:', err);
        return { notifications: [], total: 0 };
      } finally {
        setIsLoading(false);
      }
    },
    [isAuthenticated]
  );

  // 3. Mark single notification as read
  const markAsRead = useCallback(async (id) => {
    try {
      const result = await notificationApi.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      return result;
    } catch (err) {
      console.warn('Failed to mark notification as read:', err);
      throw err;
    }
  }, []);

  // 4. Mark all as read
  const markAllAsRead = useCallback(async () => {
    try {
      const result = await notificationApi.markAllAsRead();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true, readAt: new Date().toISOString() }))
      );
      setUnreadCount(0);
      return result;
    } catch (err) {
      console.warn('Failed to mark all as read:', err);
      throw err;
    }
  }, []);

  // 5. Fetch notification preferences
  const fetchPreferences = useCallback(async () => {
    if (!isAuthenticated) return null;
    try {
      const data = await notificationApi.getPreferences();
      setPreferences(data.preferences || data);
      return data.preferences || data;
    } catch (err) {
      console.warn('Failed to fetch notification preferences:', err);
      return null;
    }
  }, [isAuthenticated]);

  // 6. Update notification preferences
  const updatePreferences = useCallback(async (newPrefs) => {
    try {
      const data = await notificationApi.updatePreferences(newPrefs);
      const updated = data.preferences || data;
      setPreferences(updated);
      return updated;
    } catch (err) {
      console.warn('Failed to update notification preferences:', err);
      throw err;
    }
  }, []);

  // 7. Register FCM push token
  const registerPushToken = useCallback(async (token, deviceType = 'web') => {
    try {
      return await notificationApi.registerDeviceToken(token, deviceType);
    } catch (err) {
      console.warn('Failed to register push token:', err);
    }
  }, []);

  // 8. Setup Real-time Socket.IO Connection
  useEffect(() => {
    if (!isAuthenticated) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsSocketConnected(false);
      }
      setUnreadCount(0);
      setNotifications([]);
      return;
    }

    const token = getAccessToken();
    if (!token) return;

    // Connect to Socket.IO backend
    const socket = io({
      path: '/socket.io',
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsSocketConnected(true);
    });

    socket.on('disconnect', () => {
      setIsSocketConnected(false);
    });

    // Real-time new notification received
    socket.on('notification:new', (newNotif) => {
      setNotifications((prev) => [newNotif, ...prev]);
      setUnreadCount((prev) => prev + 1);

      // Trigger Web Notification API if permitted
      if ('Notification' in window && Notification.permission === 'granted') {
        try {
          new Notification(newNotif.title || 'New Notification', {
            body: newNotif.message,
            icon: '/logo.png',
          });
        } catch (e) {
          // ignore
        }
      }
    });

    // Real-time unread count sync
    socket.on('notification:unread_count', (payload) => {
      if (typeof payload?.unreadCount === 'number') {
        setUnreadCount(payload.unreadCount);
      }
    });

    // Real-time read sync
    socket.on('notification:read', (payload) => {
      if (payload?.notificationId) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === payload.notificationId ? { ...n, isRead: true } : n))
        );
      }
    });

    // Real-time read all sync
    socket.on('notification:read_all', () => {
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    });

    // Initial fetch of unread count and preferences
    fetchUnreadCount();
    fetchPreferences();

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setIsSocketConnected(false);
    };
  }, [isAuthenticated, user?.id, fetchUnreadCount, fetchPreferences]);

  const value = {
    unreadCount,
    notifications,
    preferences,
    isLoading,
    isSocketConnected,
    fetchUnreadCount,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    fetchPreferences,
    updatePreferences,
    registerPushToken,
  };

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export default NotificationContext;
