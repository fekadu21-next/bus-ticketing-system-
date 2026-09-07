import authRepository from '../auth.repository.js';
import { generateSecureToken, hashToken } from '../../../utils/crypto.js';
import { sendVerificationEmail } from '../../../utils/email.js';
import { logAuditEvent, AuditAction } from '../../../utils/auditLogger.js';
import ApiError from '../../../utils/apiError.js';

export class EmailVerificationService {
  /**
   * Email verification flow
   */
  async verifyEmail({ rawToken, clientIp, userAgent }) {
    const tokenHash = hashToken(rawToken);
    const tokenRecord = await authRepository.findEmailVerificationTokenByHash(tokenHash);

    if (!tokenRecord) {
      throw new ApiError(400, 'Invalid or expired email verification link');
    }

    if (tokenRecord.used_at) {
      throw new ApiError(400, 'Verification link has already been used');
    }

    if (new Date(tokenRecord.expires_at) < new Date()) {
      throw new ApiError(400, 'Verification link has expired');
    }

    await authRepository.markEmailVerificationTokenUsed(tokenRecord.id);
    await authRepository.updateUser(tokenRecord.user_id, {
      email_verified: true,
      email_verified_at: new Date(),
    });

    await logAuditEvent({
      userId: tokenRecord.user_id,
      action: AuditAction.EMAIL_VERIFIED,
      ipAddress: clientIp,
      userAgent,
    });

    return { message: 'Email address verified successfully' };
  }

  /**
   * Resend verification email
   */
  async resendVerification({ email, clientIp, userAgent }) {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await authRepository.findUserByEmail(normalizedEmail);

    if (user && !user.email_verified && user.is_active) {
      const rawToken = generateSecureToken();
      const tokenHash = hashToken(rawToken);
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      await authRepository.createEmailVerificationToken({
        userId: user.id,
        tokenHash,
        expiresAt,
      });

      await sendVerificationEmail(user.email, user.first_name, rawToken);
    }

    return {
      message: 'If an unverified account exists for this email, a verification link has been sent.',
    };
  }
}

export const emailVerificationService = new EmailVerificationService();
export default emailVerificationService;