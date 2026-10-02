import verifierRepository from '../../repository/verifier/verifier.repository.js';
import ApiError from '../../utils/apiError.js';
import { ROLES } from '../../constants/index.js';
import jwt from 'jsonwebtoken';
import env from '../../Config/env.js';

export class VerifierService {
  resolveVerifierOrg(user) {
    if (!user) {
      throw new ApiError(401, 'User context missing.');
    }

    if (user.roles.includes(ROLES.ADMIN)) {
      return user.orgContexts?.[0]?.organizationId || null;
    }

    const verifierContext = user.orgContexts?.find(
      (c) => c.role === ROLES.TICKET_VERIFIER
    );

    if (!verifierContext || !verifierContext.organizationId) {
      throw new ApiError(403, 'Forbidden: Verifier is not assigned to any active organization.');
    }

    return verifierContext.organizationId;
  }

  async getAssignedTrips(user, query) {
    const orgId = this.resolveVerifierOrg(user);
    if (!orgId) {
      throw new ApiError(400, 'Verifier organization context is required.');
    }

    return verifierRepository.findTripsForOrganization(orgId, query);
  }

  async getTripManifest(user, tripId) {
    const orgId = this.resolveVerifierOrg(user);

    const trip = await verifierRepository.findTripById(tripId, orgId);
    if (!trip) {
      throw new ApiError(404, 'Trip not found or does not belong to your organization.');
    }

    return {
      trip: {
        id: trip.id,
        route: trip.routes,
        bus: trip.buses,
        departureTime: trip.departure_time,
        status: trip.status,
      },
      passengerManifest: trip.tickets.map((t) => ({
        ticketId: t.id,
        ticketNumber: t.ticket_number,
        seatNumber: t.seat_number,
        status: t.status,
        passengerName: `${t.passenger?.first_name || ''} ${t.passenger?.last_name || ''}`.trim(),
        phone: t.passenger?.phone,
        verifiedAt: t.verified_at,
      })),
    };
  }

