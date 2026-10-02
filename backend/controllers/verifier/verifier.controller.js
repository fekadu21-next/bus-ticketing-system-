import verifierService from '../../services/verifier/verifier.service.js';
import asyncHandler from '../../utils/asyncHandler.js';

export class VerifierController {
  getAssignedTrips = asyncHandler(async (req, res) => {
    const result = await verifierService.getAssignedTrips(req.user, req.query);

    res.status(200).json({
      success: true,
      data: result,
    });
  });

  getTripManifest = asyncHandler(async (req, res) => {
    const { tripId } = req.params;
    const result = await verifierService.getTripManifest(req.user, tripId);

    res.status(200).json({
      success: true,
      data: result,
    });
  });

  verifyTicket = asyncHandler(async (req, res) => {
    const result = await verifierService.verifyTicket(req.user, req.body);

    res.status(200).json({
      success: true,
      data: result,
    });
  });

  getRecentVerifications = asyncHandler(async (req, res) => {
    const result = await verifierService.getRecentVerifications(req.user);

    res.status(200).json({
      success: true,
      data: { verifications: result },
    });
  });
}

export const verifierController = new VerifierController();
export default verifierController;
