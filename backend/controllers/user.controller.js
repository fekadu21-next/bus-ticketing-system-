import userService from '../services/user.service.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/apiError.js';
import { ROLES } from '../constants/index.js';

class UserController {
  /**
   * GET /api/v1/users
   */
  getUsers = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '20', 10);
    const search = req.query.search || '';
    const role = req.query.role || null;
    const organizationId = req.query.organizationId || null;
    const isActive = req.query.isActive !== undefined ? req.query.isActive === 'true' : null;

    const result = await userService.getUsers({ page, limit, search, role, organizationId, isActive });

    res.status(200).json({
      success: true,
      data: result,
    });
  });

  /**
   * GET /api/v1/users/:id
   */
  getUserById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Self or Admin
    const isSelf = req.user.id === id;
    const isAdmin = req.user.roles.includes(ROLES.ADMIN);
    if (!isSelf && !isAdmin) {
      throw new ApiError(403, 'Forbidden: You do not have permission to access another user profile.');
    }

    const user = await userService.getUserById(id);

    res.status(200).json({
      success: true,
      data: { user },
    });
  });

  /**
   * POST /api/v1/users (Admin creates staff or users)
   */
  createUser = asyncHandler(async (req, res) => {
    const reqMeta = {
      clientIp: req.ip,
      userAgent: req.headers['user-agent'],
    };

    const user = await userService.createUserByAdmin(req.body, req.user, reqMeta);

    res.status(201).json({
      success: true,
      message: 'User created successfully.',
      data: { user },
    });
  });

  /**
   * PATCH /api/v1/users/:id
   */
  updateUser = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const reqMeta = {
      clientIp: req.ip,
      userAgent: req.headers['user-agent'],
    };

    const user = await userService.updateUser(id, req.body, req.user, reqMeta);

    res.status(200).json({
      success: true,
      message: 'User updated successfully.',
      data: { user },
    });
  });

  /**
   * PATCH /api/v1/users/:id/status
   */
  toggleStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { isActive } = req.body;
    const reqMeta = {
      clientIp: req.ip,
      userAgent: req.headers['user-agent'],
    };

    const user = await userService.toggleUserStatus(id, isActive, req.user, reqMeta);

    res.status(200).json({
      success: true,
      message: `User account has been ${isActive ? 'activated' : 'deactivated'} successfully.`,
      data: { user },
    });
  });
}

export const userController = new UserController();
export default userController;
