import prisma from '../../Config/db.js';

export class PassengerFeedbackRepository {
  async findCompletedBookingForTrip(tripId, passengerId) {
    return prisma.bookings.findFirst({
      where: {
        trip_id: tripId,
        passenger_id: passengerId,
        status: { in: ['CONFIRMED', 'COMPLETED'] },
      },
      include: {
        trips: true,
      },
    });
  }

  async findExistingFeedback(tripId, passengerId) {
    return prisma.feedbacks.findUnique({
      where: {
        uq_trip_passenger_feedback: {
          trip_id: tripId,
          passenger_id: passengerId,
        },
      },
    });
  }

  async createFeedback({ tripId, passengerId, bookingId, organizationId, rating, comment }) {
    return prisma.feedbacks.create({
      data: {
        trip_id: tripId,
        passenger_id: passengerId,
        booking_id: bookingId,
        organization_id: organizationId,
        rating,
        comment: comment || null,
      },
      include: {
        trips: {
          include: {
            routes: true,
          },
        },
        passenger: {
          select: { id: true, first_name: true, last_name: true },
        },
      },
    });
  }

  async findPassengerFeedbacks(passengerId) {
    return prisma.feedbacks.findMany({
      where: { passenger_id: passengerId },
      orderBy: { created_at: 'desc' },
      include: {
        trips: {
          include: {
            routes: true,
            organizations: { select: { id: true, name: true } },
          },
        },
      },
    });
  }
}

export const passengerFeedbackRepository = new PassengerFeedbackRepository();
export default passengerFeedbackRepository;
