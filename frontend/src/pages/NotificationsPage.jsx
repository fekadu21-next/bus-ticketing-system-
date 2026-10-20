import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import notificationApi from '../api/notification.api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
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
  ChevronLeft,
  ChevronRight,
  Filter,
} from 'lucide-react';

export const NotificationsPage = () => {
  const { isAuthenticated, isPassenger, isAdmin, isOperator, user } = useAuth();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [filterUnread, setFilterUnread] = useState(false);
  const [filterType, setFilterType] = useState('ALL');

  const fetchUnreadCount = useCallback(async () => {
    try {
      const data = await notificationApi.getUnreadCount();
      setUnreadCount(data.unreadCount || 0);
    } catch {
      // ignore
    }
  }, []);

  const loadNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await notificationApi.getNotifications({
        page,
        limit: 10,
        unreadOnly: filterUnread,
        type: filterType !== 'ALL' ? filterType : null,
      });

      setNotifications(data.notifications || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setIsLoading(false);
    }
  }, [page, filterUnread, filterType]);

  useEffect(() => {
    if (isAuthenticated) {
      loadNotifications();
      fetchUnreadCount();
    }
  }, [isAuthenticated, loadNotifications, fetchUnreadCount]);

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

    const meta = notification.metadata || {};
    if (meta.bookingId && isPassenger?.()) {
      navigate('/my-bookings');
    } else if (meta.tripId && (isOperator?.() || user?.roles?.includes('BOOKING_COORDINATOR'))) {
      navigate('/operator/trips');
    } else if (meta.tripId && isAdmin?.()) {
      navigate('/admin/trips');
    } else if (meta.reportId && (isOperator?.() || user?.roles?.includes('BOOKING_COORDINATOR'))) {
      navigate('/operator/reports');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true, readAt: new Date().toISOString() })));
      setUnreadCount(0);
    } catch (err) {
      console.warn('Failed to mark all as read:', err);
    }
  };

  const getIconForType = (type) => {
    switch (type) {
      case 'BOOKING_CONFIRMED':
        return <Ticket className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />;
      case 'BOOKING_CANCELLED':
        return <XCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" />;
      case 'PAYMENT_CONFIRMED':
        return <CreditCard className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />;
      case 'PAYMENT_FAILED':
        return <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400" />;
      case 'TRIP_CANCELLED':
        return <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400" />;
      case 'TRIP_DELAYED':
        return <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />;
      case 'TRIP_UPDATED':
        return <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
      case 'TICKET_VERIFIED':
        return <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />;
      case 'TRIP_PROBLEM_REPORTED':
        return <AlertOctagon className="w-5 h-5 text-amber-600 dark:text-amber-400" />;
      case 'ACCOUNT_SECURITY':
        return <Shield className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />;
      default:
        return <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 sm:px-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
              <Bell className="text-blue-600 dark:text-blue-400" size={24} />
              Notifications
              {unreadCount > 0 && (
                <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300">
                  {unreadCount} unread
                </span>
              )}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Stay updated with your bookings, trip schedule changes, payments, and account alerts.
            </p>
          </div>

          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllAsRead}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:hover:bg-blue-900/80 dark:text-blue-300 border border-blue-200 dark:border-blue-800 flex items-center gap-2 cursor-pointer transition-colors shadow-sm self-start sm:self-auto"
            >
              <CheckCheck size={16} />
              Mark all as read
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setFilterUnread(false);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                !filterUnread
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              All Notifications
            </button>
            <button
              type="button"
              onClick={() => {
                setFilterUnread(true);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                filterUnread
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              Unread
              {unreadCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              )}
            </button>
          </div>

          {/* Type Filter */}
          <div className="flex items-center gap-2 text-xs">
            <Filter size={14} className="text-slate-400" />
            <select
              value={filterType}
              onChange={(e) => {
                setFilterType(e.target.value);
                setPage(1);
              }}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-200 font-medium cursor-pointer"
            >
              <option value="ALL">All Types</option>
              <option value="BOOKING_CONFIRMED">Bookings</option>
              <option value="PAYMENT_CONFIRMED">Payments</option>
              <option value="TRIP_CANCELLED">Trip Cancellations</option>
              <option value="TRIP_DELAYED">Trip Delays</option>
              <option value="TICKET_VERIFIED">Ticket Verifications</option>
              <option value="ACCOUNT_SECURITY">Security</option>
            </select>
          </div>
        </div>

        {/* Notifications List */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm divide-y divide-slate-100 dark:divide-slate-800/80 overflow-hidden">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400">
              <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
              <span className="text-sm font-medium">Loading notifications...</span>
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-20 px-4 text-center flex flex-col items-center justify-center text-slate-400">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3 text-slate-400 dark:text-slate-500">
                <CheckCircle2 size={28} className="text-emerald-500" />
              </div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">No notifications found</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">
                {filterUnread
                  ? "You don't have any unread notifications. Check back later!"
                  : "You don't have any notifications at the moment."}
              </p>
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => handleMarkAsRead(notification)}
                className={`p-4 sm:p-5 flex items-start gap-4 transition-colors cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-850/60 ${
                  !notification.isRead ? 'bg-blue-50/30 dark:bg-blue-950/20' : ''
                }`}
              >
                {/* Type Icon */}
                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 border border-slate-200/60 dark:border-slate-700/60 mt-0.5">
                  {getIconForType(notification.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                    <h4
                      className={`text-sm ${
                        !notification.isRead
                          ? 'font-bold text-slate-900 dark:text-white'
                          : 'font-semibold text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {notification.title}
                    </h4>
                    <span className="text-xs text-slate-400 font-medium shrink-0">
                      {new Date(notification.createdAt).toLocaleString()}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {notification.message}
                  </p>
                </div>

                {/* Read indicator */}
                {!notification.isRead && (
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0 mt-2 shadow-sm" title="Unread"></span>
                )}
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 px-2">
            <span className="text-xs text-slate-500 font-medium">
              Page {page} of {totalPages} ({total} total)
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1 cursor-pointer transition-colors"
              >
                <ChevronLeft size={14} />
                Previous
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1 cursor-pointer transition-colors"
              >
                Next
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default NotificationsPage;
