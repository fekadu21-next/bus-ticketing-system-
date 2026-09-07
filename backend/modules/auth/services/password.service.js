import authRepository from '../auth.repository.js';
import { hashPassword, comparePassword } from '../../../utils/password.js';
import { generateAccessToken } from '../../../utils/jwt.js';
import { generateSecureToken, hashToken } from '../../../utils/crypto.js';
import { sendPasswordResetEmail } from '../../../utils/email.js';
import { logAuditEvent, AuditAction } from '../../../utils/auditLogger.js';
import ApiError from '../../../utils/apiError.js';

export class PasswordService {
  /**
   * Initiates forgot password flow (anti-enumeration)
   */
  async forgotPassword({ email, clientIp, userAgent }) {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await authRepository.findUserByEmail(normalizedEmail);

    if (user && user.is_active) {
      const rawToken = generateSecureToken();
      const tokenHash = hashToken(rawToken);
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await authRepository.createPasswordResetToken({
        userId: user.id,
        tokenHash,
        expiresAt,
      });

      await sendPasswordResetEmail(user.email, user.first_name, rawToken);
    }

    return {
      message: 'If an account exists for this email, a password reset link has been sent.',
    };
  }

  /**
   * Completes password reset flow
   */
  async resetPassword({ rawToken, newPassword, clientIp, userAgent }) {
    const tokenHash = hashToken(rawToken);
    const tokenRecord = await authRepository.findPasswordResetTokenByHash(tokenHash);

    if (!tokenRecord) {
      throw new ApiError(400, 'Invalid or expired password reset link');
    }

    if (tokenRecord.used_at) {
      throw new ApiError(400, 'Password reset link has already been used');
    }

    if (new Date(tokenRecord.expires_at) < new Date()) {
      throw new ApiError(400, 'Password reset link has expired');
    }

    const hashedPassword = await hashPassword(newPassword);

    await authRepository.updateUser(tokenRecord.user_id, {
      password_hash: hashedPassword,
      failed_login_attempts: 0,
      locked_until: null,
    });

    await authRepository.markPasswordResetTokenUsed(tokenRecord.id);

    // Invalidate all active sessions
    await authRepository.revokeAllUserRefreshTokens(tokenRecord.user_id);

    await logAuditEvent({
      userId: tokenRecord.user_id,
      action: AuditAction.PASSWORD_RESET,
      ipAddress: clientIp,
      userAgent,
    });

    return {
      message: 'Password has been reset successfully. Please log in with your new password.',
    };
  }

  /**
   * Change password for an authenticated user
   */
  async changePassword({ userId, currentPassword, newPassword, clientIp, userAgent }) {
    const user = await authRepository.findUserById(userId);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    const isCurrentValid = await comparePassword(currentPassword, user.password_hash);
    if (!isCurrentValid) {
      throw new ApiError(400, 'Current password is incorrect');
    }

    const newHashedPassword = await hashPassword(newPassword);

    await authRepository.updateUser(userId, {
      password_hash: newHashedPassword,
    });

    // Revoke previous sessions
    await authRepository.revokeAllUserRefreshTokens(userId);

    // Issue a fresh session
    const accessToken = generateAccessToken(userId);
    const rawRefreshToken = generateSecureToken();
    const tokenHash = hashToken(rawRefreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await authRepository.createRefreshToken({
      userId,
      tokenHash,
      expiresAt,
      userAgent,
      ipAddress: clientIp,
    });

    await logAuditEvent({
      userId,
      action: AuditAction.PASSWORD_CHANGED,
      ipAddress: clientIp,
      userAgent,
    });

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      message: 'Password changed successfully',
    };
  }
}

export const passwordService = new PasswordService();
export default passwordService;