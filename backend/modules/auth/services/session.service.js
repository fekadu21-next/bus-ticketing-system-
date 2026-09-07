import authRepository from '../auth.repository.js';
import { comparePassword } from '../../../utils/password.js';
import { generateAccessToken } from '../../../utils/jwt.js';
import { generateSecureToken, hashToken } from '../../../utils/crypto.js';
import { logAuditEvent, AuditAction } from '../../../utils/auditLogger.js';
import ApiError from '../../../utils/apiError.js';
import env from '../../../Config/env.js';
import { formatSafeUser } from './utils/formatSafeUser.js';

export class SessionService {
  /**
   * User login with failed attempt tracking and lockout
   */
  async login({ email, password, clientIp, userAgent }) {
    const normalizedEmail = email.trim().toLowerCase();

    const user = await authRepository.findUserByEmail(normalizedEmail);
    if (!user) {
      await logAuditEvent({
        action: AuditAction.LOGIN_FAILED,
        details: { email: normalizedEmail, reason: 'user_not_found' },
        ipAddress: clientIp,
        userAgent,
      });
      throw new ApiError(401, 'Invalid email or password.');
    }

    if (!user.is_active) {
      throw new ApiError(403, 'Account has been deactivated. Please contact support.');
    }

    // Check temporary lockout
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      const remainingMinutes = Math.ceil((new Date(user.locked_until) - new Date()) / 60000);
      throw new ApiError(
        423,
        `Account is temporarily locked due to multiple failed login attempts. Please try again in ${remainingMinutes} minute(s).`
      );
    }

    const isPasswordValid = await comparePassword(password, user.password_hash);
    if (!isPasswordValid) {
      const failedAttempts = (user.failed_login_attempts || 0) + 1;
      const updateData = { failed_login_attempts: failedAttempts };

      if (failedAttempts >= env.security.maxLoginAttempts) {
        updateData.locked_until = new Date(
          Date.now() + env.security.lockoutDurationMinutes * 60 * 1000
        );
        await logAuditEvent({
          userId: user.id,
          action: AuditAction.ACCOUNT_LOCKED,
          details: { failedAttempts, lockedDuration: `${env.security.lockoutDurationMinutes}m` },
          ipAddress: clientIp,
          userAgent,
        });
      }

      await authRepository.updateUser(user.id, updateData);

      await logAuditEvent({
        userId: user.id,
        action: AuditAction.LOGIN_FAILED,
        details: { failedAttempts, reason: 'bad_credentials' },
        ipAddress: clientIp,
        userAgent,
      });

      throw new ApiError(401, 'Invalid email or password.');
    }

    // Reset failed attempts & update last login
    await authRepository.updateUser(user.id, {
      failed_login_attempts: 0,
      locked_until: null,
      last_login_at: new Date(),
    });

    // Generate tokens
    const accessToken = generateAccessToken(user.id);
    const rawRefreshToken = generateSecureToken();
    const refreshTokenHash = hashToken(rawRefreshToken);
    const refreshExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await authRepository.createRefreshToken({
      userId: user.id,
      tokenHash: refreshTokenHash,
      expiresAt: refreshExpiresAt,
      userAgent,
      ipAddress: clientIp,
    });

    await logAuditEvent({
      userId: user.id,
      action: AuditAction.LOGIN_SUCCESS,
      details: { email: user.email },
      ipAddress: clientIp,
      userAgent,
    });

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      user: formatSafeUser(user),
    };
  }

  /**
   * Rotate refresh token and detect reuse
   */
  async refreshTokens({ rawRefreshToken, clientIp, userAgent }) {
    if (!rawRefreshToken) {
      throw new ApiError(401, 'Refresh token required');
    }

    const tokenHash = hashToken(rawRefreshToken);
    const tokenRecord = await authRepository.findRefreshTokenByHash(tokenHash);

    if (!tokenRecord) {
      throw new ApiError(401, 'Invalid or expired session. Please log in again.');
    }

    // REUSE DETECTION: If token is already revoked, potential theft!
    if (tokenRecord.revoked_at) {
      await authRepository.revokeAllUserRefreshTokens(tokenRecord.user_id);

      await logAuditEvent({
        userId: tokenRecord.user_id,
        action: AuditAction.REFRESH_TOKEN_REUSED,
        details: { replayedTokenId: tokenRecord.id },
        ipAddress: clientIp,
        userAgent,
      });

      throw new ApiError(401, 'Invalid session state detected. All sessions revoked. Please log in again.');
    }

    // Check expiration
    if (new Date(tokenRecord.expires_at) < new Date()) {
      await authRepository.revokeRefreshToken(tokenRecord.id);
      throw new ApiError(401, 'Refresh token has expired. Please log in again.');
    }

    const user = tokenRecord.users;
    if (!user || !user.is_active) {
      throw new ApiError(403, 'Account is inactive or no longer exists.');
    }

    // Generate new refresh token
    const newRawRefreshToken = generateSecureToken();
    const newTokenHash = hashToken(newRawRefreshToken);
    const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const newRecord = await authRepository.createRefreshToken({
      userId: user.id,
      tokenHash: newTokenHash,
      expiresAt: newExpiresAt,
      userAgent,
      ipAddress: clientIp,
    });

    // Revoke old token and link to replacement
    await authRepository.revokeRefreshToken(tokenRecord.id, newRecord.id);

    // Generate new access token
    const newAccessToken = generateAccessToken(user.id);

    return {
      accessToken: newAccessToken,
      refreshToken: newRawRefreshToken,
      user: formatSafeUser(user),
    };
  }

  /**
   * User logout: revokes active refresh token
   */
  async logout({ rawRefreshToken, userId, clientIp, userAgent }) {
    if (rawRefreshToken) {
      const tokenHash = hashToken(rawRefreshToken);
      const tokenRecord = await authRepository.findRefreshTokenByHash(tokenHash);
      if (tokenRecord && !tokenRecord.revoked_at) {
        await authRepository.revokeRefreshToken(tokenRecord.id);
      }
    } else if (userId) {
      await authRepository.revokeAllUserRefreshTokens(userId);
    }

    await logAuditEvent({
      userId: userId || null,
      action: AuditAction.LOGOUT,
      ipAddress: clientIp,
      userAgent,
    });

    return { success: true };
  }
}

export const sessionService = new SessionService();
export default sessionService;