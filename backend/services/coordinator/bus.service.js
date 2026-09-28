import busRepository from '../../repository/coordinator/bus.repository.js';
import ApiError from '../../utils/apiError.js';

export class BusService {
  async createBus(organizationId, busData) {
    if (!organizationId) {
      throw new ApiError(400, 'Organization context is required.');
    }

    const existingBus = await busRepository.findByPlateNumber(busData.plateNumber, organizationId);
    if (existingBus) {
      throw new ApiError(409, `A bus with plate number '${busData.plateNumber}' already exists in your organization.`);
    }

    return busRepository.create({
      organizationId,
      plateNumber: busData.plateNumber,
      model: busData.model,
      capacity: busData.capacity,
      isActive: busData.isActive ?? true,
    });
  }

  async getBuses(organizationId, query) {
    if (!organizationId) {
      throw new ApiError(400, 'Organization context is required.');
    }
    return busRepository.findAll(organizationId, query);
  }

  async getBusById(busId, organizationId) {
    if (!organizationId) {
      throw new ApiError(400, 'Organization context is required.');
    }

    const bus = await busRepository.findById(busId, organizationId);
    if (!bus) {
      throw new ApiError(404, 'Bus not found or does not belong to your organization.');
    }

    return bus;
  }

  async updateBus(busId, organizationId, updateData) {
    const bus = await this.getBusById(busId, organizationId);

    if (updateData.plateNumber && updateData.plateNumber.toLowerCase() !== bus.plate_number.toLowerCase()) {
      const duplicate = await busRepository.findByPlateNumber(updateData.plateNumber, organizationId);
      if (duplicate && duplicate.id !== busId) {
        throw new ApiError(409, `A bus with plate number '${updateData.plateNumber}' already exists in your organization.`);
      }
    }

    return busRepository.update(busId, organizationId, updateData);
  }

  async deleteBus(busId, organizationId) {
    await this.getBusById(busId, organizationId);

    const activeTripsCount = await busRepository.countActiveTrips(busId);
    if (activeTripsCount > 0) {
      throw new ApiError(400, `Cannot delete bus with ${activeTripsCount} active or scheduled trip(s).`);
    }

    return busRepository.delete(busId, organizationId);
  }
}

export const busService = new BusService();
export default busService;
