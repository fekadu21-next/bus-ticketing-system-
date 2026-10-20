import { Router } from 'express';
import { coordinatorStaffController } from '../../controllers/coordinator/staff.controller.js';
import authenticate from '../../middleware/authenticate.middleware.js';
import { authorizeRole } from '../../middleware/authorize.middleware.js';
import { ROLES } from '../../constants/index.js';

const router = Router({ mergeParams: true });

router.use(authenticate);
router.use(authorizeRole(ROLES.BOOKING_COORDINATOR, ROLES.OPERATIONAL_MANAGER));

// Staff endpoints
router.get('/', coordinatorStaffController.getStaff);
router.post('/', coordinatorStaffController.createStaff);
router.patch('/:staffId/status', coordinatorStaffController.toggleStaffStatus);
router.patch('/:staffId', coordinatorStaffController.updateStaff);

// Driver-specific endpoints
router.get('/drivers', coordinatorStaffController.getDrivers);
router.get('/drivers/:driverId', coordinatorStaffController.getDriverById);
router.post('/drivers', coordinatorStaffController.createDriver);
router.patch('/drivers/:driverId', coordinatorStaffController.updateDriver);
router.patch('/drivers/:driverId/status', coordinatorStaffController.toggleDriverStatus);

export default router;
