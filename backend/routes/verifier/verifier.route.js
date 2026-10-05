import { Router } from 'express';
import verifierController from '../../controllers/verifier/verifier.controller.js';
import validate from '../../middleware/validate.middleware.js';
import {
  getVerifierTripsQuerySchema,
  tripIdParamSchema,
  verifyTicketSchema,
} from '../../validation/verifier/verifier.validation.js';

const router = Router();

router.get('/trips', validate(getVerifierTripsQuerySchema, 'query'), verifierController.getAssignedTrips);
router.get('/trips/:tripId', validate(tripIdParamSchema, 'params'), verifierController.getTripManifest);
router.post('/tickets/verify', validate(verifyTicketSchema), verifierController.verifyTicket);
router.get('/history', verifierController.getRecentVerifications);

export default router;
