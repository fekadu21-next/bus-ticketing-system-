import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
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
  Building,
  Bus,
  Navigation,
  Settings,
  Mail,
  Smartphone,
  Check,
} from 'lucide-react';

export const NotificationsPage = () => {
  const { isAuthenticated, isPassenger, isAdmin, isOperator, user } = useAuth();
  const { preferences, updatePreferences, isSocketConnected } = useNotifications();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [filterUnread, setFilterUnread] = useState(false);
  const [filterType, setFilterType] = useState('ALL');
  const [showSettings, setShowSettings] = useState(false);
  const [prefForm, setPrefForm] = useState({
    emailEnabled: true,
    pushEnabled: true,
    inAppEnabled: true,
  });
  const [isSavingPrefs, setIsSavingPrefs] = useState(false);
  const [prefSaveSuccess, setPrefSaveSuccess] = useState(false);

  useEffect(() => {
    if (preferences) {
      setPrefForm({
        emailEnabled: preferences.emailEnabled !== false,
        pushEnabled: preferences.pushEnabled !== false,
        inAppEnabled: preferences.inAppEnabled !== false,
      });
    }
  }, [preferences]);

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
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true, readAt: new Date().toISOString() }))
      );
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const handleSavePreferences = async () => {
    setIsSavingPrefs(true);
    setPrefSaveSuccess(false);
    try {
      await updatePreferences(prefForm);
      setPrefSaveSuccess(true);
      setTimeout(() => setPrefSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save preferences:', err);
    } finally {
      setIsSavingPrefs(false);
    }
  };

  const getIconForType = (type) => {
    switch (type) {
      case 'BOOKING_CONFIRMED':
      case 'NEW_BOOKING':
        return <Ticket className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />;
      case 'QR_TICKET_ISSUED':
        return <Ticket className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
      case 'BOOKING_CANCELLED':
        return <XCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" />;
      case 'PAYMENT_CONFIRMED':
      case 'PAYMENT_SUCCESS':
        return <CreditCard className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />;
      case 'PAYMENT_FAILED':
      case 'PAYMENT_STATUS_CHANGED':
        return <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400" />;
      case 'TRIP_CANCELLED':
        return <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400" />;
      case 'TRIP_DELAYED':
      case 'TRIP_RESCHEDULED':
      case 'TRIP_SCHEDULE_CHANGED':
        return <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />;
      case 'TRIP_UPDATED':
      case 'TRIP_ASSIGNED':
      case 'TRIP_REASSIGNED':
      case 'VERIFIER_TRIP_ASSIGNED':
      case 'VERIFIER_TRIP_REASSIGNED':
        return <Calendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />;
      case 'BUS_CHANGED':
        return <Bus className="w-5 h-5 text-amber-600 dark:text-amber-400" />;
      case 'ROUTE_CHANGED':
        return <Navigation className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />;
      case 'TICKET_VERIFIED':
      case 'VERIFICATION_UPDATE':
        return <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />;
      case 'NEW_ORGANIZATION_REGISTRATION':
      case 'ORGANIZATION_APPROVAL_REQUEST':
      case 'ORGANIZATION_APPROVED':
        return <Building className="w-5 h-5 text-purple-600 dark:text-purple-400" />;
      case 'ORGANIZATION_REJECTED':
        return <XCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" />;
      case 'TRIP_PROBLEM_REPORTED':
      case 'DRIVER_PROBLEM_REPORT':
      case 'CRITICAL_PLATFORM_ISSUE':
        return <AlertOctagon className="w-5 h-5 text-red-600 dark:text-red-400" />;
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
              {isSocketConnected && (
                <span className="flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-semibold rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Live
                </span>
              )}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Stay updated with your bookings, trip schedule changes, payments, and operational alerts.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowSettings(!showSettings)}
              className="px-3.5 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm"
            >
              <Settings size={15} />
              Preferences
            </button>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:hover:bg-blue-900/80 dark:text-blue-300 border border-blue-200 dark:border-blue-800 flex items-center gap-2 cursor-pointer transition-colors shadow-sm"
              >
                <CheckCheck size={16} />
                Mark all as read
              </button>
            )}
          </div>
        </div>

        {/* Preferences Drawer */}
        {showSettings && (
          <div className="mb-6 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Settings size={16} className="text-blue-600 dark:text-blue-400" />
                Notification Channels & Preferences
              </h3>
              {prefSaveSuccess && (
                <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <Check size={14} /> Saved successfully
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              {/* In-App Notifications */}
              <label className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 cursor-pointer hover:border-blue-400 transition-colors">
                <div className="flex items-center gap-2.5">
                  <Bell size={18} className="text-blue-600 dark:text-blue-400" />
                  <div>
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200">In-App & Socket.IO</div>
                    <div className="text-[11px] text-slate-500">Live notifications badge</div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={prefForm.inAppEnabled}
                  onChange={(e) => setPrefForm({ ...prefForm, inAppEnabled: e.target.checked })}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                />
              </label>

              {/* Push Notifications */}
              <label className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 cursor-pointer hover:border-blue-400 transition-colors">
                <div className="flex items-center gap-2.5">
                  <Smartphone size={18} className="text-purple-600 dark:text-purple-400" />
                  <div>
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200">Push (FCM)</div>
                    <div className="text-[11px] text-slate-500">Mobile & browser alerts</div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={prefForm.pushEnabled}
                  onChange={(e) => setPrefForm({ ...prefForm, pushEnabled: e.target.checked })}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                />
              </label>

              {/* Email Notifications */}
              <label className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 cursor-pointer hover:border-blue-400 transition-colors">
                <div className="flex items-center gap-2.5">
                  <Mail size={18} className="text-emerald-600 dark:text-emerald-400" />
                  <div>
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200">Email Dispatches</div>
                    <div className="text-[11px] text-slate-500">Confirmations & changes</div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={prefForm.emailEnabled}
                  onChange={(e) => setPrefForm({ ...prefForm, emailEnabled: e.target.checked })}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                />
              </label>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                disabled={isSavingPrefs}
                onClick={handleSavePreferences}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 cursor-pointer transition-colors shadow-sm"
              >
                {isSavingPrefs ? 'Saving...' : 'Save Preferences'}
              </button>
            </div>
          </div>
        )}

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
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
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
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                filterUnread
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              Unread Only
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <Filter size={14} />
            <select
              value={filterType}
              onChange={(e) => {
                setFilterType(e.target.value);
                setPage(1);
              }}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              <option value="ALL">All Event Types</option>
              <option value="BOOKING_CONFIRMED">Booking Confirmed</option>
              <option value="PAYMENT_SUCCESS">Payment Success</option>
              <option value="QR_TICKET_ISSUED">QR Ticket Issued</option>
              <option value="TRIP_CANCELLED">Trip Cancelled</option>
              <option value="TRIP_DELAYED">Trip Rescheduled / Delayed</option>
              <option value="TRIP_ASSIGNED">Trip Assigned</option>
              <option value="BUS_CHANGED">Bus Changed</option>
              <option value="TICKET_VERIFIED">Ticket Verified</option>
              <option value="NEW_ORGANIZATION_REGISTRATION">Org Registration</option>
              <option value="CRITICAL_PLATFORM_ISSUE">Critical Issue</option>
            </select>
          </div>
        </div>

        {/* Notifications List */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800/80 shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center text-slate-400">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-sm font-medium">Loading notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3 text-slate-400">
                <Bell size={28} />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">No notifications found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {filterUnread
                  ? "You don't have any unread notifications at the moment."
                  : 'You have no notifications yet. Important updates and alerts will appear here.'}
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
