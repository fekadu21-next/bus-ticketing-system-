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
  Camera,
  Upload,
  Trash2,
} from 'lucide-react';

export const ProfilePage = () => {
  const { user, logout, updateUserAvatar } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isWelcome = searchParams.get('welcome') === 'true';

  const [permissionsExpanded, setPermissionsExpanded] = useState(false);
  const [photoMessage, setPhotoMessage] = useState(null);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case ROLES.PLATFORM_ADMIN:
      case ROLES.ADMIN:
        return 'badge-admin';
      case ROLES.OPERATIONAL_MANAGER:
      case ROLES.BOOKING_COORDINATOR:
        return 'badge-manager';
      case ROLES.TICKET_VERIFIER:
        return 'badge-verifier';
      case ROLES.PASSENGER:
        return 'badge-passenger';
      default:
        return 'badge-neutral';
    }
  };

  // Proper user display name
  const userDisplayName =
    [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim() ||
    user?.name ||
    (user?.email ? user.email.split('@')[0] : 'User');

  const initials = `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`.toUpperCase() || 'U';

  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type
    if (!file.type.startsWith('image/')) {
      setPhotoMessage({
        type: 'error',
        text: t('profile.photo.errorType', 'Please upload a valid image file (PNG, JPG, or WEBP).'),
      });
      return;
    }

    // Validate size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setPhotoMessage({
        type: 'error',
        text: t('profile.photo.errorSize', 'Image size must be less than 2MB.'),
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      updateUserAvatar(dataUrl);
      setPhotoMessage({
        type: 'success',
        text: t('profile.photo.successMsg', 'Profile photo updated successfully!'),
      });
      setTimeout(() => setPhotoMessage(null), 4000);
    };
    reader.onerror = () => {
      setPhotoMessage({
        type: 'error',
        text: 'Failed to read image file.',
      });
    };
    reader.readAsDataURL(file);
    // Reset input
    e.target.value = '';
  };

  const handlePhotoRemove = () => {
    updateUserAvatar(null);
    setPhotoMessage({
      type: 'success',
      text: t('profile.photo.removedMsg', 'Profile photo removed.'),
    });
    setTimeout(() => setPhotoMessage(null), 4000);
  };

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
                {t('profile.welcomeTitle', 'Welcome to Your Profile')}
              </h2>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                {t('profile.welcomeSubtitle', 'Manage your profile details, photo, and system access.')}
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
            <div className="profile-header-avatar" style={{ position: 'relative' }}>
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={userDisplayName}
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '3px solid var(--color-primary)',
                    display: 'block',
                  }}
                />
              ) : (
                <div className="profile-avatar">{initials}</div>
              )}
            </div>
            <div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '2px', color: 'var(--color-text)' }}>
                {userDisplayName}
              </h1>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', margin: 0 }}>
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
              <KeyRound size={15} /> {t('profile.changePasswordBtn', 'Change Password')}
            </Link>
            <button onClick={handleLogout} className="btn btn-ghost btn-sm" title={t('profile.signOutBtn', 'Sign Out')}>
              <LogOut size={15} /> {t('profile.signOutBtn', 'Sign Out')}
            </button>
          </div>
        </div>

        {/* Optional Profile Photo Card — available to all roles */}
        <div className="card" style={{ marginBottom: '24px' }}>
          <div className="card-header">
            <h2 className="card-title">
              <Camera size={18} color="var(--color-primary)" />
              {t('profile.photo.title', 'Profile Photo')}
            </h2>
            <span
              className="badge badge-neutral"
              style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              {t('profile.photo.optionalBadge', 'Optional')}
            </span>
          </div>

          <div
            className="profile-photo-row"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '20px',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ position: 'relative' }}>
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={userDisplayName}
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '3px solid var(--color-primary-light)',
                    display: 'block',
                  }}
                />
              ) : (
                <div
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    backgroundColor: 'var(--color-bg-secondary, #f1f5f9)',
                    color: 'var(--color-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.6rem',
                    fontWeight: 700,
                    border: '2px dashed var(--color-border)',
                  }}
                >
                  {initials}
                </div>
              )}
            </div>

            <div style={{ flex: 1, minWidth: '220px' }}>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '8px' }}>
                <label
                  className="btn btn-primary btn-sm"
                  style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <Upload size={14} />
                  {user?.avatarUrl
                    ? t('profile.photo.changeBtn', 'Change Photo')
                    : t('profile.photo.uploadBtn', 'Upload Photo')}
                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/webp"
                    style={{ display: 'none' }}
                    onChange={handlePhotoSelect}
                  />
                </label>

                {user?.avatarUrl && (
                  <button
                    type="button"
                    onClick={handlePhotoRemove}
                    className="btn btn-outline btn-sm"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      color: 'var(--color-danger, #ef4444)',
                    }}
                  >
                    <Trash2 size={14} />
                    {t('profile.photo.removeBtn', 'Remove Photo')}
                  </button>
                )}
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', margin: 0 }}>
                {t('profile.photo.hint', 'Optional: JPG, PNG or WEBP (Max 2MB)')}
              </p>

              {photoMessage && (
                <div
                  style={{
                    marginTop: '10px',
                    fontSize: '0.85rem',
                    fontWeight: 500,
                    color: photoMessage.type === 'error' ? 'var(--color-danger, #ef4444)' : 'var(--color-success, #10b981)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  {photoMessage.type === 'error' ? <AlertCircle size={15} /> : <CheckCircle size={15} />}
                  <span>{photoMessage.text}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Personal Details Card */}
        <div className="card" style={{ marginBottom: '24px' }}>
          <div className="card-header">
            <h2 className="card-title">
              <User size={18} color="var(--color-primary)" />
              {t('profile.personalInfo', 'Personal Information')}
            </h2>
            <span className={`badge ${user?.isActive ? 'badge-verifier' : 'badge-admin'}`}>
              {user?.isActive
                ? t('profile.activeAccount', 'Active Account')
                : t('profile.suspended', 'Suspended')}
            </span>
          </div>

          <div className="data-grid">
            <div className="data-row">
              <span className="data-label">{t('profile.fullName', 'Full Name')}</span>
              <span className="data-value" style={{ fontWeight: 600 }}>{userDisplayName}</span>
            </div>

            <div className="data-row">
              <span className="data-label">{t('profile.emailAddress', 'Email Address')}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="data-value">{user?.email}</span>
                {user?.emailVerified ? (
                  <span
                    style={{
                      color: 'var(--color-success)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 2,
                      fontSize: '0.78rem',
                      fontWeight: 600,
                    }}
                  >
                    <CheckCircle size={13} /> {t('profile.verified', 'Verified')}
                  </span>
                ) : (
                  <span
                    style={{
                      color: 'var(--color-warning)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 2,
                      fontSize: '0.78rem',
                      fontWeight: 600,
                    }}
                  >
                    <AlertCircle size={13} /> {t('profile.unverified', 'Unverified')}
                  </span>
                )}
              </div>
            </div>

            <div className="data-row">
              <span className="data-label">{t('profile.phoneNumber', 'Phone Number')}</span>
              <span className="data-value">{user?.phone || t('profile.notProvided', 'Not provided')}</span>
            </div>
          </div>
        </div>

        {/* Roles & System Access Card */}
        <div className="card" style={{ marginBottom: '24px' }}>
          <div className="card-header">
            <h2 className="card-title">
              <Shield size={18} color="var(--color-primary)" />
              {t('profile.rolesAccess', 'Roles & System Access')}
            </h2>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <span className="data-label" style={{ display: 'block', marginBottom: '8px' }}>
              {t('profile.assignedRoles', 'Assigned Roles')}
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
                {t('profile.orgContext', 'Assigned Transport Organization')}
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
                      <p style={{ fontWeight: 700, color: 'var(--color-text)', fontSize: '0.95rem', margin: '0 0 4px 0' }}>
                        {org.organizationName || 'Assigned Organization'}
                      </p>
                      <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', margin: 0 }}>
                        {t('profile.orgId', 'Organization ID')}: <code>{org.organizationId}</code>
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
                  {t('profile.activePermissions', 'Active Permissions')} ({user.permissions.length})
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
