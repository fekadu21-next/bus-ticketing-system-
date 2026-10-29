import { Router } from 'express';
import passengerTicketController from '../../controllers/passenger/ticket.controller.js';
import validate from '../../middleware/validate.middleware.js';
import {
  ticketIdParamSchema,
  getTicketsQuerySchema,
} from '../../validation/passenger/ticket.validation.js';

const router = Router();

router.get('/', validate(getTicketsQuerySchema, 'query'), passengerTicketController.getTickets);
router.get('/:id', validate(ticketIdParamSchema, 'params'), passengerTicketController.getTicketById);

export default router;
