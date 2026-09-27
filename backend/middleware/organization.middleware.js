import ApiError from '../utils/apiError.js';
import { ROLES } from '../constants/index.js';

/**
 * Helper to resolve target organization ID from request
 */
const resolveTargetOrgId = (req, targetOrgResolver) => {
  if (typeof targetOrgResolver === 'function') {
    return targetOrgResolver(req);
  }
  return req.params.orgId || req.params.organizationId || req.body?.organizationId || req.query?.organizationId || null;
};

/**
 * Middleware ensuring user has authorized access to the requested organization.
 * ADMIN has platform-wide access to all organizations.
 * BOOKING_COORDINATOR and TICKET_VERIFIER are strictly bound to their assigned organizations.
 */
export const authorizeOrganization = (targetOrgResolver = null) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, 'User context missing. Call authenticate first.'));
    }

    const targetOrgId = resolveTargetOrgId(req, targetOrgResolver);

    // ADMIN has platform-wide superuser access across all organizations
    if (req.user.roles.includes(ROLES.ADMIN)) {
      if (targetOrgId) {
        req.organizationId = targetOrgId;
      }
      return next();
    }

    const orgContexts = req.user.orgContexts || [];
    if (orgContexts.length === 0) {
      return next(
        new ApiError(403, 'Forbidden: User is not associated with any active organization.')
      );
    }

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

    // If no target org specified, default to primary organization context
    req.organizationId = orgContexts[0].organizationId;
    next();
  };
};

/**
 * Middleware requiring specific role(s) within the resolved organization context.
 * User -> Role -> Organization boundary enforcement.
 */
export const authorizeOrgRole = (allowedRoles = [], targetOrgResolver = null) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, 'User context missing. Call authenticate first.'));
    }

    // ADMIN bypasses scoped role requirement
    if (req.user.roles.includes(ROLES.ADMIN)) {
      const targetOrgId = resolveTargetOrgId(req, targetOrgResolver);
      if (targetOrgId) req.organizationId = targetOrgId;
      return next();
    }

    const targetOrgId = resolveTargetOrgId(req, targetOrgResolver);
    if (!targetOrgId) {
      return next(new ApiError(400, 'Target organization ID is required for this operation.'));
    }

    const orgContexts = req.user.orgContexts || [];
    const matchingContext = orgContexts.find(
      (ctx) => ctx.organizationId === targetOrgId && allowedRoles.includes(ctx.role)
    );

    if (!matchingContext) {
      return next(
        new ApiError(
          403,
          `Forbidden: You do not have the required role (${allowedRoles.join(', ')}) for this organization.`
        )
      );
    }

    req.organizationId = targetOrgId;
    req.activeOrgRole = matchingContext.role;
    next();
  };
};

export default authorizeOrganization;