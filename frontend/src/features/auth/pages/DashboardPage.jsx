import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { ROLES } from '@/constants/roles';
import {
  User,
  ShieldCheck,
  Building2,
  CheckCircle2,
  Clock,
  Search,
  KeyRound,
  ArrowRight,
  Info,
  LogOut,
  Ticket,
} from 'lucide-react';

const ROLE_BADGE_CONFIG = {
  [ROLES.ADMIN]: { label: 'Admin (Platform)', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-200 dark:border-red-800' },
  PLATFORM_ADMIN: { label: 'Platform Admin', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-200 dark:border-red-800' },
  [ROLES.BOOKING_COORDINATOR]: { label: 'Booking Coordinator', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-800' },
  OPERATIONAL_MANAGER: { label: 'Operational Manager', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-800' },
  [ROLES.TICKET_VERIFIER]: { label: 'Ticket Verifier', color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/20', border: 'border-purple-200 dark:border-purple-800' },
  [ROLES.PASSENGER]: { label: 'Passenger', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20', border: 'border-green-200 dark:border-green-800' },
};

export const DashboardPage = () => {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const displayName = [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim() ||
    user?.name ||
    (user?.email ? user.email.split('@')[0] : 'User');

  const userRoles = Array.isArray(user?.roles) ? user.roles : [ROLES.PASSENGER];
  const isEmailVerified = user?.isEmailVerified ?? user?.emailVerified ?? false;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <main className="max-w-6xl mx-auto px-5 py-9">
      {/* Welcome Header */}
      <div className="mb-7">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2">
          {t('dashboard.title', { name: displayName })}
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-base">
          {t('dashboard.subtitle', 'Your centralized authenticated portal for BusTicket system.')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 mb-7">
        {/* Account & Role Overview Card */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
          <div className="flex items-center gap-4 mb-5">
            <div className="w-14 h-14 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center overflow-hidden border-2 border-blue-600 dark:border-blue-400 flex-shrink-0">
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={displayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User size={28} className="text-blue-600 dark:text-blue-400" />
              )}
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
                {displayName}
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {user?.email}
              </p>
              {user?.phone && (
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  {user.phone}
                </p>
              )}
            </div>
          </div>

          <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
            {/* Roles */}
            <div className="mb-3.5">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-2">
                {t('dashboard.rolesLabel', 'Assigned Roles')}:
              </span>
              <div className="flex flex-wrap gap-2">
                {userRoles.map((role) => {
                  const config = ROLE_BADGE_CONFIG[role] || { label: role, color: 'text-slate-600 dark:text-slate-400', bg: 'bg-slate-100 dark:bg-slate-800', border: 'border-slate-300 dark:border-slate-600' };
                  return (
                    <span
                      key={role}
                      className={`px-2.5 py-1 rounded-full text-xs font-bold ${config.bg} ${config.color} ${config.border} border inline-flex items-center gap-1.5`}
                    >
                      <ShieldCheck size={13} />
                      {config.label}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Statuses */}
            <div className="flex gap-4 flex-wrap text-sm">
              <div>
                <span className="text-slate-500 dark:text-slate-400 mr-1.5">
                  {t('dashboard.statusLabel', 'Status')}:
                </span>
                <span className="text-green-600 dark:text-green-400 font-semibold inline-flex items-center gap-1">
                  <CheckCircle2 size={14} /> {t('common.active', 'Active')}
                </span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 mr-1.5">
                  {t('dashboard.emailStatusLabel', 'Email')}:
                </span>
                {isEmailVerified ? (
                  <span className="text-green-600 dark:text-green-400 font-semibold inline-flex items-center gap-1">
                    <CheckCircle2 size={14} /> {t('common.verified', 'Verified')}
                  </span>
                ) : (
                  <span className="text-amber-600 dark:text-amber-400 font-semibold inline-flex items-center gap-1">
                    <Clock size={14} /> {t('common.unverified', 'Pending Verification')}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Integration Notice Entry Point Card */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 border-l-4 border-l-blue-600 dark:border-l-blue-400 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <Info size={20} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {t('dashboard.integrationNoticeTitle', 'Dashboard Entry Point')}
              </h3>
            </div>
            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
              {t(
                'dashboard.integrationNoticeDesc',
                'Access your role-specific dashboard, interactive sidebar controls, fleet management, trip scheduling, bookings, payments, and system settings.'
              )}
            </p>
            <div style={{ marginTop: '16px' }}>
              <Link
                to="/portal"
                className="btn btn-primary"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 18px',
                  borderRadius: '8px',
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                Launch Management Console <ArrowRight size={16} />
              </Link>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-700">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Next step: Operational dashboards will be activated in the next development milestone.
            </span>
          </div>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div>
        <h3 className="text-lg font-bold mb-4 text-slate-900 dark:text-white">
          Passenger Dashboard
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link
            to="/profile"
            className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-5 no-underline transition-transform duration-200 hover:shadow-md flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <User size={20} />
              </div>
              <div>
                <h4 className="m-0 mb-0.5 text-sm font-bold text-slate-900 dark:text-white">
                  My Profile
                </h4>
                <p className="m-0 text-xs text-slate-600 dark:text-slate-400">
                  View and update profile info
                </p>
              </div>
            </div>
            <ArrowRight size={18} className="text-slate-400" />
          </Link>

          <Link
            to="/my-bookings"
            className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-5 no-underline transition-transform duration-200 hover:shadow-md flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-50 dark:bg-green-900/20 flex items-center justify-center text-green-600 dark:text-green-400">
                <Ticket size={20} />
              </div>
              <div>
                <h4 className="m-0 mb-0.5 text-sm font-bold text-slate-900 dark:text-white">
                  My Bookings
                </h4>
                <p className="m-0 text-xs text-slate-600 dark:text-slate-400">
                  View past and upcoming bookings
                </p>
              </div>
            </div>
            <ArrowRight size={18} className="text-slate-400" />
          </Link>

          <button
            onClick={handleLogout}
            className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-5 transition-transform duration-200 hover:shadow-md flex items-center justify-between w-full cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-600 dark:text-red-400">
                <LogOut size={20} />
              </div>
              <div>
                <h4 className="m-0 mb-0.5 text-sm font-bold text-slate-900 dark:text-white">
                  Logout
                </h4>
                <p className="m-0 text-xs text-slate-600 dark:text-slate-400">
                  Sign out of your account
                </p>
              </div>
            </div>
            <ArrowRight size={18} className="text-slate-400" />
          </button>
        </div>
      </div>
    </main>
  );
};

export default DashboardPage;
