import tripRepository from '../../repository/coordinator/trip.repository.js';
import busRepository from '../../repository/coordinator/bus.repository.js';
import routeRepository from '../../repository/coordinator/route.repository.js';
import prisma from '../../Config/db.js';
import ApiError from '../../utils/apiError.js';
import { ROLES } from '../../constants/index.js';
import { logAuditEvent } from '../../utils/auditLogger.js';
import notificationService from '../notification.service.js';
import { NOTIFICATION_TYPES, NOTIFICATION_PRIORITIES } from '../../constants/notification.js';
import { assertApprovedOrganization } from '../../utils/organizationUtils.js';

export class TripService {
  async createTrip(organizationId, tripData) {
    await assertApprovedOrganization(organizationId);

    let busId = tripData.busId;
    let routeId = tripData.routeId;
    const fare = tripData.fare ?? tripData.price;

    // Support route resolution via origin & destination if routeId omitted
    if (!routeId && tripData.origin && tripData.destination) {
      let route = await routeRepository.findDuplicate(organizationId, tripData.origin, tripData.destination);
      if (!route) {
        route = await routeRepository.create({
          organizationId,
          origin: tripData.origin,
          destination: tripData.destination,
          distanceKm: tripData.distanceKm || 350,
          estimatedDurationHours: tripData.estimatedDurationHours || 5.5,
        });
      }
      routeId = route.id;
    }

    // Support bus resolution if busId omitted
    if (!busId) {
      let bus = await prisma.buses.findFirst({
        where: { organization_id: organizationId, is_active: true },
      });
      if (!bus) {
        const rand = Math.floor(1000 + Math.random() * 9000);
        bus = await busRepository.create({
          organizationId,
          plateNumber: `ETH-${rand}`,
          model: 'Standard Coach',
          capacity: 50,
        });
      }
      busId = bus.id;
    }

    // 1. Verify Bus belongs to this organization
    const bus = await busRepository.findById(busId, organizationId);
    if (!bus) {
      throw new ApiError(404, 'Assigned bus not found or does not belong to your organization.');
    }
    if (!bus.is_active) {
      throw new ApiError(400, 'Cannot schedule trip with an inactive bus.');
    }

    // 2. Verify Route belongs to this organization
    const route = await routeRepository.findById(routeId, organizationId);
    if (!route) {
      throw new ApiError(404, 'Assigned route not found or does not belong to your organization.');
    }
    if (!route.is_active) {
      throw new ApiError(400, 'Cannot schedule trip on an inactive route.');
    }

    // 3. Validate timing
    const departure = new Date(tripData.departureTime);
    if (isNaN(departure.getTime())) {
      throw new ApiError(400, 'Invalid departure time.');
    }

    if (tripData.arrivalTime) {
      const arrival = new Date(tripData.arrivalTime);
      if (isNaN(arrival.getTime()) || arrival <= departure) {
        throw new ApiError(400, 'Arrival time must be strictly after departure time.');
      }
    }

    if (tripData.driverId) {
      await this.validateDriverAssignment(tripData.driverId, organizationId, departure, tripData.arrivalTime);
    }

    if (tripData.verifierId) {
      await this.validateVerifierAssignment(tripData.verifierId, organizationId);
    }

    const trip = await tripRepository.create({
      organizationId,
      busId,
      routeId,
      driverId: tripData.driverId,
      verifierId: tripData.verifierId,
      departureTime: departure,
      arrivalTime: tripData.arrivalTime,
      fare,
      capacity: bus.capacity,
    });

    return {
      id: trip.id,
      organizationId: trip.organization_id,
      busId: trip.bus_id,
      routeId: trip.route_id,
      driverId: trip.driver_id,
      verifierId: trip.verifier_id,
      origin: route.origin_station?.name || 'Unknown',
      destination: route.destination_station?.name || 'Unknown',
      originStationId: route.origin_station_id,
      destinationStationId: route.destination_station_id,
      departureTime: trip.departure_time,
      arrivalTime: trip.arrival_time,
      fare: Number(trip.fare),
      price: Number(trip.fare),
      status: trip.status,
      bus: {
        id: bus.id,
        plateNumber: bus.plate_number,
        model: bus.model,
        capacity: bus.capacity,
      },
      route: {
        id: route.id,
        originStation: route.origin_station,
        destinationStation: route.destination_station,
        distanceKm: route.distance_km,
        estimatedDurationHours: route.estimated_duration_hours,
      },
      driver: trip.driver || null,
      verifier: trip.verifier || null,
      createdAt: trip.created_at,
    };
  }

