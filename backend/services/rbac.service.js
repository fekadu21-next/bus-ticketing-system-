import rbacRepository from '../repository/rbac.repository.js';
import userRepository from '../repository/user.repository.js';
import organizationRepository from '../repository/organization.repository.js';
import ApiError from '../utils/apiError.js';
import { logAuditEvent } from '../utils/auditLogger.js';
import { ROLES } from '../constants/index.js';

export class RbacService {
  /**
   * Get all roles in system with permission details
   */
  async getRoles() {
    const roles = await rbacRepository.findAllRoles();
    return roles.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      permissions: r.role_permissions.map((rp) => rp.permissions?.name).filter(Boolean),
    }));
  }

  /**
   * Get single role by ID
   */
  async getRoleById(id) {
    const role = await rbacRepository.findRoleById(id);
    if (!role) {
      throw new ApiError(404, 'Role not found');
    }
    return {
      id: role.id,
      name: role.name,
      description: role.description,
      permissions: role.role_permissions.map((rp) => rp.permissions?.name).filter(Boolean),
    };
  }

  /**
   * Get all permissions in system
   */
  async getPermissions() {
    return rbacRepository.findAllPermissions();
  }

  /**
   * Get roles and organization contexts for a specific user
   */
  async getUserRoles(userId) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    return user.user_roles.map((ur) => ({
      userRoleId: ur.id,
      roleId: ur.role_id,
      roleName: ur.roles?.name,
      organizationId: ur.organization_id,
      organizationName: ur.organizations?.name || null,
      createdAt: ur.created_at,
    }));
  }

  /**
   * Assign a role to a user
   */
  async assignRoleToUser({ userId, roleName, organizationId = null }, adminUser, reqMeta = {}) {
    // 1. Prevent self-role modification
    if (adminUser?.id === userId) {
      throw new ApiError(400, 'Self-role modification is prohibited. You cannot alter your own roles.');
    }

    // 2. Verify target user exists
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    // 3. Verify role exists
    const role = await rbacRepository.findRoleByName(roleName);
    if (!role) {
      throw new ApiError(404, `Role '${roleName}' does not exist.`);
    }

    // 4. Role-Organization Validation:
    // BOOKING_COORDINATOR and TICKET_VERIFIER must be bound to a valid organization
    if (roleName === ROLES.BOOKING_COORDINATOR || roleName === ROLES.TICKET_VERIFIER) {
      if (!organizationId) {
        throw new ApiError(400, `Organization ID is required for role '${roleName}'.`);
      }
      const org = await organizationRepository.findById(organizationId);
      if (!org || !org.is_active) {
        throw new ApiError(400, 'Target organization does not exist or is inactive.');
      }
    } else {
      // Global roles (ADMIN, PASSENGER) do not bind to organizations
      organizationId = null;
    }

    // 5. Prevent duplicate assignment
    const existingRole = await rbacRepository.findSpecificUserRole({
      userId,
      roleId: role.id,
      organizationId,
    });
    if (existingRole) {
      throw new ApiError(409, `User already holds the role '${roleName}' for this scope.`);
    }

    const assigned = await rbacRepository.assignRole({
      userId,
      roleId: role.id,
      organizationId,
    });

    await logAuditEvent({
      userId: adminUser?.id || null,
      action: 'ADMIN_ASSIGN_ROLE',
      details: { targetUserId: userId, roleName, organizationId, userRoleId: assigned.id },
      ipAddress: reqMeta.clientIp,
      userAgent: reqMeta.userAgent,
    });

    return {
      userRoleId: assigned.id,
      userId,
      roleName: assigned.roles?.name,
      organizationId: assigned.organization_id,
      organizationName: assigned.organizations?.name || null,
      createdAt: assigned.created_at,
    };
  }

  /**
   * Revoke a role from a user by userRoleId
   */
  async revokeRoleFromUser(userRoleId, adminUser, reqMeta = {}) {
    const userRole = await rbacRepository.findUserRoleById(userRoleId);
    if (!userRole) {
      throw new ApiError(404, 'User role assignment not found.');
    }

    // 1. Prevent self-role modification
    if (adminUser?.id === userRole.user_id) {
      throw new ApiError(400, 'Self-role modification is prohibited. You cannot revoke your own role.');
    }

    // 2. Prevent removing the last active ADMIN
    if (userRole.roles?.name === ROLES.ADMIN) {
      const activeAdminCount = await userRepository.countActiveAdmins();
      if (activeAdminCount <= 1) {
        throw new ApiError(400, 'Cannot revoke the ADMIN role from the last active Administrator.');
      }
    }

    // 3. User must hold at least one role (cannot leave user with 0 roles)
    const allUserRoles = await rbacRepository.findUserRolesByUserId(userRole.user_id);
    if (allUserRoles.length <= 1) {
      throw new ApiError(400, 'Cannot revoke role. User must hold at least one active role in the system.');
    }

    await rbacRepository.revokeUserRole(userRoleId);

    await logAuditEvent({
      userId: adminUser?.id || null,
      action: 'ADMIN_REVOKE_ROLE',
      details: {
        targetUserId: userRole.user_id,
        roleName: userRole.roles?.name,
        organizationId: userRole.organization_id,
        userRoleId,
      },
      ipAddress: reqMeta.clientIp,
      userAgent: reqMeta.userAgent,
    });

    return { success: true, message: 'Role revoked successfully.' };
  }
}

export const rbacService = new RbacService();
export default rbacService;
