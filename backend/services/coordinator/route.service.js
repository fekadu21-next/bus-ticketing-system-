import routeRepository from '../../repository/coordinator/route.repository.js';
import ApiError from '../../utils/apiError.js';

export class RouteService {
  async createRoute(organizationId, routeData) {
    if (!organizationId) {
      throw new ApiError(400, 'Organization context is required.');
    }

    const existing = await routeRepository.findDuplicate(
      organizationId,
      routeData.origin,
      routeData.destination
    );
    if (existing) {
      throw new ApiError(409, `Route from '${routeData.origin}' to '${routeData.destination}' already exists in your organization.`);
    }

    return routeRepository.create({
      organizationId,
      origin: routeData.origin,
      destination: routeData.destination,
      distanceKm: routeData.distanceKm,
      estimatedDurationHours: routeData.estimatedDurationHours,
      isActive: routeData.isActive ?? true,
    });
  }

  async getRoutes(organizationId, query) {
    if (!organizationId) {
      throw new ApiError(400, 'Organization context is required.');
    }
    return routeRepository.findAll(organizationId, query);
  }

  async getRouteById(routeId, organizationId) {
    if (!organizationId) {
      throw new ApiError(400, 'Organization context is required.');
    }

    const route = await routeRepository.findById(routeId, organizationId);
    if (!route) {
      throw new ApiError(404, 'Route not found or does not belong to your organization.');
    }

    return route;
  }

  async updateRoute(routeId, organizationId, updateData) {
    const route = await this.getRouteById(routeId, organizationId);

    const newOrigin = updateData.origin || route.origin;
    const newDestination = updateData.destination || route.destination;

    if (newOrigin.toLowerCase() === newDestination.toLowerCase()) {
      throw new ApiError(400, 'Origin and destination cannot be identical.');
    }

    if (updateData.origin || updateData.destination) {
      const duplicate = await routeRepository.findDuplicate(organizationId, newOrigin, newDestination);
      if (duplicate && duplicate.id !== routeId) {
        throw new ApiError(409, `Route from '${newOrigin}' to '${newDestination}' already exists in your organization.`);
      }
    }

    return routeRepository.update(routeId, organizationId, updateData);
  }

  async deleteRoute(routeId, organizationId) {
    await this.getRouteById(routeId, organizationId);

    const activeTripsCount = await routeRepository.countActiveTrips(routeId);
    if (activeTripsCount > 0) {
      throw new ApiError(400, `Cannot delete route with ${activeTripsCount} active or scheduled trip(s).`);
    }

    return routeRepository.delete(routeId, organizationId);
  }
}

export const routeService = new RouteService();
export default routeService;
