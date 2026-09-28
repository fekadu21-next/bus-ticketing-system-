import { Router } from 'express';
import routeController from '../../controllers/coordinator/route.controller.js';
import validate from '../../middleware/validate.middleware.js';
import { createRouteSchema, updateRouteSchema } from '../../validation/coordinator/route.validation.js';

const router = Router({ mergeParams: true });

router.route('/')
  .get(routeController.getRoutes)
  .post(validate(createRouteSchema), routeController.createRoute);

router.route('/:routeId')
  .get(routeController.getRouteById)
  .patch(validate(updateRouteSchema), routeController.updateRoute)
  .delete(routeController.deleteRoute);

export default router;
