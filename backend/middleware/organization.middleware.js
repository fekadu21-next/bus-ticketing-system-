import ApiError from '../utils/apiError.js';

export const authorizeOrganization = (targetOrgResolver = null) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, 'User context missing. Call authenticate first.'));
    }

    // Platform Admin has platform-wide access
    if (req.user.roles.includes('PLATFORM_ADMIN')) {
      if (targetOrgResolver) {
        req.organizationId = targetOrgResolver(req);
      }
      return next();
    }

    const orgContexts = req.user.orgContexts || [];
    if (orgContexts.length === 0) {
      return next(
        new ApiError(403, 'Forbidden: User is not associated with any active organization.')
      );
    }

    // If a target organization is specified in the request (e.g., /api/v1/organizations/:orgId/...)
    if (targetOrgResolver) {
      const targetOrgId = targetOrgResolver(req);
      if (targetOrgId) {
        const hasAccess = orgContexts.some((ctx) => ctx.organizationId === targetOrgId);
        if (!hasAccess) {
          return next(
            new ApiError(403, 'Forbidden: You do not have access to this organization.')
          );
        }
        req.organizationId = targetOrgId;
        return next();
      }
    }

    // Default: bind the primary organization context assigned to the user
    req.organizationId = orgContexts[0].organizationId;
    next();
  };
};

export default authorizeOrganization;