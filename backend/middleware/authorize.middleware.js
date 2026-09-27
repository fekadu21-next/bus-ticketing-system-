import ApiError from '../utils/apiError.js';
import { ROLES } from '../constants/index.js';

/**
 * Authorize based on global roles.
 * ADMIN has platform-wide superuser access across all endpoints.
 * @param  {...string} allowedRoles
 */
export const authorizeRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, 'User context missing. Call authenticate first.'));
    }

    const isAdmin = req.user.roles.includes(ROLES.ADMIN);
    if (isAdmin) {
      return next();
    }

    const hasRole = allowedRoles.some((role) => req.user.roles.includes(role));
    if (!hasRole) {
      return next(new ApiError(403, 'Forbidden: You do not have the required role for this action.'));
    }

    next();
  };
};

/**
 * Authorize based on permissions.
 * ADMIN has platform-wide superuser access.
 * @param  {...string} requiredPermissions
 */
export const authorizePermission = (...requiredPermissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, 'User context missing. Call authenticate first.'));
    }

    const isAdmin = req.user.roles.includes(ROLES.ADMIN);
    if (isAdmin) {
      return next();
    }

    const hasAllPermissions = requiredPermissions.every((perm) =>
      req.user.permissions.includes(perm)
    );

    if (!hasAllPermissions) {
      return next(new ApiError(403, 'Forbidden: Insufficient permissions to access this resource.'));
    }

    next();
  };
};

export default {
  authorizeRole,
  authorizePermission,
};