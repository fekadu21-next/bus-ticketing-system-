import { verifyAccessToken } from '../utils/jwt.js';
import authRepository from '../repository/auth.repository.js';
import ApiError from '../utils/apiError.js';

/**
 * Authentication middleware verifying Bearer JWT and attaching user context
 */
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError(401, 'Authentication token required');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new ApiError(401, 'Authentication token required');
    }

    const decoded = verifyAccessToken(token);

    if (decoded.type !== 'access') {
      throw new ApiError(401, 'Invalid token type');
    }

    const user = await authRepository.findUserById(decoded.sub);
    if (!user || !user.is_active) {
      throw new ApiError(401, 'User account is inactive or no longer exists');
    }

    const userRoles = user.user_roles || [];
    const roles = userRoles.map((ur) => ur.roles?.name).filter(Boolean);

    if (roles.length === 0) {
      throw new ApiError(403, 'User holds no active roles in the system');
    }

    const permissions = [
      ...new Set(
        userRoles.flatMap((ur) =>
          ur.roles?.role_permissions?.map((rp) => rp.permissions?.name).filter(Boolean) || []
        )
      ),
    ];

    const orgContexts = userRoles
      .filter((ur) => ur.organization_id)
      .map((ur) => ({
        role: ur.roles?.name,
        organizationId: ur.organization_id,
        organizationName: ur.organizations?.name,
        organizationType: ur.organizations?.type,
      }));

    req.user = {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      roles,
      permissions,
      orgContexts,
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(new ApiError(401, 'Invalid authentication token'));
    }
    if (error.name === 'TokenExpiredError') {
      return next(new ApiError(401, 'Authentication token has expired'));
    }
    next(error);
  }
};

export default authenticate;