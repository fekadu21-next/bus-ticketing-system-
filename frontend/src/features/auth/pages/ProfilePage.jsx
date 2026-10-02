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
  const { user, logout, updateUserAvatar, updateUser } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isWelcome = searchParams.get('welcome') === 'true';

  const [permissionsExpanded, setPermissionsExpanded] = useState(false);
  const [photoMessage, setPhotoMessage] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: user?.phone || '',
  });
  const [editMessage, setEditMessage] = useState(null);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case ROLES.PLATFORM_ADMIN:
      case ROLES.ADMIN:
        return 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800';
      case ROLES.OPERATIONAL_MANAGER:
      case ROLES.BOOKING_COORDINATOR:
        return 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800';
      case ROLES.TICKET_VERIFIER:
        return 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800';
      case ROLES.PASSENGER:
        return 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800';
      default:
        return 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-600';
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

  const handleEditToggle = () => {
    if (isEditing) {
      setEditFormData({
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        phone: user?.phone || '',
      });
    }
    setIsEditing(!isEditing);
    setEditMessage(null);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    updateUser(editFormData);
    setEditMessage({
      type: 'success',
      text: 'Profile updated successfully!',
    });
    setIsEditing(false);
    setTimeout(() => setEditMessage(null), 4000);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6">
      <div className="max-w-3xl mx-auto">
        {/* Welcome State if user just logged in */}
        {isWelcome && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-800 p-5 mb-6 flex items-center gap-4">
            <div className="w-11 h-11 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 flex-shrink-0">
              <Sparkles size={24} />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mb-0.5">
                {t('profile.welcomeTitle', 'Welcome to Your Profile')}
              </h2>
              <p className="text-slate-600 dark:text-slate-400 text-sm">
                {t('profile.welcomeSubtitle', 'Manage your profile details, photo, and system access.')}
              </p>
            </div>
          </div>
        )}

        {/* Top Header with Avatar & Quick Actions */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 mb-6 flex items-center justify-between flex-wrap gap-4.5">
          <div className="flex items-center gap-4.5">
            <div className="relative">
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={userDisplayName}
                  className="w-18 h-18 rounded-full object-cover border-3 border-blue-600 dark:border-blue-400 block"
                />
              ) : (
                <div className="w-18 h-18 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center text-2xl font-bold border-2 border-blue-200 dark:border-blue-800">
                  {initials}
                </div>
              )}
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-0.5">
                {userDisplayName}
              </h1>
              <p className="text-slate-600 dark:text-slate-400 text-sm">
                {user?.email}
              </p>
              <div className="flex gap-1.5 mt-1.5 flex-wrap">
                {user?.roles?.map((role) => (
                  <span key={role} className={`px-2 py-0.5 rounded-full text-xs font-bold border ${getRoleBadgeClass(role)}`}>
                    {role}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-2.5 flex-wrap">
            <Link to="/change-password" className="px-3 py-1.5 bg-slate-600 text-white rounded-lg text-xs font-semibold hover:bg-slate-700 transition-colors duration-200 inline-flex items-center gap-2">
              <KeyRound size={15} /> {t('profile.changePasswordBtn', 'Change Password')}
            </Link>
            <button onClick={handleLogout} className="px-3 py-1.5 bg-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-xs font-semibold transition-colors duration-200 inline-flex items-center gap-2" title={t('profile.signOutBtn', 'Sign Out')}>
              <LogOut size={15} /> {t('profile.signOutBtn', 'Sign Out')}
            </button>
          </div>
        </div>

        {/* Optional Profile Photo Card — available to all roles */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Camera size={18} className="text-blue-600 dark:text-blue-400" />
              {t('profile.photo.title', 'Profile Photo')}
            </h2>
            <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-full text-xs font-bold border border-slate-300 dark:border-slate-600 uppercase tracking-wider">
              {t('profile.photo.optionalBadge', 'Optional')}
            </span>
          </div>

          <div className="flex items-center gap-5 flex-wrap">
            <div className="relative">
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={userDisplayName}
                  className="w-20 h-20 rounded-full object-cover border-3 border-blue-200 dark:border-blue-800 block"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400 flex items-center justify-center text-2xl font-bold border-2 border-dashed border-slate-300 dark:border-slate-600">
                  {initials}
                </div>
              )}
            </div>

            <div className="flex-1 min-w-[220px]">
              <div className="flex gap-2.5 flex-wrap mb-2">
                <label className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors duration-200 inline-flex items-center gap-1.5 cursor-pointer">
                  <Upload size={14} />
                  {user?.avatarUrl
                    ? t('profile.photo.changeBtn', 'Change Photo')
                    : t('profile.photo.uploadBtn', 'Upload Photo')}
                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/webp"
                    className="hidden"
                    onChange={handlePhotoSelect}
                  />
                </label>

                {user?.avatarUrl && (
                  <button
                    type="button"
                    onClick={handlePhotoRemove}
                    className="px-3 py-1.5 bg-transparent border border-slate-300 dark:border-slate-600 text-red-600 dark:text-red-400 rounded-lg text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors duration-200 inline-flex items-center gap-1.5"
                  >
                    <Trash2 size={14} />
                    {t('profile.photo.removeBtn', 'Remove Photo')}
                  </button>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t('profile.photo.hint', 'Optional: JPG, PNG or WEBP (Max 2MB)')}
              </p>

              {photoMessage && (
                <div className={`mt-2.5 text-xs font-medium flex items-center gap-1.5 ${photoMessage.type === 'error' ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                  {photoMessage.type === 'error' ? <AlertCircle size={15} /> : <CheckCircle size={15} />}
                  <span>{photoMessage.text}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Personal Details Card */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <User size={18} className="text-blue-600 dark:text-blue-400" />
              {t('profile.personalInfo', 'Personal Information')}
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={handleEditToggle}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors duration-200"
              >
                {isEditing ? 'Cancel' : 'Edit'}
              </button>
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${user?.isActive ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800' : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800'}`}>
                {user?.isActive
                  ? t('profile.activeAccount', 'Active Account')
                  : t('profile.suspended', 'Suspended')}
              </span>
            </div>
          </div>

          {editMessage && (
            <div className={`mb-4 p-3 rounded-lg text-xs font-medium flex items-center gap-1.5 ${editMessage.type === 'error' ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400' : 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400'}`}>
              {editMessage.type === 'error' ? <AlertCircle size={15} /> : <CheckCircle size={15} />}
              <span>{editMessage.text}</span>
            </div>
          )}

          {isEditing ? (
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-500 dark:text-slate-400 mb-1.5">First Name</label>
                <input
                  type="text"
                  name="firstName"
                  value={editFormData.firstName}
                  onChange={handleEditChange}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 dark:focus:border-blue-400"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-500 dark:text-slate-400 mb-1.5">Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  value={editFormData.lastName}
                  onChange={handleEditChange}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 dark:focus:border-blue-400"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-500 dark:text-slate-400 mb-1.5">Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  value={editFormData.phone}
                  onChange={handleEditChange}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 dark:focus:border-blue-400"
                />
              </div>
              <div className="flex justify-between items-start py-2 border-b border-slate-100 dark:border-slate-700">
                <span className="text-sm text-slate-500 dark:text-slate-400">{t('profile.emailAddress', 'Email Address')}</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm text-slate-900 dark:text-white">{user?.email}</span>
                  {user?.emailVerified ? (
                    <span className="text-green-600 dark:text-green-400 inline-flex items-center gap-0.5 text-xs font-semibold">
                      <CheckCircle size={13} /> {t('profile.verified', 'Verified')}
                    </span>
                  ) : (
                    <span className="text-amber-600 dark:text-amber-400 inline-flex items-center gap-0.5 text-xs font-semibold">
                      <AlertCircle size={13} /> {t('profile.unverified', 'Unverified')}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors duration-200"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={handleEditToggle}
                  className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-300 transition-colors duration-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-start py-2 border-b border-slate-100 dark:border-slate-700">
                <span className="text-sm text-slate-500 dark:text-slate-400">{t('profile.fullName', 'Full Name')}</span>
                <span className="text-sm font-semibold text-slate-900 dark:text-white">{userDisplayName}</span>
              </div>

              <div className="flex justify-between items-start py-2 border-b border-slate-100 dark:border-slate-700">
                <span className="text-sm text-slate-500 dark:text-slate-400">{t('profile.emailAddress', 'Email Address')}</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm text-slate-900 dark:text-white">{user?.email}</span>
                  {user?.emailVerified ? (
                    <span className="text-green-600 dark:text-green-400 inline-flex items-center gap-0.5 text-xs font-semibold">
                      <CheckCircle size={13} /> {t('profile.verified', 'Verified')}
                    </span>
                  ) : (
                    <span className="text-amber-600 dark:text-amber-400 inline-flex items-center gap-0.5 text-xs font-semibold">
                      <AlertCircle size={13} /> {t('profile.unverified', 'Unverified')}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex justify-between items-start py-2">
                <span className="text-sm text-slate-500 dark:text-slate-400">{t('profile.phoneNumber', 'Phone Number')}</span>
                <span className="text-sm text-slate-900 dark:text-white">{user?.phone || t('profile.notProvided', 'Not provided')}</span>
              </div>
            </div>
          )}
        </div>

        {/* Roles & System Access Card */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Shield size={18} className="text-blue-600 dark:text-blue-400" />
              {t('profile.rolesAccess', 'Roles & System Access')}
            </h2>
          </div>

          <div className="mb-4">
            <span className="text-sm text-slate-500 dark:text-slate-400 block mb-2">
              {t('profile.assignedRoles', 'Assigned Roles')}
            </span>
            <div className="flex gap-2 flex-wrap">
              {user?.roles?.map((role) => (
                <span key={role} className={`px-2 py-0.5 rounded-full text-xs font-bold border ${getRoleBadgeClass(role)}`}>
                  {role}
                </span>
              ))}
            </div>
          </div>

          {/* Operational Organization Context */}
          {user?.organizationContext && user.organizationContext.length > 0 && (
            <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-700">
              <span className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mb-2.5">
                <Building2 size={15} className="text-blue-600 dark:text-blue-400" />
                {t('profile.orgContext', 'Assigned Transport Organization')}
              </span>
              <div className="flex flex-col gap-2">
                {user.organizationContext.map((org, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-50 dark:bg-slate-900 px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 flex justify-between items-center flex-wrap gap-2"
                  >
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white text-sm mb-1">
                        {org.organizationName || 'Assigned Organization'}
                      </p>
                      <p className="text-slate-600 dark:text-slate-400 text-xs">
                        {t('profile.orgId', 'Organization ID')}: <code className="bg-slate-200 dark:bg-slate-700 px-1 rounded">{org.organizationId}</code>
                      </p>
                    </div>
                    <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full text-xs font-bold border border-blue-200 dark:border-blue-800">{org.role}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Permissions Accordion */}
          {user?.permissions && user.permissions.length > 0 && (
            <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-700">
              <button
                type="button"
                className="w-full flex items-center justify-between text-sm font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
                onClick={() => setPermissionsExpanded((prev) => !prev)}
              >
                <span>
                  {t('profile.activePermissions', 'Active Permissions')} ({user.permissions.length})
                </span>
                {permissionsExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>

              {permissionsExpanded && (
                <div className="flex gap-1.5 flex-wrap mt-3">
                  {user.permissions.map((perm) => (
                    <span key={perm} className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs border border-slate-300 dark:border-slate-600">
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
