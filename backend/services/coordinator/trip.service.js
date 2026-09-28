import tripRepository from '../../repository/coordinator/trip.repository.js';
import busRepository from '../../repository/coordinator/bus.repository.js';
import routeRepository from '../../repository/coordinator/route.repository.js';
import prisma from '../../Config/db.js';
import ApiError from '../../utils/apiError.js';

export class TripService {
  async createTrip(organizationId, tripData) {
    if (!organizationId) {
      throw new ApiError(400, 'Organization context is required.');
    }

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

    const trip = await tripRepository.create({
      organizationId,
      busId,
      routeId,
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
      origin: route.origin,
      destination: route.destination,
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
        origin: route.origin,
        destination: route.destination,
      },
      createdAt: trip.created_at,
    };
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

    const payload = { ...updateData };
    if (payload.price && !payload.fare) {
      payload.fare = payload.price;
    }

    return tripRepository.update(tripId, organizationId, payload);
  }

  async cancelTrip(tripId, organizationId) {
    const trip = await this.getTripById(tripId, organizationId);

    if (trip.status === 'CANCELLED') {
      throw new ApiError(400, 'Trip is already cancelled.');
    }
    if (trip.status === 'COMPLETED') {
      throw new ApiError(400, 'Cannot cancel an already completed trip.');
    }

    return tripRepository.cancel(tripId, organizationId);
  }

  // --- Seat Operations ---
  async getTripSeats(tripId, organizationId) {
    await this.getTripById(tripId, organizationId);
    return tripRepository.getSeats(tripId);
  }

  async updateSeatStatus(tripId, seatId, organizationId, status) {
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
    await this.getTripById(tripId, organizationId);
    return tripRepository.updateSeatsBatch(tripId, seatNumbers, status);
  }
}

export const tripService = new TripService();
export default tripService;
