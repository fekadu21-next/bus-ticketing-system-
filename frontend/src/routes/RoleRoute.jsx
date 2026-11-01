import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { ROLES } from '@/constants/roles';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import {
  isUserAdmin,
  isUserOperator,
  isUserDriver,
  isUserVerifier,
  isUserPassenger,
  extractUserRoles,
} from '@/utils/userUtils';

/**
 * Protects routes requiring specific roles.
 * - Authenticated Platform Admins have superuser passthrough.
 * - Normalized role checks verify Drivers, Verifiers, Operators, and Passengers.
 * - Unauthorized users are securely routed to their own authorized landing view
 *   rather than allowing privilege leaks across role dashboards.
 *
 * @param {{ allowedRoles: string[], fallbackPath?: string, children: React.ReactNode }} props
 */
const RoleRoute = ({ allowedRoles = [], fallbackPath, children }) => {
  const { user, isAuthenticated, isLoading, getDashboardPath } = useAuth();
  const { t } = useTranslation();
  const location = useLocation();

  if (isLoading) {
    return <LoadingSpinner fullPage label={t('checkingPermissions') || 'Checking authorization...'} />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Admin superuser passes through to all operational consoles
  if (isUserAdmin(user)) {
    return children;
  }

  const userRoles = extractUserRoles(user);

  const hasRole = allowedRoles.some((role) => {
    if (!role) return false;
    const r = String(role).toUpperCase().trim();

    if (r === ROLES.ADMIN || r === 'ADMIN' || r === 'PLATFORM_ADMIN' || r === 'SUPER_ADMIN') {
      return isUserAdmin(user);
    }
    if (r === ROLES.DRIVER || r === 'DRIVER') {
      return isUserDriver(user) || userRoles.includes('DRIVER');
    }
    if (
      r === ROLES.TICKET_VERIFIER ||
      r === 'TICKET_VERIFIER' ||
      r === 'VERIFIER'
    ) {
      return isUserVerifier(user) || userRoles.includes('TICKET_VERIFIER') || userRoles.includes('VERIFIER');
    }
    if (
      r === ROLES.BOOKING_COORDINATOR ||
      r === ROLES.OPERATIONAL_MANAGER ||
      r === 'OPERATOR' ||
      r === 'MANAGER' ||
      r === 'DISPATCHER'
    ) {
      return isUserOperator(user);
    }
    if (r === ROLES.PASSENGER || r === 'PASSENGER') {
      return isUserPassenger(user) || userRoles.includes('PASSENGER');
    }

    return userRoles.includes(r);
  });

  if (!hasRole) {
    const target = fallbackPath || (getDashboardPath ? getDashboardPath(user) : '/my-bookings');
    // Guard against potential redirect loop if user is already on target
    if (target === location.pathname) {
      return <Navigate to="/" replace />;
    }
    return <Navigate to={target} replace />;
  }

  return children;
};

export default RoleRoute;
