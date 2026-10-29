import stationsRepository from '../../repository/admin/stations.repository.js';
import ApiError from '../../utils/apiError.js';
import { logAuditEvent } from '../../utils/auditLogger.js';

export class StationsService {
  async createStation(stationData) {
    const { code } = stationData;

    const existingCode = await stationsRepository.findByCode(code);
    if (existingCode) {
      throw new ApiError(409, `Station with code '${code}' already exists.`);
    }

    return stationsRepository.create(stationData);
  }

  async getStations(query) {
    return stationsRepository.findAll(query);
  }

  async getStationById(stationId) {
    const station = await stationsRepository.findById(stationId);
    if (!station) {
      throw new ApiError(404, 'Station not found.');
    }
    return station;
  }

  async updateStation(stationId, updateData, adminUser, reqMeta = {}) {
    const station = await this.getStationById(stationId);

    if (updateData.code && updateData.code !== station.code) {
      const existingCode = await stationsRepository.findByCode(updateData.code);
      if (existingCode) {
        throw new ApiError(409, `Station with code '${updateData.code}' already exists.`);
      }
    }

    const updated = await stationsRepository.update(stationId, updateData);

    await logAuditEvent({
      userId: adminUser?.id || null,
      action: 'STATION_UPDATED',
      details: { stationId, updatedFields: Object.keys(updateData) },
      ipAddress: reqMeta.clientIp,
      userAgent: reqMeta.userAgent,
    });

    return updated;
  }

  async deleteStation(stationId, adminUser, reqMeta = {}) {
    const station = await this.getStationById(stationId);

    try {
      await stationsRepository.delete(stationId);

      await logAuditEvent({
        userId: adminUser?.id || null,
        action: 'STATION_DELETED',
        details: { stationId, stationName: station.name },
        ipAddress: reqMeta.clientIp,
        userAgent: reqMeta.userAgent,
      });

      return { message: 'Station deleted successfully.' };
    } catch (error) {
      if (error.message.includes('linked route')) {
        throw new ApiError(400, error.message);
      }
      throw error;
    }
  }

  async getAllActiveStations() {
    return stationsRepository.getAllActive();
  }
}

export const stationsService = new StationsService();
export default stationsService;
