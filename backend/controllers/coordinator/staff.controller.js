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

    const defaultPasswordHash = await bcrypt.hash('Staff@123456', 10);

    const user = await prisma.users.create({
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

    res.status(201).json({
      success: true,
      message: `${role} account created successfully for organization.`,
      data: {
        staff: {
          id: user.id,
          name: `${splitFirst} ${splitLast}`,
          email: user.email,
          phone: user.phone,
          role: targetRole.name,
          status: 'ACTIVE',
        },
      },
    });
  });
}

export const coordinatorStaffController = new CoordinatorStaffController();
export default coordinatorStaffController;