  async validateVerifierAssignment(verifierId, organizationId) {
    if (!verifierId) return null;

    const assignment = await prisma.user_roles.findFirst({
      where: {
        user_id: verifierId,
        organization_id: organizationId,
      },
      include: {
        users: true,
        roles: true,
      },
    });

    if (!assignment) {
      throw new ApiError(404, 'Ticket verifier not found in your organization.');
    }

    if (assignment.roles?.name !== ROLES.TICKET_VERIFIER) {
      throw new ApiError(400, 'Assigned user does not hold the TICKET_VERIFIER role.');
    }

    if (!assignment.users?.is_active) {
      throw new ApiError(400, 'Cannot assign an inactive ticket verifier to a trip.');
    }

    return assignment.users;
  }

  async validateDriverAssignment(driverId, organizationId, departureTime, arrivalTime, excludeTripId = null) {
    if (!driverId) return null;

    // Check if user exists and has DRIVER role in this organization
    const assignment = await prisma.user_roles.findFirst({
      where: {
        user_id: driverId,
        organization_id: organizationId,
      },
      include: {
        users: true,
        roles: true,
      },
    });

    if (!assignment) {
      throw new ApiError(404, 'Driver not found in your organization.');
    }

    if (assignment.roles?.name !== ROLES.DRIVER) {
      throw new ApiError(400, 'Assigned user does not hold the DRIVER role.');
    }

    if (!assignment.users?.is_active) {
      throw new ApiError(400, 'Cannot assign an inactive driver to a trip.');
    }

    // Schedule conflict prevention
    if (departureTime) {
      const conflict = await tripRepository.findDriverConflictingTrip(
        driverId,
        departureTime,
        arrivalTime,
        excludeTripId
      );
      if (conflict) {
        throw new ApiError(409, 'Driver is already assigned to another active trip during this schedule.');
      }
    }

    return assignment.users;
  }

  async getTrips(organizationId, query) {
    if (!organizationId) {
      throw new ApiError(400, 'Organization context is required.');
    }
    return tripRepository.findAll(organizationId, query);
  }

  async getTripById(tripId, organizationId) {
    if (!organizationId) {
      throw new ApiError(400, 'Organization context is required.');
    }

    const trip = await tripRepository.findById(tripId, organizationId);
    if (!trip) {
      throw new ApiError(404, 'Trip not found or does not belong to your organization.');
    }

    return trip;
  }

