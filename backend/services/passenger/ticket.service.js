import passengerTicketRepository from '../../repository/passenger/ticket.repository.js';
import ApiError from '../../utils/apiError.js';

export class PassengerTicketService {
  async getTickets(passengerId, query) {
    if (!passengerId) {
      throw new ApiError(401, 'User authentication required.');
    }

    return passengerTicketRepository.findPassengerTickets(passengerId, query);
  }

  async getTicketById(ticketId, passengerId) {
    if (!passengerId) {
      throw new ApiError(401, 'User authentication required.');
    }

    const ticket = await passengerTicketRepository.findPassengerTicketById(ticketId, passengerId);
    if (!ticket) {
      throw new ApiError(404, 'Ticket not found.');
    }

    return ticket;
  }
}

export const passengerTicketService = new PassengerTicketService();
export default passengerTicketService;
