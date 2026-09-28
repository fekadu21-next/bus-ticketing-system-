import organizationRepository from '../repository/organization.repository.js';
import ApiError from '../utils/apiError.js';
import { logAuditEvent } from '../utils/auditLogger.js';

export class OrganizationService {
  /**
   * List organizations with pagination
   */
  async getOrganizations(params) {
    const { total, page, limit, organizations } = await organizationRepository.findAll(params);
    return {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      organizations: organizations.map((org) => ({
        id: org.id,
        name: org.name,
        type: org.type,
        isActive: org.is_active,
        memberCount: org._count?.user_roles || 0,
        createdAt: org.created_at,
        updatedAt: org.updated_at,
      })),
    };
  }

  /**
   * Get organization by ID with its staff members
   */
  async getOrganizationById(id) {
    const org = await organizationRepository.findById(id);
    if (!org) {
      throw new ApiError(404, 'Organization not found');
    }

    const members = org.user_roles.map((ur) => ({
      userRoleId: ur.id,
      userId: ur.users?.id,
      firstName: ur.users?.first_name,
      lastName: ur.users?.last_name,
      email: ur.users?.email,
      phone: ur.users?.phone,
      isActive: ur.users?.is_active,
      role: ur.roles?.name,
    }));

    return {
      id: org.id,
      name: org.name,
      type: org.type,
      isActive: org.is_active,
      createdAt: org.created_at,
      updatedAt: org.updated_at,
      members,
    };
  }

  /**
   * Create a new organization (Admin only)
   */
  async createOrganization({ name, type = 'COMPANY', isActive = true }, adminUser, reqMeta = {}) {
    const existing = await organizationRepository.findByName(name.trim());
    if (existing) {
      throw new ApiError(409, 'An organization with this name already exists.');
    }

    const org = await organizationRepository.create({
      name: name.trim(),
      type: type.trim().toUpperCase(),
      isActive,
    });

    await logAuditEvent({
      userId: adminUser?.id || null,
      action: 'ADMIN_CREATE_ORGANIZATION',
      details: { organizationId: org.id, name: org.name, type: org.type },
      ipAddress: reqMeta.clientIp,
      userAgent: reqMeta.userAgent,
    });

    return {
      id: org.id,
      name: org.name,
      type: org.type,
      isActive: org.is_active,
      createdAt: org.created_at,
      updatedAt: org.updated_at,
    };
  }

  /**
   * Update organization
   */
  async updateOrganization(id, data, adminUser, reqMeta = {}) {
    const org = await organizationRepository.findById(id);
    if (!org) {
      throw new ApiError(404, 'Organization not found');
    }

    if (data.name && data.name.trim().toLowerCase() !== org.name.toLowerCase()) {
      const existing = await organizationRepository.findByName(data.name.trim());
      if (existing) {
        throw new ApiError(409, 'An organization with this name already exists.');
      }
    }

    const updated = await organizationRepository.update(id, data);

    await logAuditEvent({
      userId: adminUser?.id || null,
      action: 'ADMIN_UPDATE_ORGANIZATION',
      details: { organizationId: id, updatedFields: Object.keys(data) },
      ipAddress: reqMeta.clientIp,
      userAgent: reqMeta.userAgent,
    });

    return {
      id: updated.id,
      name: updated.name,
      type: updated.type,
      isActive: updated.is_active,
      updatedAt: updated.updated_at,
    };
  }
}

export const organizationService = new OrganizationService();
export default organizationService;