  async updateTrip(tripId, organizationId, updateData) {
    await assertApprovedOrganization(organizationId);
    const trip = await this.getTripById(tripId, organizationId);

    if (['COMPLETED', 'CANCELLED'].includes(trip.status)) {
      throw new ApiError(400, `Cannot modify trip with status '${trip.status}'.`);
    }

    if (updateData.busId && updateData.busId !== trip.bus_id) {
      const bus = await busRepository.findById(updateData.busId, organizationId);
      if (!bus) {
        throw new ApiError(404, 'New bus not found or does not belong to your organization.');
      }
      if (!bus.is_active) {
        throw new ApiError(400, 'Cannot assign an inactive bus.');
      }
    }

    if (updateData.routeId && updateData.routeId !== trip.route_id) {
      const route = await routeRepository.findById(updateData.routeId, organizationId);
      if (!route) {
        throw new ApiError(404, 'New route not found or does not belong to your organization.');
      }
      if (!route.is_active) {
        throw new ApiError(400, 'Cannot assign an inactive route.');
      }
    }

    if (updateData.status && updateData.status !== trip.status) {
      const allowedStatuses = ['DRAFT', 'SCHEDULED', 'BOARDING', 'IN_TRANSIT', 'COMPLETED', 'CANCELLED'];
      if (!allowedStatuses.includes(updateData.status)) {
        throw new ApiError(400, `Invalid trip status '${updateData.status}'. Allowed: ${allowedStatuses.join(', ')}.`);
      }

      // Business transition rules
      if (updateData.status === 'DRAFT') {
        const activeBookings = await tripRepository.countActiveBookings(tripId);
        if (activeBookings > 0) {
          throw new ApiError(400, 'Cannot revert trip to DRAFT when active bookings exist.');
        }
      }
      if (updateData.status === 'COMPLETED' && !['BOARDING', 'IN_TRANSIT', 'SCHEDULED'].includes(trip.status)) {
        throw new ApiError(400, `Cannot mark trip as COMPLETED from status '${trip.status}'.`);
      }
    }

    if (updateData.driverId !== undefined) {
      const depTime = updateData.departureTime ? new Date(updateData.departureTime) : trip.departure_time;
      const arrTime = updateData.arrivalTime !== undefined ? (updateData.arrivalTime ? new Date(updateData.arrivalTime) : null) : trip.arrival_time;
      if (updateData.driverId) {
        await this.validateDriverAssignment(updateData.driverId, organizationId, depTime, arrTime, tripId);
      }
    }

    if (updateData.verifierId !== undefined) {
      if (updateData.verifierId) {
        await this.validateVerifierAssignment(updateData.verifierId, organizationId);
      }
    }

    const payload = { ...updateData };
    if (payload.price !== undefined && payload.fare === undefined) {
      payload.fare = payload.price;
    }
    delete payload.price;

    const updated = await tripRepository.update(tripId, organizationId, payload);

    const routeName = trip.routes ? `${trip.routes.origin} to ${trip.routes.destination}` : 'your route';

    // 1. Departure time reschedule / delay
    if (updateData.departureTime && new Date(updateData.departureTime).getTime() !== new Date(trip.departure_time).getTime()) {
      const newFormatted = new Date(updateData.departureTime).toLocaleString();
      // Notify passengers
      notificationService.notifyTripPassengers(tripId, {
        type: NOTIFICATION_TYPES.TRIP_RESCHEDULED || NOTIFICATION_TYPES.TRIP_DELAYED,
        priority: NOTIFICATION_PRIORITIES.HIGH,
        title: 'Trip Schedule Updated',
        message: `The departure time for trip ${routeName} has been rescheduled to ${newFormatted}.`,
        metadata: { tripId, organizationId, newDepartureTime: updateData.departureTime },
        sendEmail: true,
      }).catch((err) => console.warn('Failed to notify passengers of trip delay:', err.message));

      // Notify assigned driver
      if (trip.driver_id) {
        notificationService.safeCreateNotification({
          userId: trip.driver_id,
          type: NOTIFICATION_TYPES.TRIP_SCHEDULE_CHANGED,
          priority: NOTIFICATION_PRIORITIES.NORMAL,
          title: 'Assigned Trip Schedule Changed',
          message: `The departure time for trip ${routeName} has been rescheduled to ${newFormatted}.`,
          metadata: { tripId, organizationId, newDepartureTime: updateData.departureTime },
          sendEmail: true,
        }).catch(() => {});
      }

      // Notify assigned verifier
      if (trip.verifier_id) {
        notificationService.safeCreateNotification({
          userId: trip.verifier_id,
          type: NOTIFICATION_TYPES.TRIP_SCHEDULE_CHANGED,
          priority: NOTIFICATION_PRIORITIES.NORMAL,
          title: 'Trip Schedule Updated',
          message: `The departure time for verified trip ${routeName} has been rescheduled to ${newFormatted}.`,
          metadata: { tripId, organizationId, newDepartureTime: updateData.departureTime },
          sendEmail: true,
        }).catch(() => {});
      }
    }

    // 2. Bus changed
    if (updateData.busId && updateData.busId !== trip.bus_id && trip.driver_id) {
      notificationService.safeCreateNotification({
        userId: trip.driver_id,
        type: NOTIFICATION_TYPES.BUS_CHANGED,
        priority: NOTIFICATION_PRIORITIES.NORMAL,
        title: 'Trip Bus Reassigned',
        message: `The vehicle assigned to your trip ${routeName} has been updated.`,
        metadata: { tripId, oldBusId: trip.bus_id, newBusId: updateData.busId },
      }).catch(() => {});
    }

    // 3. Route changed
    if (updateData.routeId && updateData.routeId !== trip.route_id) {
      if (trip.driver_id) {
        notificationService.safeCreateNotification({
          userId: trip.driver_id,
          type: NOTIFICATION_TYPES.ROUTE_CHANGED,
          priority: NOTIFICATION_PRIORITIES.NORMAL,
          title: 'Trip Route Updated',
          message: `The route for your assigned trip has been changed.`,
          metadata: { tripId, oldRouteId: trip.route_id, newRouteId: updateData.routeId },
        }).catch(() => {});
      }
      if (trip.verifier_id) {
        notificationService.safeCreateNotification({
          userId: trip.verifier_id,
          type: NOTIFICATION_TYPES.VERIFICATION_UPDATE,
          priority: NOTIFICATION_PRIORITIES.NORMAL,
          title: 'Trip Route Updated',
          message: `The route for your assigned verification trip has been changed.`,
          metadata: { tripId, oldRouteId: trip.route_id, newRouteId: updateData.routeId },
        }).catch(() => {});
      }
    }

    return updated;
  }

