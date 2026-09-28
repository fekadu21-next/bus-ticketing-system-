import prisma from '../Config/db.js';

export class RbacRepository {
  /**
   * Get all system roles with assigned permissions
   */
  async findAllRoles() {
    return prisma.roles.findMany({
      orderBy: { name: 'asc' },
      include: {
        role_permissions: {
          include: {
            permissions: true,
          },
        },
      },
    });
  }

  /**
   * Find role by name
   */
  async findRoleByName(name) {
    return prisma.roles.findUnique({
      where: { name },
      include: {
        role_permissions: {
          include: {
            permissions: true,
          },
        },
      },
    });
  }

  /**
   * Find role by ID
   */
  async findRoleById(id) {
    return prisma.roles.findUnique({
      where: { id },
      include: {
        role_permissions: {
          include: {
            permissions: true,
          },
        },
      },
    });
  }

  /**
   * Get all system permissions
   */
  async findAllPermissions() {
    return prisma.permissions.findMany({
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Find user role assignment by userRoleId
   */
  async findUserRoleById(id) {
    return prisma.user_roles.findUnique({
      where: { id },
      include: {
        roles: true,
        organizations: true,
        users: true,
      },
    });
  }

  /**
   * Find user roles for a specific user
   */
  async findUserRolesByUserId(userId) {
    return prisma.user_roles.findMany({
      where: { user_id: userId },
      include: {
        roles: {
          include: {
            role_permissions: {
              include: {
                permissions: true,
              },
            },
          },
        },
        organizations: true,
      },
    });
  }

  /**
   * Check if user already has this specific role in this specific organization
   */
  async findSpecificUserRole({ userId, roleId, organizationId = null }) {
    return prisma.user_roles.findFirst({
      where: {
        user_id: userId,
        role_id: roleId,
        organization_id: organizationId || null,
      },
    });
  }

  /**
   * Assign a role to a user (with optional organizationId)
   */
  async assignRole({ userId, roleId, organizationId = null }) {
    return prisma.user_roles.create({
      data: {
        user_id: userId,
        role_id: roleId,
        organization_id: organizationId || null,
      },
      include: {
        roles: true,
        organizations: true,
      },
    });
  }

  /**
   * Revoke a user role by ID
   */
  async revokeUserRole(id) {
    return prisma.user_roles.delete({
      where: { id },
    });
  }
}

export const rbacRepository = new RbacRepository();
export default rbacRepository;
