import adminOrganizationRepository from '../../repository/admin/organization.repository.js';
import ApiError from '../../utils/apiError.js';
import { AuditAction, logAuditEvent } from '../../utils/auditLogger.js';
import { ORGANIZATION_STATUS, ROLES } from '../../constants/index.js';

export class AdminOrganizationService {
  /**
   * List organizations with pagination and status/type filtering
   */
  async getOrganizations(params) {
    const { total, page, limit, organizations } = await adminOrganizationRepository.findAll(params);

    const formatted = organizations.map((org) => {
      // Find representative: coordinator or first member
      const representative =
        org.user_roles?.find((ur) => ur.roles?.name === ROLES.BOOKING_COORDINATOR) ||
        org.user_roles?.[0];

      return {
        id: org.id,
        name: org.name,
        type: org.type,
        status: org.status,
        isActive: org.is_active,
        email: representative?.users?.email || null,
        phone: representative?.users?.phone || null,
        city: null, // Unsupported by current DB schema
        address: null, // Unsupported by current DB schema
        registrationNumber: null, // Unsupported by current DB schema
        memberCount: org._count?.user_roles || 0,
        createdAt: org.created_at,
        updatedAt: org.updated_at,
      };
    });

    return {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      organizations: formatted,
    };
  }

  /**
   * Get detailed organization profile with representative, members, and approval audit trail
   */
  async getOrganizationById(id) {
    const org = await adminOrganizationRepository.findById(id);
    if (!org) {
      throw new ApiError(404, 'Organization not found');
    }

    const auditHistory = await adminOrganizationRepository.findAuditHistory(id);

    const representative =
      org.user_roles?.find((ur) => ur.roles?.name === ROLES.BOOKING_COORDINATOR) ||
      org.user_roles?.[0];

    const members = org.user_roles?.map((ur) => ({
      userRoleId: ur.id,
      userId: ur.users?.id,
      firstName: ur.users?.first_name,
      lastName: ur.users?.last_name,
      email: ur.users?.email,
      phone: ur.users?.phone,
      role: ur.roles?.name,
      isActive: ur.users?.is_active,
      assignedAt: ur.created_at,
    })) || [];

    return {
      id: org.id,
      name: org.name,
      type: org.type,
      status: org.status,
      isActive: org.is_active,
      city: null,
      address: null,
      registrationNumber: null,
      memberCount: org._count?.user_roles || 0,
      createdAt: org.created_at,
      updatedAt: org.updated_at,
      representative: representative
        ? {
            id: representative.users?.id,
            fullName: `${representative.users?.first_name || ''} ${representative.users?.last_name || ''}`.trim(),
            email: representative.users?.email,
            phone: representative.users?.phone,
            role: representative.roles?.name,
          }
        : null,
      members,
      approvalInfo: {
        currentStatus: org.status,
        lastUpdated: org.updated_at,
        history: auditHistory.map((item) => ({
          action: item.action,
          timestamp: item.created_at,
          performedBy: item.users
            ? `${item.users.first_name} ${item.users.last_name}`.trim()
            : 'System / Admin',
          previousStatus: item.details?.previousStatus || null,
          newStatus: item.details?.newStatus || null,
          reason: item.details?.reason || null,
        })),
      },
    };
  }

  /**
   * Approve organization: PENDING -> APPROVED or SUSPENDED -> APPROVED
   */
  async approveOrganization(id, adminUser, reqMeta = {}) {
    const org = await adminOrganizationRepository.findById(id);
    if (!org) {
      throw new ApiError(404, 'Organization not found');
    }

    if (org.status === ORGANIZATION_STATUS.APPROVED) {
      throw new ApiError(400, 'Organization is already approved.');
    }

    if (org.status === ORGANIZATION_STATUS.REJECTED) {
      throw new ApiError(400, 'Cannot approve a rejected organization. Re-application is required.');
    }

    // Only PENDING and SUSPENDED are valid for approval
    const updated = await adminOrganizationRepository.updateStatus(id, {
      status: ORGANIZATION_STATUS.APPROVED,
      isActive: true,
    });

    await logAuditEvent({
      userId: adminUser?.id || null,
      action: AuditAction.ORGANIZATION_APPROVED,
      details: {
        organizationId: id,
        name: org.name,
        previousStatus: org.status,
        newStatus: ORGANIZATION_STATUS.APPROVED,
      },
      ipAddress: reqMeta.clientIp,
      userAgent: reqMeta.userAgent,
    });

    return {
      id: updated.id,
      name: updated.name,
      type: updated.type,
      status: updated.status,
      isActive: updated.is_active,
      updatedAt: updated.updated_at,
    };
  }

