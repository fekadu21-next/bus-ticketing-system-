import React from 'react';
import { Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { ROLES } from '@/constants/roles';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

/**
 * Protects routes that require specific roles.
 * Admins always pass through regardless of allowedRoles.
 *
 * @param {{ allowedRoles: string[], children: React.ReactNode }} props
 */
const RoleRoute = ({ allowedRoles = [], children }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { t } = useTranslation();

  if (isLoading) {
    return <LoadingSpinner fullPage label={t('checkingPermissions') || 'Checking authorization...'} />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const isAdmin = user?.roles?.includes(ROLES.ADMIN) || user?.roles?.includes('PLATFORM_ADMIN');
  const hasRole = allowedRoles.some((role) => user?.roles?.includes(role));

  if (!isAdmin && !hasRole) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default RoleRoute;
