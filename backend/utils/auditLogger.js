import prisma from '../Config/db.js';

export const AuditAction = {
  REGISTER: 'REGISTER',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILED: 'LOGIN_FAILED',
  LOGOUT: 'LOGOUT',
  PASSWORD_CHANGED: 'PASSWORD_CHANGED',
  PASSWORD_RESET: 'PASSWORD_RESET',
  EMAIL_VERIFIED: 'EMAIL_VERIFIED',
  REFRESH_TOKEN_REUSED: 'REFRESH_TOKEN_REUSED',
  ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
  ROLE_CHANGED: 'ROLE_CHANGED',
  USER_SUSPENDED: 'USER_SUSPENDED',
  ORGANIZATION_APPROVED: 'ORGANIZATION_APPROVED',
  ORGANIZATION_REJECTED: 'ORGANIZATION_REJECTED',
  ORGANIZATION_SUSPENDED: 'ORGANIZATION_SUSPENDED',
  ORGANIZATION_ACTIVATED: 'ORGANIZATION_ACTIVATED',
};


export async function logAuditEvent({ userId = null, action, details = {}, ipAddress = null, userAgent = null }) {
  try {
    // Sanitize details: ensure no password or raw tokens are stored
    const sanitizedDetails = { ...details };
    delete sanitizedDetails.password;
    delete sanitizedDetails.currentPassword;
    delete sanitizedDetails.newPassword;
    delete sanitizedDetails.confirmPassword;
    delete sanitizedDetails.token;
    delete sanitizedDetails.refreshToken;

    await prisma.audit_logs.create({
      data: {
        user_id: userId,
        action,
        details: sanitizedDetails,
        ip_address: ipAddress ? String(ipAddress).slice(0, 45) : null,
        user_agent: userAgent ? String(userAgent).slice(0, 255) : null,
      },
    });
  } catch (error) {
    // Audit logging should never crash the main operation
    console.error(`[AUDIT_LOG_ERROR] Failed to record audit log for action ${action}:`, error.message);
  }
}

export default {
  AuditAction,
  logAuditEvent,
};
