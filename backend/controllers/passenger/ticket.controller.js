import passengerTicketService from '../../services/passenger/ticket.service.js';
import asyncHandler from '../../utils/asyncHandler.js';

export class PassengerTicketController {
  getTickets = asyncHandler(async (req, res) => {
    const result = await passengerTicketService.getTickets(req.user.id, req.query);

    res.status(200).json({
      success: true,
      data: result,
    });
  });

  getTicketById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const ticket = await passengerTicketService.getTicketById(id, req.user.id);

    res.status(200).json({
      success: true,
      data: { ticket },
    });
  });
}

export const passengerTicketController = new PassengerTicketController();
export default passengerTicketController;
