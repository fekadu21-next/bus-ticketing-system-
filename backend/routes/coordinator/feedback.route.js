import { Router } from 'express';
import coordinatorFeedbackController from '../../controllers/coordinator/feedback.controller.js';
import { authenticate } from '../../middleware/authenticate.middleware.js';
import { authorizeOrgRole } from '../../middleware/organization.middleware.js';
import { ROLES } from '../../constants/index.js';

const router = Router({ mergeParams: true });

router.use(authenticate);
router.use(authorizeOrgRole([ROLES.BOOKING_COORDINATOR, ROLES.OPERATIONAL_MANAGER, 'OPERATOR', 'MANAGER']));

router.get('/', coordinatorFeedbackController.getOrganizationFeedbacks);

export default router;

