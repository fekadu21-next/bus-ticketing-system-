import { Router } from 'express';
import platformFeedbackController from '../controllers/platformFeedback.controller.js';
import { authenticate } from '../middleware/authenticate.middleware.js';
import { authorizeRole } from '../middleware/authorize.middleware.js';
import { ROLES } from '../constants/index.js';
import validate from '../middleware/validate.middleware.js';
import {
  submitPlatformFeedbackSchema,
  updatePlatformFeedbackStatusSchema,
} from '../validation/platformFeedback.validation.js';

const router = Router();

// All platform feedback routes require authentication
router.use(authenticate);

// 1. User submitting and viewing own feedback (any authenticated user: passenger, driver, verifier, coordinator)
router.post('/', validate(submitPlatformFeedbackSchema), platformFeedbackController.submitFeedback);
router.get('/my', platformFeedbackController.getMyFeedbacks);

// 2. Admin operations
router.get('/admin', authorizeRole(ROLES.ADMIN), platformFeedbackController.getAllFeedbacks);
router.patch('/admin/:id', authorizeRole(ROLES.ADMIN), validate(updatePlatformFeedbackStatusSchema), platformFeedbackController.respondToFeedback);

export default router;