  async deleteTrip(tripId, organizationId, user = null, reqMeta = {}) {
    await assertApprovedOrganization(organizationId);
    const trip = await this.getTripById(tripId, organizationId);

    // Business check: cannot delete trips with active bookings
    const activeBookingsCount = await tripRepository.countActiveBookings(tripId);
    if (activeBookingsCount > 0) {
      throw new ApiError(400, `Cannot delete trip with ${activeBookingsCount} active booking(s). Please cancel the trip instead.`);
    }

    await tripRepository.delete(tripId, organizationId);

    if (user) {
      await logAuditEvent({
        userId: user.id,
        action: 'TRIP_DELETED',
        details: { tripId, organizationId },
        ipAddress: reqMeta.clientIp,
        userAgent: reqMeta.userAgent,
      });
    }

    return { id: tripId, deleted: true };
  }

  async assignVerifier(tripId, organizationId, verifierId, managerUser = null, reqMeta = {}) {
    await assertApprovedOrganization(organizationId);
    const trip = await this.getTripById(tripId, organizationId);
    if (['COMPLETED', 'CANCELLED'].includes(trip.status)) {
      throw new ApiError(400, `Cannot assign ticket verifier to trip with status '${trip.status}'.`);
    }

    if (verifierId) {
      await this.validateVerifierAssignment(verifierId, organizationId);
    }

    const updated = await tripRepository.assignVerifier(tripId, organizationId, verifierId);

    if (managerUser) {
      await logAuditEvent({
        userId: managerUser.id,
        action: 'VERIFIER_ASSIGNED_TO_TRIP',
        details: { tripId, verifierId, organizationId },
        ipAddress: reqMeta.clientIp,
        userAgent: reqMeta.userAgent,
      });
    }

    if (verifierId && verifierId !== trip.verifier_id) {
      const routeName = trip.routes ? `${trip.routes.origin} to ${trip.routes.destination}` : 'trip';
      const depDate = trip.departure_time ? new Date(trip.departure_time).toLocaleDateString() : '';

      // Notify previously assigned verifier if reassigned
      if (trip.verifier_id) {
        notificationService.safeCreateNotification({
          userId: trip.verifier_id,
          type: NOTIFICATION_TYPES.VERIFIER_TRIP_REASSIGNED,
          priority: NOTIFICATION_PRIORITIES.NORMAL,
          title: 'Trip Verification Reassigned',
          message: `Your assignment as ticket verifier for trip ${routeName} has been reassigned.`,
          metadata: { tripId, organizationId },
        }).catch(() => {});
      }

      await notificationService.safeCreateNotification({
        userId: verifierId,
        type: NOTIFICATION_TYPES.VERIFIER_TRIP_ASSIGNED,
        priority: NOTIFICATION_PRIORITIES.NORMAL,
        title: 'New Trip Verification Assignment',
        message: `You have been assigned as the ticket verifier for trip ${routeName} departing on ${depDate}.`,
        metadata: { tripId, organizationId },
        sendEmail: true,
      });
    }

    return updated;
  }

