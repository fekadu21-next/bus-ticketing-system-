import passengerBookingRepository from '../../repository/passenger/booking.repository.js';
import ApiError from '../../utils/apiError.js';

export class PassengerBookingService {
  formatBooking(booking) {
    if (!booking) return null;

    const trip = booking.trips;
    const route = trip?.routes;
    const bus = trip?.buses;
    const user = booking.users;
    const org = booking.organizations;
    const payment = Array.isArray(booking.payments) ? booking.payments[0] : booking.payments;
    const ticket = Array.isArray(booking.tickets) ? booking.tickets[0] : booking.tickets;

    const depDate = trip?.departure_time;
    const formattedDate = depDate ? new Date(depDate).toISOString().split('T')[0] : '';
    const formattedTime = depDate ? new Date(depDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
    const arrDate = trip?.arrival_time;
    const formattedArrTime = arrDate ? new Date(arrDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

    return {
      id: booking.id,
      bookingId: booking.id,
      status: ['CONFIRMED', 'PENDING'].includes(booking.status) ? 'upcoming' : booking.status.toLowerCase(),
      rawStatus: booking.status,
      from: route?.origin || 'Addis Ababa',
      to: route?.destination || 'Destination',
      origin: route?.origin || 'Addis Ababa',
      destination: route?.destination || 'Destination',
      date: formattedDate,
      departureDate: formattedDate,
      bookingDate: booking.created_at,
      departureTime: formattedTime || '06:00 AM',
      arrivalTime: formattedArrTime || '12:00 PM',
      seatNumber: booking.seat_number,
      seats: [booking.seat_number],
      totalFare: Number(booking.total_fare),
      price: Number(booking.total_fare),
      amount: Number(booking.total_fare),
      operator: org?.name || 'Bus Line',
      operatorName: org?.name || 'Bus Line',
      organizationName: org?.name || 'Bus Line',
      busPlateNumber: bus?.plate_number || 'N/A',
      busModel: bus?.model || '',
      passengerName: user
        ? ([user.first_name, user.last_name].filter(Boolean).join(' ').trim() || user.email?.split('@')[0] || 'Passenger')
        : 'Passenger',
      firstName: user?.first_name || '',
      lastName: user?.last_name || '',
      email: user?.email || '',
      passengerEmail: user?.email || '',
      phone: user?.phone || '',
      passengerPhone: user?.phone || '',
      ticket: ticket ? {
        id: ticket.id,
        ticketNumber: ticket.ticket_number,
        status: ticket.status,
        qrToken: ticket.qr_token,
      } : null,
      ticketNumber: ticket?.ticket_number || `TKT-${booking.id.substring(0, 8).toUpperCase()}`,
      qrToken: ticket?.qr_token || null,
      payment: payment ? {
        id: payment.id,
        amount: Number(payment.amount),
        paymentMethod: payment.payment_method,
        transactionReference: payment.transaction_reference,
        status: payment.status,
      } : null,
      createdAt: booking.created_at,
      trips: trip,
      users: user,
      organizations: org,
    };
  }

  async createBooking(passengerId, bookingData) {
    if (!passengerId) {
      throw new ApiError(401, 'User authentication required.');
    }

    const { tripId, seatId, seatNumber } = bookingData;

    const booking = await passengerBookingRepository.createBookingAtomic({
      passengerId,
      tripId,
      seatId,
      seatNumber,
    });

    return this.formatBooking(booking);
  }

  async getBookings(passengerId, query) {
    if (!passengerId) {
      throw new ApiError(401, 'User authentication required.');
    }

    const result = await passengerBookingRepository.findPassengerBookings(passengerId, query);
    return {
      ...result,
      bookings: (result.bookings || []).map((b) => this.formatBooking(b)),
    };
  }

  async getBookingById(bookingId, passengerId) {
    if (!passengerId) {
      throw new ApiError(401, 'User authentication required.');
    }

    const booking = await passengerBookingRepository.findPassengerBookingById(bookingId, passengerId);

    if (!booking) {
      throw new ApiError(404, 'Booking not found.');
    }

    return this.formatBooking(booking);
  }

  async cancelBooking(bookingId, passengerId) {
    if (!passengerId) {
      throw new ApiError(401, 'User authentication required.');
    }

    const booking = await passengerBookingRepository.cancelBookingAtomic(bookingId, passengerId);
    return this.formatBooking(booking);
  }
}

export const passengerBookingService = new PassengerBookingService();
export default passengerBookingService;
