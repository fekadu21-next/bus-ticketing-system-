import React from 'react';
import { Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { ROLES } from '@/constants/roles';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

/**
 * Protects routes that require a specific permission.
 * Platform admins always pass through.
 * Unauthenticated users are redirected to /login.
 * Authenticated users without the permission are redirected to /dashboard.
 *
 * @param {{ permission: string, children: React.ReactNode }} props
 *
 * @example
 * <PermissionRoute permission={PERMISSIONS.VIEW_AUDIT_LOGS}>
 *   <AuditPage />
 * </PermissionRoute>
 */
const PermissionRoute = ({ permission, children }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { t } = useTranslation();

  if (isLoading) {
    return <LoadingSpinner fullPage label={t('checkingPermissions')} />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const isAdmin = user?.roles?.includes(ROLES.PLATFORM_ADMIN);
  const hasPerm = user?.permissions?.includes(permission);

  if (!isAdmin && !hasPerm) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default PermissionRoute;
