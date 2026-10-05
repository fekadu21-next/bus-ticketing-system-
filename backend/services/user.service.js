import userRepository from '../repository/user.repository.js';
import organizationRepository from '../repository/organization.repository.js';
import { hashPassword } from '../utils/password.js';
import ApiError from '../utils/apiError.js';
import { logAuditEvent, AuditAction } from '../utils/auditLogger.js';
import { formatSafeUser } from './auth/utils/formatSafeUser.js';
import { ROLES } from '../constants/index.js';

export class UserService {
  /**
   * Get all users with filtering and pagination
   */
  async getUsers(params) {
    const { total, page, limit, users } = await userRepository.findAll(params);
    return {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      users: users.map(formatSafeUser),
    };
  }

  /**
   * Get single user by ID
   */
  async getUserById(id) {
    const user = await userRepository.findById(id);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }
    return formatSafeUser(user);
  }

  /**
   * Admin creates user with specified role and optional organization
   */
  async createUserByAdmin({ firstName, lastName, email, phone, password, role = ROLES.PASSENGER, organizationId = null, isActive = true, emailVerified = true }, adminUser, reqMeta = {}) {
    const normalizedEmail = email.trim().toLowerCase();

    // Check email uniqueness
    const existing = await userRepository.findByEmail(normalizedEmail);
    if (existing) {
      throw new ApiError(409, 'A user with this email address already exists');
    }

    // Role-organization validation:
    // If role is BOOKING_COORDINATOR, TICKET_VERIFIER, or DRIVER, organizationId is required!
    if (role === ROLES.BOOKING_COORDINATOR || role === ROLES.TICKET_VERIFIER || role === ROLES.DRIVER) {
      if (!organizationId) {
        throw new ApiError(400, `Organization ID is required when creating a ${role}`);
      }
      const org = await organizationRepository.findById(organizationId);
      if (!org || !org.is_active) {
        throw new ApiError(400, 'Assigned organization does not exist or is inactive');
      }
    } else {
      // Global roles (ADMIN, PASSENGER) do not bind to a specific organization
      organizationId = null;
    }

    const passwordHash = await hashPassword(password);

    const user = await userRepository.createUserWithRole({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: normalizedEmail,
      phone: phone ? phone.trim() : null,
      passwordHash,
      roleName: role,
      organizationId,
      isActive,
      emailVerified,
    });

    await logAuditEvent({
      userId: adminUser?.id || null,
      action: 'ADMIN_CREATE_USER',
      details: { createdUserId: user.id, email: user.email, role, organizationId },
      ipAddress: reqMeta.clientIp,
      userAgent: reqMeta.userAgent,
    });

    const fullUser = await userRepository.findById(user.id);
    return formatSafeUser(fullUser);
  }

  /**
   * Update user details
   */
  async updateUser(id, data, adminUser, reqMeta = {}) {
    const user = await userRepository.findById(id);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    const updatePayload = {};
    if (data.firstName !== undefined) updatePayload.first_name = data.firstName;
    if (data.lastName !== undefined) updatePayload.last_name = data.lastName;
    if (data.phone !== undefined) updatePayload.phone = data.phone;
    if (data.avatarUrl !== undefined) updatePayload.avatar_url = data.avatarUrl;

    const updated = await userRepository.updateUser(id, updatePayload);

    await logAuditEvent({
      userId: adminUser?.id || null,
      action: 'ADMIN_UPDATE_USER',
      details: { targetUserId: id, updatedFields: Object.keys(data) },
      ipAddress: reqMeta.clientIp,
      userAgent: reqMeta.userAgent,
    });

    const fullUser = await userRepository.findById(id);
    return formatSafeUser(fullUser);
  }

  /**
   * Toggle user active status with safeguards against self-lockout & last admin deactivation
   */
  async toggleUserStatus(id, isActive, adminUser, reqMeta = {}) {
    // Prevent self-deactivation
    if (adminUser?.id === id && !isActive) {
      throw new ApiError(400, 'Self-deactivation is prohibited. You cannot deactivate your own account.');
    }

    const user = await userRepository.findById(id);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    // Check last admin safeguard
    if (!isActive) {
      const isTargetAdmin = user.user_roles.some((ur) => ur.roles?.name === ROLES.ADMIN);
      if (isTargetAdmin) {
        const activeAdminCount = await userRepository.countActiveAdmins();
        if (activeAdminCount <= 1) {
          throw new ApiError(400, 'Cannot deactivate the last remaining active Administrator.');
        }
      }
    }

    await userRepository.updateUser(id, { is_active: isActive });

    await logAuditEvent({
      userId: adminUser?.id || null,
      action: isActive ? 'ADMIN_ACTIVATE_USER' : 'ADMIN_DEACTIVATE_USER',
      details: { targetUserId: id, isActive },
      ipAddress: reqMeta.clientIp,
      userAgent: reqMeta.userAgent,
    });

    const fullUser = await userRepository.findById(id);
    return formatSafeUser(fullUser);
  }
}

export const userService = new UserService();
export default userService;
