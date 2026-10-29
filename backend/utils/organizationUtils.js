import prisma from '../Config/db.js';
import ApiError from './apiError.js';

/**
 * Asserts that the specified organization exists, is approved by platform admins, and is active.
 * Throws a 403 ApiError if organization is pending, rejected, or suspended.
 * @param {string} organizationId - Target organization UUID
 * @returns {Promise<object>} The active approved organization record
 */
export async function assertApprovedOrganization(organizationId) {
  if (!organizationId) {
    throw new ApiError(400, 'Organization context is required.');
  }

  const org = await prisma.organizations.findUnique({
    where: { id: organizationId },
    select: {
      id: true,
      name: true,
      status: true,
      is_active: true,
      created_at: true,
    },
  });

  if (!org) {
    throw new ApiError(404, 'Organization not found.');
  }

  if (org.status !== 'APPROVED') {
    throw new ApiError(
      403,
      `Forbidden: Organization "${org.name}" is ${org.status.toLowerCase()}. Creating or modifying operational resources (trips, routes, fleet buses, drivers, staff) is restricted until approved by a platform administrator.`
    );
  }

  if (!org.is_active) {
    throw new ApiError(
      403,
      `Forbidden: Organization "${org.name}" is inactive. You cannot modify operational resources.`
    );
  }

  return org;
}

export default {
  assertApprovedOrganization,
};

