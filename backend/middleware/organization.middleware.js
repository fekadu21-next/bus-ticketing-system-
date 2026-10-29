import ApiError from '../utils/apiError.js';
import { ROLES } from '../constants/index.js';
import { assertApprovedOrganization } from '../utils/organizationUtils.js';

/**
 * Helper to resolve target organization ID from request
 */
const resolveTargetOrgId = (req, targetOrgResolver) => {
  if (typeof targetOrgResolver === 'function') {
    return targetOrgResolver(req);
  }
  return req.params.orgId || req.params.organizationId || req.body?.organizationId || req.query?.organizationId || req.headers?.['x-organization-id'] || null;
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

    let targetOrgId = resolveTargetOrgId(req, targetOrgResolver);
    const orgContexts = req.user.orgContexts || [];

    // Fallback: If no target org ID specified in params/body, pick matching role context from user
    if (!targetOrgId && orgContexts.length > 0) {
      const matched = orgContexts.find((ctx) => allowedRoles.includes(ctx.role));
      if (matched) {
        targetOrgId = matched.organizationId;
      }
    }

    if (!targetOrgId) {
      return next(new ApiError(400, 'Target organization ID is required for this operation.'));
    }

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

/**
 * Middleware ensuring that the organization is approved before allowing
 * operational managers to create or modify operational resources.
 * Allows read-only requests (GET, HEAD, OPTIONS).
 * Blocks mutating requests (POST, PUT, PATCH, DELETE) with 403 Forbidden
 * unless the organization status is 'APPROVED' and is_active is true.
 * ADMIN users are exempt.
 */
export const requireApprovedOrganization = async (req, res, next) => {
  if (!req.user) {
    return next(new ApiError(401, 'User context missing. Call authenticate first.'));
  }

  // Admin users have platform-wide access
  if (req.user.roles.includes(ROLES.ADMIN)) {
    return next();
  }

  // Only restrict creation and modification (mutating HTTP methods)
  const isMutatingMethod = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method.toUpperCase());
  if (!isMutatingMethod) {
    return next();
  }

  // Resolve target organization ID
  let targetOrgId = req.organizationId || req.params.orgId || req.params.organizationId || req.body?.organizationId || req.query?.organizationId;

  if (!targetOrgId && req.user.orgContexts && req.user.orgContexts.length > 0) {
    targetOrgId = req.user.orgContexts[0].organizationId;
  }

  if (!targetOrgId) {
    return next();
  }

  try {
    const org = await assertApprovedOrganization(targetOrgId);
    req.organizationId = org.id;
    next();
  } catch (err) {
    next(err);
  }
};

export default {
  authorizeOrganization,
  authorizeOrgRole,
  requireApprovedOrganization,
};
