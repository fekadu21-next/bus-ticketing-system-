import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { ROLES } from '@/constants/roles';

/**
 * Renders children only when the authenticated user holds the required permission.
 * Platform admins always pass through.
 *
 * @param {Object} props
 * @param {string} props.permission - Permission identifier from PERMISSIONS constant
 * @param {React.ReactNode} props.children
 * @param {React.ReactNode} [props.fallback=null] - Rendered when access is denied
 */
const PermissionGate = ({ permission, children, fallback = null }) => {
  const { user } = useAuth();
  if (!user) return fallback;

  const isAdmin = user.roles?.includes(ROLES.PLATFORM_ADMIN);
  const hasPerm = user.permissions?.includes(permission);

  return isAdmin || hasPerm ? children : fallback;
};

export default PermissionGate;
