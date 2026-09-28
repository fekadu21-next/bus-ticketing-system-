import busService from '../../services/coordinator/bus.service.js';
import asyncHandler from '../../utils/asyncHandler.js';

export class BusController {
  createBus = asyncHandler(async (req, res) => {
    const bus = await busService.createBus(req.organizationId, req.body);
    res.status(201).json({
      success: true,
      message: 'Bus created successfully.',
      data: { bus },
    });
  });

  getBuses = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '20', 10);
    const search = req.query.search || '';
    const isActive = req.query.isActive !== undefined ? req.query.isActive === 'true' : null;

    const result = await busService.getBuses(req.organizationId, { page, limit, search, isActive });
    res.status(200).json({
      success: true,
      data: result,
    });
  });

  getBusById = asyncHandler(async (req, res) => {
    const { busId } = req.params;
    const bus = await busService.getBusById(busId, req.organizationId);
    res.status(200).json({
      success: true,
      data: { bus },
    });
  });

  updateBus = asyncHandler(async (req, res) => {
    const { busId } = req.params;
    const bus = await busService.updateBus(busId, req.organizationId, req.body);
    res.status(200).json({
      success: true,
      message: 'Bus updated successfully.',
      data: { bus },
    });
  });

  deleteBus = asyncHandler(async (req, res) => {
    const { busId } = req.params;
    await busService.deleteBus(busId, req.organizationId);
    res.status(200).json({
      success: true,
      message: 'Bus deleted successfully.',
    });
  });
}

export const busController = new BusController();
export default busController;
