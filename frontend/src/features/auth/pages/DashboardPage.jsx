import React from 'react';
import { Link } from 'react-router-dom';
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
} from 'lucide-react';

const ROLE_BADGE_CONFIG = {
  [ROLES.ADMIN]: { label: 'Admin (Platform)', color: '#ef4444', bg: '#fef2f2', border: '#fca5a5' },
  PLATFORM_ADMIN: { label: 'Platform Admin', color: '#ef4444', bg: '#fef2f2', border: '#fca5a5' },
  [ROLES.BOOKING_COORDINATOR]: { label: 'Booking Coordinator', color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' },
  OPERATIONAL_MANAGER: { label: 'Operational Manager', color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' },
  [ROLES.TICKET_VERIFIER]: { label: 'Ticket Verifier', color: '#8b5cf6', bg: '#f5f3ff', border: '#ddd6fe' },
  [ROLES.PASSENGER]: { label: 'Passenger', color: '#059669', bg: '#ecfdf5', border: '#a7f3d0' },
};

export const DashboardPage = () => {
  const { user } = useAuth();
  const { t } = useTranslation();

  const displayName = [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim() ||
    user?.name ||
    (user?.email ? user.email.split('@')[0] : 'User');

  const userRoles = Array.isArray(user?.roles) ? user.roles : [ROLES.PASSENGER];
  const isEmailVerified = user?.isEmailVerified ?? user?.emailVerified ?? false;

  return (
    <main className="main-content" style={{ maxWidth: '1080px', margin: '0 auto', padding: '36px 20px' }}>
      {/* Welcome Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '8px', color: 'var(--color-text)' }}>
          {t('dashboard.title', { name: displayName })}
        </h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '1rem', margin: 0 }}>
          {t('dashboard.subtitle', 'Your centralized authenticated portal for BusTicket system.')}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', marginBottom: '28px' }}>
        {/* Account & Role Overview Card */}
        <div className="card" style={{ padding: '24px', borderRadius: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                backgroundColor: 'rgba(37, 99, 235, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                border: '2px solid var(--color-primary, #2563eb)',
                flexShrink: 0,
              }}
            >
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={displayName}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <User size={28} color="var(--color-primary, #2563eb)" />
              )}
            </div>

            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 4px 0', color: 'var(--color-text)' }}>
                {displayName}
              </h2>
              <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                {user?.email}
              </p>
              {user?.phone && (
                <p style={{ margin: '2px 0 0 0', fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                  {user.phone}
                </p>
              )}
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '16px' }}>
            {/* Roles */}
            <div style={{ marginBottom: '14px' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text-muted)', display: 'block', marginBottom: '8px' }}>
                {t('dashboard.rolesLabel', 'Assigned Roles')}:
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {userRoles.map((role) => {
                  const config = ROLE_BADGE_CONFIG[role] || { label: role, color: '#4b5563', bg: '#f3f4f6', border: '#e5e7eb' };
                  return (
                    <span
                      key={role}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '20px',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        backgroundColor: config.bg,
                        color: config.color,
                        border: `1px solid ${config.border}`,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                      }}
                    >
                      <ShieldCheck size={13} />
                      {config.label}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Statuses */}
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '0.85rem' }}>
              <div>
                <span style={{ color: 'var(--color-text-muted)', marginRight: '6px' }}>
                  {t('dashboard.statusLabel', 'Status')}:
                </span>
                <span style={{ color: '#059669', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <CheckCircle2 size={14} /> {t('common.active', 'Active')}
                </span>
              </div>
              <div>
                <span style={{ color: 'var(--color-text-muted)', marginRight: '6px' }}>
                  {t('dashboard.emailStatusLabel', 'Email')}:
                </span>
                {isEmailVerified ? (
                  <span style={{ color: '#059669', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <CheckCircle2 size={14} /> {t('common.verified', 'Verified')}
                  </span>
                ) : (
                  <span style={{ color: '#d97706', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={14} /> {t('common.unverified', 'Pending Verification')}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Integration Notice Entry Point Card */}
        <div
          className="card"
          style={{
            padding: '24px',
            borderRadius: '12px',
            borderLeft: '4px solid var(--color-primary, #2563eb)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(37, 99, 235, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-primary, #2563eb)',
                }}
              >
                <Info size={20} />
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: 'var(--color-text)' }}>
                {t('dashboard.integrationNoticeTitle', 'Operations Management Portal')}
              </h3>
            </div>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.92rem', lineHeight: 1.6, margin: 0 }}>
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

          <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--color-border)' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
              Active Session Scope: {userRoles.join(', ')}
            </span>
          </div>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '16px', color: 'var(--color-text)' }}>
          {t('dashboard.quickNavTitle', 'Quick Actions')}
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
          <Link
            to="/profile"
            className="card"
            style={{
              padding: '20px',
              borderRadius: '12px',
              textDecoration: 'none',
              transition: 'transform 0.2s, box-shadow 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(37, 99, 235, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-primary, #2563eb)',
                }}
              >
                <User size={20} />
              </div>
              <div>
                <h4 style={{ margin: '0 0 2px 0', fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-text)' }}>
                  {t('dashboard.goToProfile', 'View & Edit Profile')}
                </h4>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                  Manage details and photo
                </p>
              </div>
            </div>
            <ArrowRight size={18} color="var(--color-text-muted)" />
          </Link>

          <Link
            to="/change-password"
            className="card"
            style={{
              padding: '20px',
              borderRadius: '12px',
              textDecoration: 'none',
              transition: 'transform 0.2s, box-shadow 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#059669',
                }}
              >
                <KeyRound size={20} />
              </div>
              <div>
                <h4 style={{ margin: '0 0 2px 0', fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-text)' }}>
                  {t('dashboard.goToChangePassword', 'Security Settings')}
                </h4>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                  Update your password
                </p>
              </div>
            </div>
            <ArrowRight size={18} color="var(--color-text-muted)" />
          </Link>

          <Link
            to="/search-trips"
            className="card"
            style={{
              padding: '20px',
              borderRadius: '12px',
              textDecoration: 'none',
              transition: 'transform 0.2s, box-shadow 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(245, 158, 11, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#d97706',
                }}
              >
                <Search size={20} />
              </div>
              <div>
                <h4 style={{ margin: '0 0 2px 0', fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-text)' }}>
                  {t('dashboard.goToSearchTrips', 'Search Bus Trips')}
                </h4>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                  Find routes & departure schedules
                </p>
              </div>
            </div>
            <ArrowRight size={18} color="var(--color-text-muted)" />
          </Link>
        </div>
      </div>
    </main>
  );
};

export default DashboardPage;
