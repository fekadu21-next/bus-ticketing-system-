import adminOrganizationService from '../../services/admin/organization.service.js';
import asyncHandler from '../../utils/asyncHandler.js';

export class AdminOrganizationController {
  /**
   * GET /api/v1/admin/organizations
   */
  getOrganizations = asyncHandler(async (req, res) => {
    const { page, limit, status, type, search } = req.query;
    const result = await adminOrganizationService.getOrganizations({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
      status: status || null,
      type: type || null,
      search: search ? search.trim() : '',
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  });

  /**
   * GET /api/v1/admin/organizations/:id
   */
  getOrganizationById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await adminOrganizationService.getOrganizationById(id);

    res.status(200).json({
      success: true,
      data: {
        organization: result,
      },
    });
  });

  /**
   * PATCH /api/v1/admin/organizations/:id/approve
   */
  approveOrganization = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const reqMeta = {
      clientIp: req.ip,
      userAgent: req.headers['user-agent'],
    };

    const organization = await adminOrganizationService.approveOrganization(id, req.user, reqMeta);

    res.status(200).json({
      success: true,
      message: 'Organization approved successfully',
      data: {
        organization,
      },
    });
  });

  /**
   * PATCH /api/v1/admin/organizations/:id/reject
   */
  rejectOrganization = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body || {};
    const reqMeta = {
      clientIp: req.ip,
      userAgent: req.headers['user-agent'],
    };

    const organization = await adminOrganizationService.rejectOrganization(
      id,
      { reason },
      req.user,
      reqMeta
    );

    res.status(200).json({
      success: true,
      message: 'Organization rejected successfully',
      data: {
        organization,
      },
    });
  });

  /**
   * PATCH /api/v1/admin/organizations/:id/suspend
   */
  suspendOrganization = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body || {};
    const reqMeta = {
      clientIp: req.ip,
      userAgent: req.headers['user-agent'],
    };

    const organization = await adminOrganizationService.suspendOrganization(
      id,
      { reason },
      req.user,
      reqMeta
    );

    res.status(200).json({
      success: true,
      message: 'Organization suspended successfully',
      data: {
        organization,
      },
    });
  });

  /**
   * PATCH /api/v1/admin/organizations/:id/activate
   */
  activateOrganization = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const reqMeta = {
      clientIp: req.ip,
      userAgent: req.headers['user-agent'],
    };

    const organization = await adminOrganizationService.activateOrganization(id, req.user, reqMeta);

    res.status(200).json({
      success: true,
      message: 'Organization activated successfully',
      data: {
        organization,
      },
    });
  });
}

export const adminOrganizationController = new AdminOrganizationController();
export default adminOrganizationController;
