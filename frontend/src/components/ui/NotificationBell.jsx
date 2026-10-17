import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import notificationApi from '../../api/notification.api';
import {
  Bell,
  CheckCheck,
  CheckCircle2,
  XCircle,
  CreditCard,
  AlertTriangle,
  Clock,
  Calendar,
  ShieldCheck,
  AlertOctagon,
  Shield,
  Ticket,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';

export const NotificationBell = ({ variant = 'default' }) => {
  const { isAuthenticated, user, isPassenger, isAdmin, isOperator } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'unread'
  const dropdownRef = useRef(null);

  // Helper for relative timestamps
  const formatTimeAgo = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffSec = Math.floor((now - date) / 1000);

    if (diffSec < 60) return 'Just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  // Type icon mapping
  const getIconForType = (type) => {
    switch (type) {
      case 'BOOKING_CONFIRMED':
        return <Ticket className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case 'BOOKING_CANCELLED':
        return <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />;
      case 'PAYMENT_CONFIRMED':
        return <CreditCard className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case 'PAYMENT_FAILED':
        return <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />;
      case 'TRIP_CANCELLED':
        return <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />;
      case 'TRIP_DELAYED':
        return <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      case 'TRIP_UPDATED':
        return <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
      case 'TICKET_VERIFIED':
        return <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case 'TRIP_PROBLEM_REPORTED':
        return <AlertOctagon className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      case 'ACCOUNT_SECURITY':
        return <Shield className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />;
      default:
        return <Bell className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
    }
  };

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const data = await notificationApi.getUnreadCount();
      setUnreadCount(data.unreadCount || 0);
    } catch (err) {
      // Silently fail polling
    }
  }, [isAuthenticated]);

  // Fetch notifications list
  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    try {
      const data = await notificationApi.getNotifications({
        page: 1,
        limit: 15,
        unreadOnly: activeTab === 'unread',
      });
      setNotifications(data.notifications || []);
    } catch (err) {
      console.warn('Failed to fetch notifications:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, activeTab]);

  // Initial & periodic polling (every 30s)
  useEffect(() => {
    if (!isAuthenticated) return;
    fetchUnreadCount();

    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 30000);

    return () => clearInterval(interval);
  }, [isAuthenticated, fetchUnreadCount]);

  // When dropdown opens or active tab changes, fetch list
  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, activeTab, fetchNotifications]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Mark single as read
  const handleMarkAsRead = async (notification) => {
    if (!notification.isRead) {
      try {
        await notificationApi.markAsRead(notification.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notification.id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      } catch (err) {
        console.warn('Failed to mark notification read:', err);
      }
    }

    // Smart navigation based on metadata and user role
    const meta = notification.metadata || {};
    setIsOpen(false);

    if (meta.bookingId && isPassenger?.()) {
      navigate('/my-bookings');
    } else if (meta.tripId && (isOperator?.() || user?.roles?.includes('BOOKING_COORDINATOR'))) {
      navigate('/operator/trips');
    } else if (meta.tripId && isAdmin?.()) {
      navigate('/admin/trips');
    } else if (meta.reportId && (isOperator?.() || user?.roles?.includes('BOOKING_COORDINATOR'))) {
      navigate('/operator/reports');
    } else {
      navigate('/notifications');
    }
  };

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true, readAt: new Date().toISOString() })));
      setUnreadCount(0);
    } catch (err) {
      console.warn('Failed to mark all notifications read:', err);
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={
          variant === 'header'
            ? 'header-icon-btn relative cursor-pointer'
            : 'relative p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-all duration-200 shadow-sm cursor-pointer'
        }
        aria-label="Notifications"
        title="Notifications"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-rose-600 rounded-full shadow-sm animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 z-50 overflow-hidden flex flex-col max-h-[520px] transition-all">
          {/* Header */}
          <div className="p-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-850/50">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-slate-900 dark:text-white">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1 cursor-pointer transition-colors"
              >
                <CheckCheck size={14} />
                Mark all read
              </button>
            )}
          </div>

          {/* Tab Filter */}
          <div className="flex border-b border-slate-100 dark:border-slate-800 px-3 bg-white dark:bg-slate-900 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`py-2 px-3 border-b-2 transition-colors cursor-pointer ${
                activeTab === 'all'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('unread')}
              className={`py-2 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'unread'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
            >
              Unread
              {unreadCount > 0 && (
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
              )}
            </button>
          </div>

          {/* Notification List */}
          <div className="overflow-y-auto flex-1 divide-y divide-slate-100 dark:divide-slate-800/60">
            {isLoading ? (
              <div className="py-12 flex flex-col items-center justify-center text-slate-400">
                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-2"></div>
                <span className="text-xs">Loading notifications...</span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-12 px-4 text-center flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-2.5">
                  <CheckCircle2 size={20} className="text-emerald-500" />
                </div>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">All caught up!</p>
                <p className="text-xs mt-0.5">
                  {activeTab === 'unread' ? 'No unread notifications.' : 'No notifications yet.'}
                </p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleMarkAsRead(notification)}
                  className={`p-3.5 flex items-start gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors relative ${
                    !notification.isRead ? 'bg-blue-50/40 dark:bg-blue-950/20' : ''
                  }`}
                >
                  {/* Icon badge */}
                  <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 mt-0.5 border border-slate-200/60 dark:border-slate-700/60">
                    {getIconForType(notification.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h5
                        className={`text-xs truncate ${
                          !notification.isRead
                            ? 'font-bold text-slate-900 dark:text-white'
                            : 'font-medium text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {notification.title}
                      </h5>
                      <span className="text-[10px] text-slate-400 shrink-0 font-medium">
                        {formatTimeAgo(notification.createdAt)}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {notification.message}
                    </p>
                  </div>

                  {/* Unread indicator */}
                  {!notification.isRead && (
                    <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0 mt-1.5 shadow-sm"></span>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 text-center">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                navigate('/notifications');
              }}
              className="w-full py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center justify-center gap-1 cursor-pointer transition-colors"
            >
              View all notifications
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