  async assignDriver(tripId, organizationId, driverId, managerUser = null, reqMeta = {}) {
    await assertApprovedOrganization(organizationId);
    const trip = await this.getTripById(tripId, organizationId);
    if (['COMPLETED', 'CANCELLED'].includes(trip.status)) {
      throw new ApiError(400, `Cannot assign driver to trip with status '${trip.status}'.`);
    }

    if (driverId) {
      await this.validateDriverAssignment(driverId, organizationId, trip.departure_time, trip.arrival_time, tripId);
    }

    const updated = await tripRepository.assignDriver(tripId, organizationId, driverId);

    if (managerUser) {
      await logAuditEvent({
        userId: managerUser.id,
        action: 'DRIVER_ASSIGNED_TO_TRIP',
        details: { tripId, driverId, organizationId },
        ipAddress: reqMeta.clientIp,
        userAgent: reqMeta.userAgent,
      });
    }

    if (driverId && driverId !== trip.driver_id) {
      const routeName = trip.routes ? `${trip.routes.origin} to ${trip.routes.destination}` : 'trip';
      const depDate = trip.departure_time ? new Date(trip.departure_time).toLocaleDateString() : '';

      // Notify previously assigned driver if reassigned
      if (trip.driver_id) {
        notificationService.safeCreateNotification({
          userId: trip.driver_id,
          type: NOTIFICATION_TYPES.TRIP_REASSIGNED,
          priority: NOTIFICATION_PRIORITIES.NORMAL,
          title: 'Trip Driver Reassigned',
          message: `Your driving assignment for trip ${routeName} departing on ${depDate} has been reassigned.`,
          metadata: { tripId, organizationId },
        }).catch(() => {});
      }

      await notificationService.safeCreateNotification({
        userId: driverId,
        type: NOTIFICATION_TYPES.TRIP_ASSIGNED,
        priority: NOTIFICATION_PRIORITIES.NORMAL,
        title: 'New Trip Assignment',
        message: `You have been assigned to drive trip ${routeName} departing on ${depDate}.`,
        metadata: { tripId, organizationId },
        sendEmail: true,
      });
    }

    return updated;
  }

