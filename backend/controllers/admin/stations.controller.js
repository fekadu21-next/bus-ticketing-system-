import stationsService from '../../services/admin/stations.service.js';
import asyncHandler from '../../utils/asyncHandler.js';
import { logAuditEvent } from '../../utils/auditLogger.js';

class StationsController {
  getStations = asyncHandler(async (req, res) => {
    const query = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,
      search: req.query.search || '',
      city: req.query.city || '',
      isActive: req.query.isActive !== undefined ? req.query.isActive === 'true' : null,
    };

    const result = await stationsService.getStations(query);
    res.status(200).json({
      success: true,
      data: result,
    });
  });

  getStationById = asyncHandler(async (req, res) => {
    const { stationId } = req.params;
    const station = await stationsService.getStationById(stationId);
    res.status(200).json({
      success: true,
      data: { station },
    });
  });

  createStation = asyncHandler(async (req, res) => {
    const reqMeta = {
      clientIp: req.ip,
      userAgent: req.headers['user-agent'],
    };

    const station = await stationsService.createStation(req.body);

    await logAuditEvent({
      userId: req.user?.id || null,
      action: 'STATION_CREATED',
      details: { stationId: station.id, stationName: station.name },
      ipAddress: reqMeta.clientIp,
      userAgent: reqMeta.userAgent,
    });

    res.status(201).json({
      success: true,
      message: 'Station created successfully.',
      data: { station },
    });
  });

  updateStation = asyncHandler(async (req, res) => {
    const { stationId } = req.params;
    const reqMeta = {
      clientIp: req.ip,
      userAgent: req.headers['user-agent'],
    };

    console.log('Update station request:', { stationId, body: req.body });

    const station = await stationsService.updateStation(stationId, req.body, req.user, reqMeta);

    res.status(200).json({
      success: true,
      message: 'Station updated successfully.',
      data: { station },
    });
  });

  deleteStation = asyncHandler(async (req, res) => {
    const { stationId } = req.params;
    const reqMeta = {
      clientIp: req.ip,
      userAgent: req.headers['user-agent'],
    };

    const result = await stationsService.deleteStation(stationId, req.user, reqMeta);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  });

  getActiveStations = asyncHandler(async (req, res) => {
    const stations = await stationsService.getAllActiveStations();
    res.status(200).json({
      success: true,
      data: { stations },
    });
  });
}

export const stationsController = new StationsController();
export default stationsController;