  /**
   * Reject organization: PENDING -> REJECTED
   */
  async rejectOrganization(id, { reason = null } = {}, adminUser, reqMeta = {}) {
    const org = await adminOrganizationRepository.findById(id);
    if (!org) {
      throw new ApiError(404, 'Organization not found');
    }

    if (org.status === ORGANIZATION_STATUS.REJECTED) {
      throw new ApiError(400, 'Organization is already rejected.');
    }

    if (org.status === ORGANIZATION_STATUS.APPROVED) {
      throw new ApiError(400, 'Cannot reject an already approved organization. Use suspend instead.');
    }

    if (org.status === ORGANIZATION_STATUS.SUSPENDED) {
      throw new ApiError(400, 'Cannot reject a suspended organization.');
    }

    const updated = await adminOrganizationRepository.updateStatus(id, {
      status: ORGANIZATION_STATUS.REJECTED,
      isActive: false,
    });

    await logAuditEvent({
      userId: adminUser?.id || null,
      action: AuditAction.ORGANIZATION_REJECTED,
      details: {
        organizationId: id,
        name: org.name,
        previousStatus: org.status,
        newStatus: ORGANIZATION_STATUS.REJECTED,
        reason: reason || 'Application rejected by platform administrator',
      },
      ipAddress: reqMeta.clientIp,
      userAgent: reqMeta.userAgent,
    });

    return {
      id: updated.id,
      name: updated.name,
      type: updated.type,
      status: updated.status,
      isActive: updated.is_active,
      rejectionReason: reason || null,
      updatedAt: updated.updated_at,
    };
  }

  /**
   * Suspend organization: APPROVED -> SUSPENDED
   */
  async suspendOrganization(id, { reason = null } = {}, adminUser, reqMeta = {}) {
    const org = await adminOrganizationRepository.findById(id);
    if (!org) {
      throw new ApiError(404, 'Organization not found');
    }

    if (org.status === ORGANIZATION_STATUS.SUSPENDED) {
      throw new ApiError(400, 'Organization is already suspended.');
    }

    if (org.status === ORGANIZATION_STATUS.PENDING) {
      throw new ApiError(400, 'Cannot suspend a pending organization. Review and reject or approve instead.');
    }

    if (org.status === ORGANIZATION_STATUS.REJECTED) {
      throw new ApiError(400, 'Cannot suspend a rejected organization.');
    }

    const updated = await adminOrganizationRepository.updateStatus(id, {
      status: ORGANIZATION_STATUS.SUSPENDED,
      isActive: false,
    });

    await logAuditEvent({
      userId: adminUser?.id || null,
      action: AuditAction.ORGANIZATION_SUSPENDED,
      details: {
        organizationId: id,
        name: org.name,
        previousStatus: org.status,
        newStatus: ORGANIZATION_STATUS.SUSPENDED,
        reason: reason || 'Operations suspended by platform administrator',
      },
      ipAddress: reqMeta.clientIp,
      userAgent: reqMeta.userAgent,
    });

    return {
      id: updated.id,
      name: updated.name,
      type: updated.type,
      status: updated.status,
      isActive: updated.is_active,
      suspensionReason: reason || null,
      updatedAt: updated.updated_at,
    };
  }

  /**
   * Reactivate organization: SUSPENDED -> APPROVED
   */
  async activateOrganization(id, adminUser, reqMeta = {}) {
    const org = await adminOrganizationRepository.findById(id);
    if (!org) {
      throw new ApiError(404, 'Organization not found');
    }

    if (org.status !== ORGANIZATION_STATUS.SUSPENDED) {
      throw new ApiError(
        400,
        `Cannot activate an organization with status '${org.status}'. Only SUSPENDED organizations can be activated.`
      );
    }

    const updated = await adminOrganizationRepository.updateStatus(id, {
      status: ORGANIZATION_STATUS.APPROVED,
      isActive: true,
    });

    await logAuditEvent({
      userId: adminUser?.id || null,
      action: AuditAction.ORGANIZATION_ACTIVATED,
      details: {
        organizationId: id,
        name: org.name,
        previousStatus: org.status,
        newStatus: ORGANIZATION_STATUS.APPROVED,
      },
      ipAddress: reqMeta.clientIp,
      userAgent: reqMeta.userAgent,
    });

    return {
      id: updated.id,
      name: updated.name,
      type: updated.type,
      status: updated.status,
      isActive: updated.is_active,
      updatedAt: updated.updated_at,
    };
  }
}

export const adminOrganizationService = new AdminOrganizationService();
export default adminOrganizationService;