  async cancelTrip(tripId, organizationId) {
    await assertApprovedOrganization(organizationId);
    const trip = await this.getTripById(tripId, organizationId);

    if (trip.status === 'CANCELLED') {
      throw new ApiError(400, 'Trip is already cancelled.');
    }
    if (trip.status === 'COMPLETED') {
      throw new ApiError(400, 'Cannot cancel an already completed trip.');
    }

    const cancelledTrip = await tripRepository.cancel(tripId, organizationId);

    // Notify affected passengers
    const routeName = trip.routes ? `${trip.routes.origin} to ${trip.routes.destination}` : 'your scheduled route';
    const depFormatted = trip.departure_time ? new Date(trip.departure_time).toLocaleDateString() : '';

    await notificationService.notifyTripPassengers(tripId, {
      type: NOTIFICATION_TYPES.TRIP_CANCELLED,
      priority: NOTIFICATION_PRIORITIES.URGENT,
      title: 'Trip Cancelled',
      message: `Your trip for ${routeName} scheduled for ${depFormatted} has been cancelled by the operator.`,
      metadata: { tripId, organizationId },
    }).catch((err) => console.warn('Failed to notify passengers of trip cancellation:', err.message));

    // Notify assigned driver if any
    if (trip.driver_id) {
      await notificationService.safeCreateNotification({
        userId: trip.driver_id,
        type: NOTIFICATION_TYPES.TRIP_CANCELLED,
        priority: NOTIFICATION_PRIORITIES.HIGH,
        title: 'Assigned Trip Cancelled',
        message: `Your assigned trip for ${routeName} on ${depFormatted} has been cancelled.`,
        metadata: { tripId, organizationId },
        sendEmail: true,
      });
    }

    // Notify assigned verifier if any
    if (trip.verifier_id) {
      await notificationService.safeCreateNotification({
        userId: trip.verifier_id,
        type: NOTIFICATION_TYPES.VERIFICATION_UPDATE,
        priority: NOTIFICATION_PRIORITIES.HIGH,
        title: 'Assigned Verification Trip Cancelled',
        message: `Your assigned verification trip for ${routeName} on ${depFormatted} has been cancelled.`,
        metadata: { tripId, organizationId },
        sendEmail: true,
      });
    }

    // Notify organization coordinators and operational managers
    await notificationService.notifyOrganizationStaff(
      organizationId,
      [ROLES.BOOKING_COORDINATOR, ROLES.OPERATIONAL_MANAGER],
      {
        type: NOTIFICATION_TYPES.TRIP_CANCELLED,
        priority: NOTIFICATION_PRIORITIES.HIGH,
        title: 'Trip Cancelled',
        message: `Trip ${routeName} scheduled for ${depFormatted} has been cancelled.`,
        metadata: { tripId, organizationId },
      }
    ).catch(() => {});

    return cancelledTrip;
  }

  async publishTrip(tripId, organizationId) {
    await assertApprovedOrganization(organizationId);
    const trip = await this.getTripById(tripId, organizationId);
    if (['COMPLETED', 'CANCELLED'].includes(trip.status)) {
      throw new ApiError(400, `Cannot publish trip with status '${trip.status}'.`);
    }

    return tripRepository.update(tripId, organizationId, { status: 'PUBLISHED' });
  }

  async unpublishTrip(tripId, organizationId) {
    await assertApprovedOrganization(organizationId);
    const trip = await this.getTripById(tripId, organizationId);
    if (['COMPLETED', 'CANCELLED'].includes(trip.status)) {
      throw new ApiError(400, `Cannot unpublish trip with status '${trip.status}'.`);
    }

    return tripRepository.update(tripId, organizationId, { status: 'DRAFT' });
  }

  // --- Seat Operations ---
  async getTripSeats(tripId, organizationId) {
    await this.getTripById(tripId, organizationId);
    return tripRepository.getSeats(tripId);
  }

  async updateSeatStatus(tripId, seatId, organizationId, status) {
    await assertApprovedOrganization(organizationId);
    await this.getTripById(tripId, organizationId);

    const seat = await tripRepository.findSeatById(seatId, tripId);
    if (!seat) {
      throw new ApiError(404, 'Seat not found for this trip.');
    }

    if (seat.status === 'BOOKED' && status !== 'AVAILABLE') {
      throw new ApiError(400, 'Cannot change status of a booked seat directly. Process cancellation or refund first.');
    }

    return tripRepository.updateSeatStatus(seatId, tripId, status);
  }

  async batchUpdateSeats(tripId, organizationId, seatNumbers, status) {
    await assertApprovedOrganization(organizationId);
    await this.getTripById(tripId, organizationId);
    return tripRepository.updateSeatsBatch(tripId, seatNumbers, status);
  }
}

export const tripService = new TripService();
export default tripService;
