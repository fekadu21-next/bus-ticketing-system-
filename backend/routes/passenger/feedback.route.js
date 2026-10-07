import { Router } from 'express';
import passengerFeedbackController from '../../controllers/passenger/feedback.controller.js';
import validate from '../../middleware/validate.middleware.js';
import { submitFeedbackSchema } from '../../validation/passenger/feedback.validation.js';

const router = Router();

router.post('/', validate(submitFeedbackSchema), passengerFeedbackController.submitFeedback);
router.get('/', passengerFeedbackController.getMyFeedbacks);

export default router;
