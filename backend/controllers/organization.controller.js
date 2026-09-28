import organizationService from '../services/organization.service.js';
import asyncHandler from '../utils/asyncHandler.js';

class OrganizationController {
  /**
   * GET /api/v1/organizations
   */
  getOrganizations = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '20', 10);
    const search = req.query.search || '';
    const isActive = req.query.isActive !== undefined ? req.query.isActive === 'true' : null;

    const result = await organizationService.getOrganizations({ page, limit, search, isActive });

    res.status(200).json({
      success: true,
      data: result,
    });
  });

  /**
   * GET /api/v1/organizations/:orgId
   */
  getOrganizationById = asyncHandler(async (req, res) => {
    const { orgId } = req.params;
    const organization = await organizationService.getOrganizationById(orgId);

    res.status(200).json({
      success: true,
      data: { organization },
    });
  });

  /**
   * POST /api/v1/organizations (Admin only)
   */
  createOrganization = asyncHandler(async (req, res) => {
    const reqMeta = {
      clientIp: req.ip,
      userAgent: req.headers['user-agent'],
    };

    const organization = await organizationService.createOrganization(req.body, req.user, reqMeta);

    res.status(201).json({
      success: true,
      message: 'Organization registered successfully.',
      data: { organization },
    });
  });

  /**
   * PATCH /api/v1/organizations/:orgId
   */
  updateOrganization = asyncHandler(async (req, res) => {
    const { orgId } = req.params;
    const reqMeta = {
      clientIp: req.ip,
      userAgent: req.headers['user-agent'],
    };

    const organization = await organizationService.updateOrganization(orgId, req.body, req.user, reqMeta);

    res.status(200).json({
      success: true,
      message: 'Organization updated successfully.',
      data: { organization },
    });
  });

  /**
   * Mock endpoint demonstrating organization-scoped trip scheduling
   * POST /api/v1/organizations/:orgId/trips
   */
  createTrip = asyncHandler(async (req, res) => {
    const { orgId } = req.params;
    const { origin, destination, departureTime, price } = req.body;

    res.status(201).json({
      success: true,
      message: 'Trip scheduled successfully for organization.',
      data: {
        trip: {
          id: 'test-trip-id',
          organizationId: orgId,
          origin,
          destination,
          departureTime,
          price,
          scheduledBy: req.user.email,
        },
      },
    });
  });

  /**
   * Mock endpoint demonstrating organization-scoped ticket verification
   * POST /api/v1/organizations/:orgId/verify-ticket
   */
  verifyTicket = asyncHandler(async (req, res) => {
    const { orgId } = req.params;
    const { ticketCode } = req.body;

    res.status(200).json({
      success: true,
      message: 'Ticket verified successfully for organization boarding.',
      data: {
        ticketCode,
        organizationId: orgId,
        verifiedBy: req.user.email,
        status: 'VALIDATED',
        timestamp: new Date().toISOString(),
      },
    });
  });
}

export const organizationController = new OrganizationController();
export default organizationController;
