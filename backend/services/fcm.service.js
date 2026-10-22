import admin from 'firebase-admin';
import fs from 'fs';
import prisma from '../Config/db.js';

let firebaseApp = null;
let isInitialized = false;

function initFirebase() {
  if (isInitialized) return firebaseApp;

  try {
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
    const projectId = process.env.FIREBASE_PROJECT_ID;

    if (serviceAccountJson) {
      const credentials = typeof serviceAccountJson === 'string' ? JSON.parse(serviceAccountJson) : serviceAccountJson;
      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(credentials),
      });
      console.log('🔥 [FCM] Firebase Admin SDK initialized via credentials JSON.');
    } else if (serviceAccountPath && fs.existsSync(serviceAccountPath)) {
      const credentials = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(credentials),
      });
      console.log('🔥 [FCM] Firebase Admin SDK initialized via service account file.');
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS && fs.existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS)) {
      firebaseApp = admin.initializeApp({
        credential: admin.credential.applicationDefault(),
      });
      console.log('🔥 [FCM] Firebase Admin SDK initialized via applicationDefault().');
    } else {
      console.log('ℹ️  [FCM] Firebase credentials not provided. Running in simulation mode (dry-run).');
    }
  } catch (err) {
    console.warn('⚠️  [FCM] Failed to initialize Firebase Admin SDK:', err.message);
  }

  isInitialized = true;
  return firebaseApp;
}

export class FCMService {
  constructor() {
    initFirebase();
  }

  /**
   * Register or update a device token for push notifications
   */
  async registerDeviceToken(userId, token, deviceType = 'web') {
    if (!userId || !token) {
      throw new Error('userId and token are required to register device token.');
    }

    return prisma.user_device_tokens.upsert({
      where: { token },
      update: {
        user_id: userId,
        device_type: deviceType,
        updated_at: new Date(),
      },
      create: {
        user_id: userId,
        token,
        device_type: deviceType,
      },
    });
  }

  /**
   * Unregister / remove a device token
   */
  async unregisterDeviceToken(userId, token) {
    if (!token) return { count: 0 };
    return prisma.user_device_tokens.deleteMany({
      where: {
        token,
        ...(userId ? { user_id: userId } : {}),
      },
    });
  }

  /**
   * Retrieve active device tokens for a user
   */
  async getUserTokens(userId) {
    if (!userId) return [];
    const records = await prisma.user_device_tokens.findMany({
      where: { user_id: userId },
      select: { token: true, device_type: true },
    });
    return records.map((r) => r.token);
  }

  /**
   * Send push notification to a specific user across all registered devices
   */
  async sendPushToUser(userId, { title, body, data = {} }) {
    if (!userId || !title || !body) return { success: false, reason: 'Missing arguments' };

    const tokens = await this.getUserTokens(userId);
    if (!tokens || tokens.length === 0) {
      return { success: true, delivered: 0, reason: 'No registered device tokens' };
    }

    return this.sendToTokens(tokens, { title, body, data });
  }

  /**
   * Send push notification to multiple users
   */
  async sendPushToUsers(userIds, { title, body, data = {} }) {
    if (!Array.isArray(userIds) || userIds.length === 0) return { delivered: 0 };

    const records = await prisma.user_device_tokens.findMany({
      where: { user_id: { in: userIds } },
      select: { token: true },
    });

    const tokens = records.map((r) => r.token);
    if (tokens.length === 0) return { success: true, delivered: 0 };

    return this.sendToTokens(tokens, { title, body, data });
  }

  /**
   * Send message to a list of tokens with automatic cleanup of invalid/stale tokens
   */
  async sendToTokens(tokens, { title, body, data = {} }) {
    if (!tokens || tokens.length === 0) return { delivered: 0 };

    // Format all data values to strings as required by FCM
    const sanitizedData = {};
    for (const [k, v] of Object.entries(data)) {
      if (v !== undefined && v !== null) {
        sanitizedData[k] = typeof v === 'object' ? JSON.stringify(v) : String(v);
      }
    }

    // In simulation / test mode without active Firebase SDK
    if (!firebaseApp) {
      console.log(`📱 [FCM SIMULATED PUSH] To ${tokens.length} token(s): "${title}" - "${body}"`);
      return { success: true, delivered: tokens.length, simulated: true };
    }

    try {
      const message = {
        tokens,
        notification: {
          title,
          body,
        },
        data: sanitizedData,
      };

      const response = await admin.messaging().sendEachForMulticast(message);
      console.log(`📱 [FCM] Dispatched push: ${response.successCount} succeeded, ${response.failureCount} failed`);

      // Clean up stale or invalid tokens automatically
      if (response.failureCount > 0) {
        const failedTokens = [];
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            const errCode = resp.error?.code;
            if (
              errCode === 'messaging/registration-token-not-registered' ||
              errCode === 'messaging/invalid-registration-token' ||
              errCode === 'messaging/invalid-argument'
            ) {
              failedTokens.push(tokens[idx]);
            }
          }
        });

        if (failedTokens.length > 0) {
          await prisma.user_device_tokens.deleteMany({
            where: { token: { in: failedTokens } },
          }).catch((err) => console.warn('Failed to prune stale FCM tokens:', err.message));
        }
      }

      return {
        success: true,
        delivered: response.successCount,
        failed: response.failureCount,
      };
    } catch (err) {
      console.warn('⚠️ [FCM] Error sending push notification:', err.message);
      return { success: false, error: err.message };
    }
  }
}

export const fcmService = new FCMService();
export default fcmService;
