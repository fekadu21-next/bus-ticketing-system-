import routeRepository from '../../repository/coordinator/route.repository.js';
import ApiError from '../../utils/apiError.js';

export class RouteService {
  async createRoute(organizationId, routeData) {
    if (!organizationId) {
      throw new ApiError(400, 'Organization context is required.');
    }

    if (!routeData.originStationId || !routeData.destinationStationId) {
      throw new ApiError(400, 'Origin station and destination station are required.');
    }

    if (routeData.originStationId === routeData.destinationStationId) {
      throw new ApiError(400, 'Origin and destination stations cannot be the same.');
    }

    const existing = await routeRepository.findDuplicate(
      organizationId,
      routeData.originStationId,
      routeData.destinationStationId
    );
    if (existing) {
      throw new ApiError(409, 'Route between these stations already exists in your organization.');
    }

    return routeRepository.create({
      organizationId,
      origin: routeData.origin,
      destination: routeData.destination,
      originStationId: routeData.originStationId,
      destinationStationId: routeData.destinationStationId,
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

    const newOriginStationId = updateData.originStationId || route.origin_station_id;
    const newDestinationStationId = updateData.destinationStationId || route.destination_station_id;

    if (newOriginStationId === newDestinationStationId) {
      throw new ApiError(400, 'Origin and destination stations cannot be the same.');
    }

    if (updateData.originStationId || updateData.destinationStationId) {
      const duplicate = await routeRepository.findDuplicate(organizationId, newOriginStationId, newDestinationStationId);
      if (duplicate && duplicate.id !== routeId) {
        throw new ApiError(409, 'Route between these stations already exists in your organization.');
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
