import prisma from '../../Config/db.js';
import asyncHandler from '../../utils/asyncHandler.js';
import bcrypt from 'bcryptjs';

export class CoordinatorStaffController {
  /**
   * Get staff members for an organization (Drivers, Verifiers, Coordinators)
   */
  getStaff = asyncHandler(async (req, res) => {
    const orgId = req.organizationId;
    const { role } = req.query;

    const where = {
      organization_id: orgId,
    };

    if (role) {
      where.roles = { name: role };
    }

    const userRoles = await prisma.user_roles.findMany({
      where,
      include: {
        users: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
            phone: true,
            is_active: true,
            created_at: true,
          },
        },
        roles: {
          select: { id: true, name: true, description: true },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    const staff = userRoles.map((ur) => ({
      id: ur.users.id,
      userRoleId: ur.id,
      name: [ur.users.first_name, ur.users.last_name].filter(Boolean).join(' ') || ur.users.email,
      firstName: ur.users.first_name,
      lastName: ur.users.last_name,
      email: ur.users.email,
      phone: ur.users.phone,
      role: ur.roles.name,
      status: ur.users.is_active ? 'ACTIVE' : 'INACTIVE',
      createdAt: ur.users.created_at,
    }));

    res.status(200).json({
      success: true,
      data: { staff },
    });
  });

  /**
   * Add a driver or verifier to the organization
   */
  createStaff = asyncHandler(async (req, res) => {
    const orgId = req.organizationId;
    const { name, firstName, lastName, email, phone, role = 'TICKET_VERIFIER' } = req.body;

    const splitFirst = firstName || (name ? name.split(' ')[0] : 'Staff');
    const splitLast = lastName || (name ? name.split(' ').slice(1).join(' ') : 'Member');
    const safeEmail = email || `${splitFirst.toLowerCase()}.${Date.now()}@operator.et`;

    // Check or find role
    const targetRole = await prisma.roles.findFirst({
      where: { name: role },
    });

    if (!targetRole) {
      return res.status(400).json({
        success: false,
        message: `Role ${role} does not exist in the system.`,
      });
    }

    // Check if user already exists
    let user = await prisma.users.findUnique({
      where: { email: safeEmail },
    });

    if (user) {
      const existingAssignment = await prisma.user_roles.findFirst({
        where: { user_id: user.id, organization_id: orgId },
      });

      if (existingAssignment) {
        return res.status(409).json({
          success: false,
          message: 'User is already assigned to this organization.',
        });
      }

      await prisma.user_roles.create({
        data: {
          user_id: user.id,
          role_id: targetRole.id,
          organization_id: orgId,
        },
      });
    } else {
      const defaultPasswordHash = await bcrypt.hash('Staff@123456', 10);
      user = await prisma.users.create({
        data: {
          first_name: splitFirst,
          last_name: splitLast,
          email: safeEmail,
          phone: phone || null,
          password_hash: defaultPasswordHash,
          is_active: true,
          email_verified: true,
        },
      });

      await prisma.user_roles.create({
        data: {
          user_id: user.id,
          role_id: targetRole.id,
          organization_id: orgId,
        },
      });
    }

    res.status(201).json({
      success: true,
      message: `${role} account created successfully for organization.`,
      data: {
        staff: {
          id: user.id,
          name: `${user.first_name} ${user.last_name}`.trim(),
          email: user.email,
          phone: user.phone,
          role: targetRole.name,
          status: user.is_active ? 'ACTIVE' : 'INACTIVE',
        },
      },
    });
  });

  /**
   * Activate or deactivate staff member
   */
  toggleStaffStatus = asyncHandler(async (req, res) => {
    const orgId = req.organizationId;
    const { staffId } = req.params;
    const { isActive } = req.body;

    const assignment = await prisma.user_roles.findFirst({
      where: { user_id: staffId, organization_id: orgId },
      include: { users: true, roles: true },
    });

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found in your organization.',
      });
    }

    const nextActive = isActive !== undefined ? Boolean(isActive) : !assignment.users.is_active;

    const updatedUser = await prisma.users.update({
      where: { id: staffId },
      data: { is_active: nextActive, updated_at: new Date() },
    });

    res.status(200).json({
      success: true,
      message: `Staff member is now ${nextActive ? 'ACTIVE' : 'INACTIVE'}.`,
      data: {
        staff: {
          id: updatedUser.id,
          name: `${updatedUser.first_name} ${updatedUser.last_name}`.trim(),
          email: updatedUser.email,
          phone: updatedUser.phone,
          role: assignment.roles.name,
          status: updatedUser.is_active ? 'ACTIVE' : 'INACTIVE',
        },
      },
    });
  });

  /**
   * Update staff member details
   */
  updateStaff = asyncHandler(async (req, res) => {
    const orgId = req.organizationId;
    const { staffId } = req.params;
    const { name, firstName, lastName, phone, role } = req.body;

    const assignment = await prisma.user_roles.findFirst({
      where: { user_id: staffId, organization_id: orgId },
      include: { users: true, roles: true },
    });

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found in your organization.',
      });
    }

    const userData = {};
    if (firstName) userData.first_name = firstName.trim();
    if (lastName) userData.last_name = lastName.trim();
    if (name && !firstName && !lastName) {
      const parts = name.trim().split(' ');
      userData.first_name = parts[0];
      userData.last_name = parts.slice(1).join(' ') || 'Staff';
    }
    if (phone !== undefined) userData.phone = phone;

    let updatedUser = assignment.users;
    if (Object.keys(userData).length > 0) {
      userData.updated_at = new Date();
      updatedUser = await prisma.users.update({
        where: { id: staffId },
        data: userData,
      });
    }

    let roleName = assignment.roles.name;
    if (role && role !== assignment.roles.name) {
      const targetRole = await prisma.roles.findFirst({ where: { name: role } });
      if (targetRole) {
        await prisma.user_roles.update({
          where: { id: assignment.id },
          data: { role_id: targetRole.id },
        });
        roleName = targetRole.name;
      }
    }

    res.status(200).json({
      success: true,
      message: 'Staff member updated successfully.',
      data: {
        staff: {
          id: updatedUser.id,
          name: `${updatedUser.first_name} ${updatedUser.last_name}`.trim(),
          email: updatedUser.email,
          phone: updatedUser.phone,
          role: roleName,
          status: updatedUser.is_active ? 'ACTIVE' : 'INACTIVE',
        },
      },
    });
  });
}

export const coordinatorStaffController = new CoordinatorStaffController();
export default coordinatorStaffController;
