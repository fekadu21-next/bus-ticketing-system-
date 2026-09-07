import ApiError from '../utils/apiError.js';

export const authorizeRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, 'User context missing. Call authenticate first.'));
    }

    const isAdmin = req.user.roles.includes('PLATFORM_ADMIN');
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


export const authorizePermission = (...requiredPermissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, 'User context missing. Call authenticate first.'));
    }

    const isAdmin = req.user.roles.includes('PLATFORM_ADMIN');
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