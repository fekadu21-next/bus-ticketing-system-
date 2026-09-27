import rbacService from '../services/rbac.service.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/apiError.js';
import { ROLES } from '../constants/index.js';

class RbacController {
  /**
   * GET /api/v1/rbac/roles
   */
  getRoles = asyncHandler(async (req, res) => {
    const roles = await rbacService.getRoles();
    res.status(200).json({
      success: true,
      data: { roles },
    });
  });

  /**
   * GET /api/v1/rbac/roles/:id
   */
  getRoleById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const role = await rbacService.getRoleById(id);
    res.status(200).json({
      success: true,
      data: { role },
    });
  });

  /**
   * GET /api/v1/rbac/permissions
   */
  getPermissions = asyncHandler(async (req, res) => {
    const permissions = await rbacService.getPermissions();
    res.status(200).json({
      success: true,
      data: { permissions },
    });
  });

  /**
   * GET /api/v1/rbac/users/:userId/roles
   */
  getUserRoles = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    const isSelf = req.user.id === userId;
    const isAdmin = req.user.roles.includes(ROLES.ADMIN);
    if (!isSelf && !isAdmin) {
      throw new ApiError(403, 'Forbidden: You cannot view roles of another user.');
    }

    const userRoles = await rbacService.getUserRoles(userId);
    res.status(200).json({
      success: true,
      data: { userRoles },
    });
  });

  /**
   * POST /api/v1/rbac/users/:userId/roles
   */
  assignRole = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { roleName, organizationId } = req.body;
    const reqMeta = {
      clientIp: req.ip,
      userAgent: req.headers['user-agent'],
    };

    const result = await rbacService.assignRoleToUser(
      { userId, roleName, organizationId },
      req.user,
      reqMeta
    );

    res.status(201).json({
      success: true,
      message: `Role '${roleName}' assigned successfully.`,
      data: { assignment: result },
    });
  });

  /**
   * DELETE /api/v1/rbac/users/:userId/roles/:userRoleId
   */
  revokeRole = asyncHandler(async (req, res) => {
    const { userRoleId } = req.params;
    const reqMeta = {
      clientIp: req.ip,
      userAgent: req.headers['user-agent'],
    };

    const result = await rbacService.revokeRoleFromUser(userRoleId, req.user, reqMeta);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  });
}

export const rbacController = new RbacController();
export default rbacController;
