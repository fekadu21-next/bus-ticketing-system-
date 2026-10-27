import prisma from '../../Config/db.js';
import ApiError from '../../utils/apiError.js';

export class CoordinatorFeedbackService {
  async getOrganizationFeedbacks(organizationId, { page = 1, limit = 20, rating, search } = {}) {
    if (!organizationId) {
      throw new ApiError(400, 'Organization ID is required');
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const where = {
      organization_id: organizationId,
    };

    if (rating && Number(rating) >= 1 && Number(rating) <= 5) {
      where.rating = Number(rating);
    }

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { comment: { contains: q, mode: 'insensitive' } },
        { trips: { routes: { origin: { contains: q, mode: 'insensitive' } } } },
        { trips: { routes: { destination: { contains: q, mode: 'insensitive' } } } },
      ];
    }

    const [total, feedbacks, allOrgFeedbacks] = await Promise.all([
      prisma.feedbacks.count({ where }),
      prisma.feedbacks.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { created_at: 'desc' },
        include: {
          passenger: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
            },
          },
          trips: {
            select: {
              id: true,
              departure_time: true,
              routes: {
                select: {
                  origin: true,
                  destination: true,
                },
              },
              buses: {
                select: {
                  plate_number: true,
                  model: true,
                },
              },
            },
          },
        },
      }),
      // Query summary statistics across all feedbacks for this organization
      prisma.feedbacks.findMany({
        where: { organization_id: organizationId },
        select: { rating: true, trip_id: true },
      }),
    ]);

    // Compute metrics
    const totalReviews = allOrgFeedbacks.length;
    let sumRating = 0;
    const starCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    const ratedTripIds = new Set();

    allOrgFeedbacks.forEach((f) => {
      sumRating += f.rating;
      if (starCounts[f.rating] !== undefined) {
        starCounts[f.rating] += 1;
      }
      if (f.trip_id) ratedTripIds.add(f.trip_id);
    });

    const averageRating = totalReviews > 0 ? Number((sumRating / totalReviews).toFixed(2)) : 0;

    const formattedFeedbacks = feedbacks.map((f) => {
      const pName = [f.passenger?.first_name, f.passenger?.last_name].filter(Boolean).join(' ') || 'Verified Passenger';
      return {
        id: f.id,
        tripId: f.trip_id,
        tripCode: `TRP-${f.trips?.id ? f.trips.id.slice(0, 8).toUpperCase() : 'N/A'}`,
        route: f.trips?.routes ? `${f.trips.routes.origin} → ${f.trips.routes.destination}` : 'N/A',
        busPlate: f.trips?.buses?.plate_number || 'N/A',
        departureTime: f.trips?.departure_time,
        rating: f.rating,
        comment: f.comment,
        passengerName: pName,
        createdAt: f.created_at,
      };
    });

    return {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum) || 1,
      stats: {
        totalReviews,
        averageRating,
        starCounts,
        completedTripsRated: ratedTripIds.size,
      },
      feedbacks: formattedFeedbacks,
    };
  }
}

export const coordinatorFeedbackService = new CoordinatorFeedbackService();
export default coordinatorFeedbackService;
