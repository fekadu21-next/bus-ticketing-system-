import prisma from '../../Config/db.js';
import ApiError from '../../utils/apiError.js';
import jwt from 'jsonwebtoken';
import env from '../../Config/env.js';

export class PassengerPaymentRepository {
  async findBookingForPayment(bookingId, passengerId) {
    return prisma.bookings.findFirst({
      where: {
        id: bookingId,
        passenger_id: passengerId,
      },
      include: {
        trips: {
          include: {
            routes: true,
            buses: true,
          },
        },
        seats: true,
        organizations: true,
        payments: true,
        users: {
          select: { id: true, first_name: true, last_name: true, email: true, phone: true },
        },
      },
    });
  }

  async createOrUpdatePayment({ bookingId, organizationId, amount, paymentMethod, transactionReference }) {
    const existingPayment = await prisma.payments.findUnique({
      where: { booking_id: bookingId },
    });

    if (existingPayment) {
      if (existingPayment.status === 'COMPLETED') {
        throw new ApiError(400, 'This booking has already been paid for.');
      }
      return prisma.payments.update({
        where: { booking_id: bookingId },
        data: {
          payment_method: paymentMethod,
          transaction_reference: transactionReference,
          amount,
          status: 'PENDING',
          updated_at: new Date(),
        },
      });
    }

    return prisma.payments.create({
      data: {
        booking_id: bookingId,
        organization_id: organizationId,
        amount,
        currency: 'ETB',
        payment_method: paymentMethod,
        transaction_reference: transactionReference,
        status: 'PENDING',
      },
    });
  }

  async findPaymentByBookingOrRef({ bookingId, transactionReference, passengerId }) {
    const where = {};
    if (bookingId) {
      where.booking_id = bookingId;
    }
    if (transactionReference) {
      where.transaction_reference = transactionReference;
    }

    return prisma.payments.findFirst({
      where,
      include: {
        bookings: {
          include: {
            users: { select: { id: true, first_name: true, last_name: true, email: true } },
            trips: {
              include: {
                routes: true,
                buses: true,
              },
            },
            seats: true,
            organizations: true,
            tickets: true,
          },
        },
      },
    });
  }

  async completePaymentAndIssueTicket(paymentId) {
    return prisma.$transaction(async (tx) => {
      // 1. Get payment with full booking details
      const payment = await tx.payments.findUnique({
        where: { id: paymentId },
        include: {
          bookings: {
            include: {
              users: true,
              trips: {
                include: {
                  routes: true,
                  buses: true,
                },
              },
              seats: true,
              organizations: true,
              tickets: true,
            },
          },
        },
      });

      if (!payment) {
        throw new ApiError(404, 'Payment record not found.');
      }

      if (payment.status === 'COMPLETED' && payment.bookings?.tickets) {
        return {
          payment,
          booking: payment.bookings,
          ticket: payment.bookings.tickets,
        };
      }

      const booking = payment.bookings;
      if (!booking) {
        throw new ApiError(404, 'Associated booking not found.');
      }

      // 2. Mark payment COMPLETED
      const updatedPayment = await tx.payments.update({
        where: { id: payment.id },
        data: {
          status: 'COMPLETED',
          updated_at: new Date(),
        },
      });

      // 3. Mark booking CONFIRMED
      const updatedBooking = await tx.bookings.update({
        where: { id: booking.id },
        data: {
          status: 'CONFIRMED',
          updated_at: new Date(),
        },
      });

      // 4. Mark seat BOOKED
      if (booking.seat_id) {
        await tx.seats.update({
          where: { id: booking.seat_id },
          data: {
            status: 'BOOKED',
            updated_at: new Date(),
          },
        });
      }

      // 5. Generate Digital Ticket if not already generated
      let ticket = await tx.tickets.findUnique({
        where: { booking_id: booking.id },
      });

      if (!ticket) {
        const timestamp = Date.now().toString(36).toUpperCase();
        const rand = Math.floor(1000 + Math.random() * 9000);
        const ticketNumber = `TKT-${timestamp}-${rand}`;

        // Create initial ticket to obtain ID
        const preTicket = await tx.tickets.create({
          data: {
            ticket_number: ticketNumber,
            booking_id: booking.id,
            passenger_id: booking.passenger_id,
            trip_id: booking.trip_id,
            seat_id: booking.seat_id,
            seat_number: booking.seat_number,
            organization_id: booking.organization_id,
            status: 'UNUSED',
            qr_token: 'PENDING_GENERATION',
          },
        });

        // Sign secure cryptographic QR token
        const qrPayload = {
          ticketId: preTicket.id,
          bookingId: booking.id,
          tripId: booking.trip_id,
          organizationId: booking.organization_id,
          seatNumber: booking.seat_number,
          type: 'TICKET_BOARDING_PASS',
        };

        const signedQrToken = jwt.sign(qrPayload, env.jwt.accessSecret);

        ticket = await tx.tickets.update({
          where: { id: preTicket.id },
          data: {
            qr_token: signedQrToken,
            updated_at: new Date(),
          },
        });
      }

      return {
        payment: updatedPayment,
        booking: updatedBooking,
        ticket,
      };
    });
  }
}

export const passengerPaymentRepository = new PassengerPaymentRepository();
export default passengerPaymentRepository;
