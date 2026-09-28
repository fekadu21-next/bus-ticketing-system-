import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { ROLES } from '@/constants/roles';

/**
 * Renders children only when the authenticated user holds one of the allowed roles.
 * Platform admins always pass through.
 *
 * @param {Object} props
 * @param {string|string[]} props.roles - One or more role identifiers
 * @param {React.ReactNode} props.children
 * @param {React.ReactNode} [props.fallback=null] - Rendered when access is denied
 */
const RoleGate = ({ roles, children, fallback = null }) => {
  const { user } = useAuth();
  if (!user) return fallback;

  const allowed = Array.isArray(roles) ? roles : [roles];
  const isAdmin = user.roles?.includes(ROLES.PLATFORM_ADMIN);
  const hasRole = allowed.some((r) => user.roles?.includes(r));

  return isAdmin || hasRole ? children : fallback;
};

export default RoleGate;
