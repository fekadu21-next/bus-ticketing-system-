import routeService from '../../services/coordinator/route.service.js';
import asyncHandler from '../../utils/asyncHandler.js';

export class RouteController {
  createRoute = asyncHandler(async (req, res) => {
    const route = await routeService.createRoute(req.organizationId, req.body);
    res.status(201).json({
      success: true,
      message: 'Route created successfully.',
      data: { route },
    });
  });

  getRoutes = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '20', 10);
    const search = req.query.search || '';
    const isActive = req.query.isActive !== undefined ? req.query.isActive === 'true' : null;

    const result = await routeService.getRoutes(req.organizationId, { page, limit, search, isActive });
    res.status(200).json({
      success: true,
      data: result,
    });
  });

  getRouteById = asyncHandler(async (req, res) => {
    const { routeId } = req.params;
    const route = await routeService.getRouteById(routeId, req.organizationId);
    res.status(200).json({
      success: true,
      data: { route },
    });
  });

  updateRoute = asyncHandler(async (req, res) => {
    const { routeId } = req.params;
    const route = await routeService.updateRoute(routeId, req.organizationId, req.body);
    res.status(200).json({
      success: true,
      message: 'Route updated successfully.',
      data: { route },
    });
  });

  deleteRoute = asyncHandler(async (req, res) => {
    const { routeId } = req.params;
    await routeService.deleteRoute(routeId, req.organizationId);
    res.status(200).json({
      success: true,
      message: 'Route deleted successfully.',
    });
  });
}

export const routeController = new RouteController();
export default routeController;
