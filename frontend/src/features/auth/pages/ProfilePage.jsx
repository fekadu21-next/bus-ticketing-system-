import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { ROLES } from '@/constants/roles';
import {
  User,
  Shield,
  Building2,
  CheckCircle,
  AlertCircle,
  KeyRound,
  LogOut,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Mail,
  Phone,
} from 'lucide-react';

export const ProfilePage = () => {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isWelcome = searchParams.get('welcome') === 'true';

  const [permissionsExpanded, setPermissionsExpanded] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case ROLES.PLATFORM_ADMIN:
        return 'badge-admin';
      case ROLES.OPERATIONAL_MANAGER:
        return 'badge-manager';
      case ROLES.TICKET_VERIFIER:
        return 'badge-verifier';
      case ROLES.PASSENGER:
        return 'badge-passenger';
      default:
        return 'badge-neutral';
    }
  };

  const initials = `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`.toUpperCase() || 'U';

  return (
    <div className="main-content">
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {/* Welcome State if user just logged in */}
        {isWelcome && (
          <div className="profile-welcome-banner">
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                backgroundColor: 'var(--color-primary-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-primary)',
                flexShrink: 0,
              }}
            >
              <Sparkles size={24} />
            </div>
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-text)', marginBottom: 2 }}>
                {t('profile.welcomeTitle')}
              </h2>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                {t('profile.welcomeSubtitle')}
              </p>
            </div>
          </div>
        )}

        {/* Top Header with Avatar & Quick Actions */}
        <div
          className="card"
          style={{
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '18px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
            <div className="profile-avatar">{initials}</div>
            <div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '2px' }}>
                {user?.firstName} {user?.lastName}
              </h1>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                {user?.email}
              </p>
              <div style={{ display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
                {user?.roles?.map((role) => (
                  <span key={role} className={`badge ${getRoleBadgeClass(role)}`}>
                    {role}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <Link to="/change-password" className="btn btn-secondary btn-sm">
              <KeyRound size={15} /> {t('profile.changePasswordBtn')}
            </Link>
            <button onClick={handleLogout} className="btn btn-ghost btn-sm" title={t('profile.signOutBtn')}>
              <LogOut size={15} /> {t('profile.signOutBtn')}
            </button>
          </div>
        </div>

        {/* Personal Details Card */}
        <div className="card" style={{ marginBottom: '24px' }}>
          <div className="card-header">
            <h2 className="card-title">
              <User size={18} color="var(--color-primary)" />
              {t('profile.personalInfo')}
            </h2>
            <span className={`badge ${user?.isActive ? 'badge-verifier' : 'badge-admin'}`}>
              {user?.isActive ? t('profile.activeAccount') : t('profile.suspended')}
            </span>
          </div>

          <div className="data-grid">
            <div className="data-row">
              <span className="data-label">{t('profile.fullName')}</span>
              <span className="data-value">{user?.firstName} {user?.lastName}</span>
            </div>

            <div className="data-row">
              <span className="data-label">{t('profile.emailAddress')}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="data-value">{user?.email}</span>
                {user?.emailVerified ? (
                  <span style={{ color: 'var(--color-success)', display: 'inline-flex', alignItems: 'center', gap: 2, fontSize: '0.78rem', fontWeight: 600 }}>
                    <CheckCircle size={13} /> {t('profile.verified')}
                  </span>
                ) : (
                  <span style={{ color: 'var(--color-warning)', display: 'inline-flex', alignItems: 'center', gap: 2, fontSize: '0.78rem', fontWeight: 600 }}>
                    <AlertCircle size={13} /> {t('profile.unverified')}
                  </span>
                )}
              </div>
            </div>

            <div className="data-row">
              <span className="data-label">{t('profile.phoneNumber')}</span>
              <span className="data-value">{user?.phone || t('profile.notProvided')}</span>
            </div>
          </div>
        </div>

        {/* Roles & System Access Card */}
        <div className="card" style={{ marginBottom: '24px' }}>
          <div className="card-header">
            <h2 className="card-title">
              <Shield size={18} color="var(--color-primary)" />
              {t('profile.rolesAccess')}
            </h2>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <span className="data-label" style={{ display: 'block', marginBottom: '8px' }}>
              {t('profile.assignedRoles')}
            </span>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {user?.roles?.map((role) => (
                <span key={role} className={`badge ${getRoleBadgeClass(role)}`}>
                  {role}
                </span>
              ))}
            </div>
          </div>

          {/* Operational Organization Context */}
          {user?.organizationContext && user.organizationContext.length > 0 && (
            <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--color-border)' }}>
              <span className="data-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                <Building2 size={15} color="var(--color-primary)" />
                {t('profile.orgContext')}
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {user.organizationContext.map((org, idx) => (
                  <div
                    key={idx}
                    style={{
                      backgroundColor: 'var(--color-bg)',
                      padding: '12px 16px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--color-border)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '8px',
                    }}
                  >
                    <div>
                      <p style={{ fontWeight: 700, color: 'var(--color-text)', fontSize: '0.95rem' }}>
                        {org.organizationName || 'Assigned Organization'}
                      </p>
                      <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
                        {t('profile.orgId')}: <code>{org.organizationId}</code>
                      </p>
                    </div>
                    <span className="badge badge-manager">{org.role}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Permissions Accordion */}
          {user?.permissions && user.permissions.length > 0 && (
            <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--color-border)' }}>
              <button
                type="button"
                className="collapsible-trigger"
                onClick={() => setPermissionsExpanded((prev) => !prev)}
              >
                <span>
                  {t('profile.activePermissions')} ({user.permissions.length})
                </span>
                {permissionsExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>

              {permissionsExpanded && (
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '12px' }}>
                  {user.permissions.map((perm) => (
                    <span key={perm} className="permission-chip">
                      {perm}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