  async verifyTicket(user, { qrToken, tripId }) {
    const orgId = this.resolveVerifierOrg(user);

    // 1. Verify trip exists and belongs to the verifier's organization
    const trip = await verifierRepository.findTripById(tripId, orgId);
    if (!trip) {
      // Check if trip exists under another organization to enforce strict organization isolation
      const anyTrip = await verifierRepository.findTripById(tripId, null);
      if (anyTrip && anyTrip.organization_id !== orgId) {
        throw new ApiError(403, 'Forbidden: You cannot verify tickets for an organization you do not belong to.');
      }
      throw new ApiError(404, 'Trip not found.');
    }

    // 2. Decode and validate QR token
    let ticket = null;
    let decodedToken = null;

    try {
      decodedToken = jwt.verify(qrToken, env.jwt.accessSecret);
    } catch {
      // Could be raw token string lookup fallback
    }

    if (decodedToken && decodedToken.ticketId) {
      ticket = await verifierRepository.findTicketById(decodedToken.ticketId);
    } else {
      ticket = await verifierRepository.findTicketByToken(qrToken);
    }

    // 3. INVALID: If ticket is not found in database or invalid QR
    if (!ticket) {
      await verifierRepository.createVerificationAuditRecord({
        ticketId: null,
        bookingId: null,
        tripId,
        verifierId: user.id,
        organizationId: orgId,
        result: 'INVALID',
        notes: 'Unrecognized or forged QR code',
      });

      return {
        valid: false,
        status: 'INVALID',
        message: 'Invalid or unrecognized ticket QR code.',
      };
    }

    // 4. Organization boundary check: Ticket belongs to another operator
    if (ticket.organization_id !== orgId) {
      await verifierRepository.createVerificationAuditRecord({
        ticketId: ticket.id,
        bookingId: ticket.booking_id,
        tripId,
        verifierId: user.id,
        organizationId: orgId,
        result: 'INVALID',
        notes: `Ticket belongs to organization ${ticket.organization_id}, not verifier organization ${orgId}`,
      });

      return {
        valid: false,
        status: 'INVALID',
        message: 'This ticket belongs to a different bus company.',
      };
    }

    // 5. WRONG_TRIP: Ticket is valid, but for a different trip
    if (ticket.trip_id !== tripId) {
      await verifierRepository.createVerificationAuditRecord({
        ticketId: ticket.id,
        bookingId: ticket.booking_id,
        tripId,
        verifierId: user.id,
        organizationId: orgId,
        result: 'WRONG_TRIP',
        notes: `Ticket scheduled for trip ${ticket.trip_id}, attempted boarding for trip ${tripId}`,
      });

      return {
        valid: false,
        status: 'WRONG_TRIP',
        message: 'Ticket is valid, but scheduled for a different trip.',
        ticket: {
          id: ticket.id,
          seat: ticket.seat_number,
          scheduledTripId: ticket.trip_id,
        },
      };
    }

    // 6. CANCELLED: Ticket or booking has been cancelled
    if (ticket.status === 'CANCELLED' || ticket.bookings?.status === 'CANCELLED') {
      await verifierRepository.createVerificationAuditRecord({
        ticketId: ticket.id,
        bookingId: ticket.booking_id,
        tripId,
        verifierId: user.id,
        organizationId: orgId,
        result: 'CANCELLED',
        notes: 'Attempted boarding with cancelled ticket',
      });

      return {
        valid: false,
        status: 'CANCELLED',
        message: 'This ticket has been cancelled and cannot be used for boarding.',
      };
    }

    // 7. ALREADY_USED: Ticket has already been scanned/used
    if (ticket.status === 'USED') {
      await verifierRepository.createVerificationAuditRecord({
        ticketId: ticket.id,
        bookingId: ticket.booking_id,
        tripId,
        verifierId: user.id,
        organizationId: orgId,
        result: 'ALREADY_USED',
        notes: `Ticket previously verified at ${ticket.verified_at}`,
      });

      return {
        valid: false,
        status: 'ALREADY_USED',
        message: 'This ticket has already been verified.',
      };
    }

    // 8. ATOMIC DOUBLE-VERIFICATION PREVENTION
    const success = await verifierRepository.atomicallyVerifyTicket(ticket.id, user.id);

    if (!success) {
      // Another concurrent verification request won the race
      await verifierRepository.createVerificationAuditRecord({
        ticketId: ticket.id,
        bookingId: ticket.booking_id,
        tripId,
        verifierId: user.id,
        organizationId: orgId,
        result: 'ALREADY_USED',
        notes: 'Concurrent verification collision prevented',
      });

      return {
        valid: false,
        status: 'ALREADY_USED',
        message: 'This ticket has already been verified.',
      };
    }

    // 9. VALID: Verification successful
    await verifierRepository.createVerificationAuditRecord({
      ticketId: ticket.id,
      bookingId: ticket.booking_id,
      tripId,
      verifierId: user.id,
      organizationId: orgId,
      result: 'VALID',
      notes: 'Passenger boarding permitted',
    });

    const passengerName = `${ticket.passenger?.first_name || ''} ${ticket.passenger?.last_name || ''}`.trim();

    return {
      valid: true,
      status: 'VALID',
      message: 'Ticket verified successfully. Passenger may board.',
      ticket: {
        id: ticket.id,
        ticketNumber: ticket.ticket_number,
        seat: `A${ticket.seat_number}`,
        seatNumber: ticket.seat_number,
        tripId: ticket.trip_id,
        passenger: {
          id: ticket.passenger?.id,
          name: passengerName,
          email: ticket.passenger?.email,
          phone: ticket.passenger?.phone,
        },
      },
    };
  }

  async getRecentVerifications(user) {
    const orgId = this.resolveVerifierOrg(user);
    return verifierRepository.getRecentVerifications(user.id, orgId);
  }
}

export const verifierService = new VerifierService();
export default verifierService;
