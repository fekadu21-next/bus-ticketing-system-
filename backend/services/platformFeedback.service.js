import platformFeedbackRepository from '../repository/platformFeedback.repository.js';
import ApiError from '../utils/apiError.js';
import notificationService from './notification.service.js';
import { NOTIFICATION_TYPES, NOTIFICATION_PRIORITIES } from '../constants/notification.js';

export class PlatformFeedbackService {
  async submitFeedback(userId, { rating, category, comment }) {
    if (!userId) {
      throw new ApiError(401, 'User authentication required');
    }

    const numRating = Number(rating);
    if (!numRating || numRating < 1 || numRating > 5) {
      throw new ApiError(400, 'Rating must be an integer between 1 and 5');
    }

    if (!comment || !comment.trim()) {
      throw new ApiError(400, 'Feedback comment is required');
    }

    const validCategories = ['BUG_REPORT', 'USABILITY', 'FEATURE_REQUEST', 'PERFORMANCE', 'OTHER'];
    const selectedCategory = (category || 'OTHER').toUpperCase();
    if (!validCategories.includes(selectedCategory)) {
      throw new ApiError(400, `Category must be one of: ${validCategories.join(', ')}`);
    }

    const feedback = await platformFeedbackRepository.create({
      userId,
      rating: Math.round(numRating),
      category: selectedCategory,
      comment: comment.trim(),
    });

    // Notify administrators if it's a critical bug or very low rating
    if (feedback.rating <= 2 || feedback.category === 'BUG_REPORT') {
      notificationService.notifyAdmins({
        type: NOTIFICATION_TYPES.NEW_ORGANIZATION_REGISTRATION || 'NEW_FEEDBACK',
        priority: NOTIFICATION_PRIORITIES.NORMAL,
        title: `New Platform Feedback: ${feedback.category}`,
        message: `A user submitted ${feedback.rating}★ feedback in category ${feedback.category}: "${feedback.comment.slice(0, 60)}..."`,
        metadata: {
          feedbackId: feedback.id,
          rating: feedback.rating,
          category: feedback.category,
          actionUrl: '/admin/feedback',
          actionLabel: 'Review Feedback',
        },
        sendEmail: false,
      }).catch((e) => console.warn('Non-blocking admin notification warning:', e.message));
    }

    return feedback;
  }

  async getMyFeedbacks(userId) {
    if (!userId) {
      throw new ApiError(401, 'User authentication required');
    }

    return platformFeedbackRepository.findUserFeedbacks(userId);
  }

  async getAllFeedbacks(query) {
    const [result, stats] = await Promise.all([
      platformFeedbackRepository.findAll(query),
      platformFeedbackRepository.getPlatformStats(),
    ]);

    return {
      ...result,
      stats,
    };
  }

  async respondToFeedback(feedbackId, adminUserId, { status, adminResponse }) {
    const feedback = await platformFeedbackRepository.findById(feedbackId);
    if (!feedback) {
      throw new ApiError(404, 'Feedback not found');
    }

    const updated = await platformFeedbackRepository.updateResponse(feedbackId, {
      status,
      adminResponse: adminResponse !== undefined ? (adminResponse ? adminResponse.trim() : null) : undefined,
      adminUserId,
    });

    // Notify user if admin responded with a message
    if (adminResponse && adminResponse.trim()) {
      notificationService.safeCreateNotification({
        userId: feedback.user_id,
        type: 'PLATFORM_FEEDBACK_RESOLVED',
        priority: NOTIFICATION_PRIORITIES.NORMAL,
        title: 'Platform Feedback Update',
        message: `An administrator has responded to your platform feedback (${updated.status}): "${adminResponse.trim().slice(0, 80)}..."`,
        metadata: {
          feedbackId: updated.id,
          status: updated.status,
          adminResponse: adminResponse.trim(),
        },
      });
    }

    return updated;
  }
}

export const platformFeedbackService = new PlatformFeedbackService();
export default platformFeedbackService;
