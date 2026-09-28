import { Router } from 'express';
import busController from '../../controllers/coordinator/bus.controller.js';
import validate from '../../middleware/validate.middleware.js';
import { createBusSchema, updateBusSchema } from '../../validation/coordinator/bus.validation.js';

const router = Router({ mergeParams: true });

router.route('/')
  .get(busController.getBuses)
  .post(validate(createBusSchema), busController.createBus);

router.route('/:busId')
  .get(busController.getBusById)
  .patch(validate(updateBusSchema), busController.updateBus)
  .delete(busController.deleteBus);

export default router;
