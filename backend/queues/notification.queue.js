import { Queue, Worker } from 'bullmq';
import { redisClient, isRedisAvailable } from '../Config/redis.js';
import fcmService from '../services/fcm.service.js';
import { sendNotificationEmail } from '../utils/email.js';
import notificationRepository from '../repository/notification.repository.js';
import prisma from '../Config/db.js';
import { NOTIFICATION_TYPES } from '../constants/notification.js';

const QUEUE_NAME = 'notifications';

let notificationQueue = null;
let notificationWorker = null;
let isReadyListenerAttached = false;

/**
 * Direct inline processor used when Redis/BullMQ is offline or during testing
 */
export async function processNotificationDirect(jobData) {
  const { notification, params } = jobData;
  const { userId, type, priority, title, message, metadata, sendEmail, actionUrl, actionLabel } = params;

  try {
    const preferences = await notificationRepository.getPreferences(userId);

    // Channel 1: Push Notifications (FCM)
    if (preferences.push_enabled !== false) {
      try {
        await fcmService.sendPushToUser(userId, {
          title,
          body: message,
          data: {
            notificationId: notification?.id || '',
            type: String(type || ''),
            priority: String(priority || ''),
            ...(metadata ? Object.fromEntries(Object.entries(metadata).map(([k, v]) => [k, String(v)])) : {}),
          },
        });
      } catch (err) {
        // FCM non-blocking simulation
      }
    }

    // Channel 2: Email Notifications
    const isImportantEmailEvent =
      sendEmail ||
      [
        NOTIFICATION_TYPES.BOOKING_CONFIRMED,
        NOTIFICATION_TYPES.PAYMENT_SUCCESS,
        NOTIFICATION_TYPES.PAYMENT_FAILED,
        NOTIFICATION_TYPES.TRIP_CANCELLED,
        NOTIFICATION_TYPES.TRIP_RESCHEDULED,
        NOTIFICATION_TYPES.TRIP_DELAYED,
        NOTIFICATION_TYPES.NEW_ORGANIZATION_REGISTRATION,
        NOTIFICATION_TYPES.ORGANIZATION_APPROVAL_REQUEST,
        NOTIFICATION_TYPES.ORGANIZATION_APPROVED,
        NOTIFICATION_TYPES.ORGANIZATION_REJECTED,
        NOTIFICATION_TYPES.CRITICAL_PLATFORM_ISSUE,
        NOTIFICATION_TYPES.TRIP_ASSIGNED,
      ].includes(type);

    if (preferences.email_enabled !== false && isImportantEmailEvent) {
      try {
        const user = await prisma.users.findUnique({
          where: { id: userId },
          select: { email: true, first_name: true },
        });

        if (user?.email) {
          await sendNotificationEmail(user.email, user.first_name, {
            title,
            message,
            details: metadata || {},
            actionUrl: actionUrl || metadata?.actionUrl || null,
            actionLabel: actionLabel || metadata?.actionLabel || 'View in App',
          });
        }
      } catch (err) {
        console.warn('⚠️  [QUEUE EMAIL WARNING]', err.message);
      }
    }
  } catch (error) {
    console.warn('⚠️  [NOTIFICATION JOB ERROR]', error.message);
  }
}

/**
 * Initialize BullMQ Queue and Worker if Redis is active
 */
export function initNotificationQueue() {
  if (notificationQueue || !redisClient) return;

  // If Redis is not currently ready, do NOT attempt to spin up worker connections!
  if (!isRedisAvailable()) {
    if (!isReadyListenerAttached) {
      isReadyListenerAttached = true;
      redisClient.once('ready', () => {
        isReadyListenerAttached = false;
        initNotificationQueue();
      });
    }
    return;
  }

  try {
    notificationQueue = new Queue(QUEUE_NAME, {
      connection: redisClient,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1500,
        },
        removeOnComplete: true,
        removeOnFail: { count: 50 },
      },
    });

    const workerConnection = redisClient.duplicate();

    notificationWorker = new Worker(
      QUEUE_NAME,
      async (job) => {
        await processNotificationDirect(job.data);
      },
      {
        connection: workerConnection,
        concurrency: 5,
      }
    );

    notificationWorker.on('failed', (job, err) => {
      console.warn(`⚠️  [NOTIFICATION QUEUE] Job ${job?.id} failed:`, err.message);
    });

    notificationWorker.on('error', (err) => {
      if (err.code !== 'ECONNREFUSED' && process.env.NODE_ENV !== 'test') {
        console.warn('⚠️  [NOTIFICATION WORKER ERROR]', err.message);
      }
    });

    console.log('📬 [QUEUE] BullMQ notification queue & worker initialized.');
  } catch (error) {
    console.warn('ℹ️  [QUEUE INIT FAILED] Falling back to direct async execution:', error.message);
    notificationQueue = null;
    notificationWorker = null;
  }
}

/**
 * Safely enqueue a notification job with automatic fallback to direct execution
 */
export async function enqueueNotificationJob(notification, params) {
  const jobData = { notification, params };

  if (isRedisAvailable() && notificationQueue) {
    try {
      await notificationQueue.add('dispatchExternal', jobData);
      return true;
    } catch (err) {
      // Fallback below
    }
  }

  // Graceful fallback: execute directly asynchronously without blocking
  processNotificationDirect(jobData).catch((err) => {
    console.warn('⚠️  [DIRECT DISPATCH ERROR]', err.message);
  });
  return true;
}

/**
 * Graceful Queue and Worker shutdown
 */
export async function closeNotificationQueue() {
  try {
    if (notificationWorker) {
      await notificationWorker.close();
      notificationWorker = null;
    }
    if (notificationQueue) {
      await notificationQueue.close();
      notificationQueue = null;
    }
  } catch (err) {
    // Non-blocking
  }
}

export default {
  initNotificationQueue,
  enqueueNotificationJob,
  processNotificationDirect,
  closeNotificationQueue,
};
