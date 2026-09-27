import { Router } from 'express';
import reportController from '../../controllers/coordinator/report.controller.js';

const router = Router({ mergeParams: true });

router.get('/', reportController.getOperationalStats);

export default router;
