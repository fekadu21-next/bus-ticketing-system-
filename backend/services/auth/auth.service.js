import authRepository from '../../repository/auth.repository.js';
import { hashPassword } from '../../utils/password.js';
import { generateSecureToken, hashToken } from '../../utils/crypto.js';
import { sendVerificationEmail } from '../../utils/email.js';
import { logAuditEvent, AuditAction } from '../../utils/auditLogger.js';
import ApiError from '../../utils/apiError.js';
import { formatSafeUser } from './utils/formatSafeUser.js';

import { sessionService } from './session.service.js';
import { emailVerificationService } from './email-verification.service.js';
import { passwordService } from './password.service.js';

export class AuthService {
  /**
   * Format user wrapper
   */
  _formatSafeUser(user) {
    return formatSafeUser(user);
  }

  /**
   * Register a new passenger
   */
  async register({ firstName, lastName, email, phone, password, clientIp, userAgent }) {
    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await authRepository.findUserByEmail(normalizedEmail);
    if (existingUser) {
      throw new ApiError(400, 'Email is already registered');
    }

    const hashedPassword = await hashPassword(password);

    const user = await authRepository.createPassengerUser({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: normalizedEmail,
      phone: phone ? phone.trim() : null,
      passwordHash: hashedPassword,
    });

    // Generate email verification token (24 hours expiry)
    const rawVerificationToken = generateSecureToken();
    const tokenHash = hashToken(rawVerificationToken);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await authRepository.createEmailVerificationToken({
      userId: user.id,
      tokenHash,
      expiresAt,
    });

    // Send verification email
    await sendVerificationEmail(user.email, user.first_name, rawVerificationToken);

    // Audit log
    await logAuditEvent({
      userId: user.id,
      action: AuditAction.REGISTER,
      details: { email: user.email },
      ipAddress: clientIp,
      userAgent,
    });

    return {
      id: user.id,
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      emailVerified: user.email_verified,
      isActive: user.is_active,
      roles: ['PASSENGER'],
    };
  }

  /**
   * Retrieves current authenticated user
   */
  async getCurrentUser(userId) {
    const user = await authRepository.findUserById(userId);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    if (!user.is_active) {
      throw new ApiError(403, 'Account is inactive');
    }

    return this._formatSafeUser(user);
  }

  // --- Session Delegation ---
  login(data) {
    return sessionService.login(data);
  }

  refreshTokens(data) {
    return sessionService.refreshTokens(data);
  }

  logout(data) {
    return sessionService.logout(data);
  }

  // --- Email Verification Delegation ---
  verifyEmail(data) {
    return emailVerificationService.verifyEmail(data);
  }

  resendVerification(data) {
    return emailVerificationService.resendVerification(data);
  }

  // --- Password Delegation ---
  forgotPassword(data) {
    return passwordService.forgotPassword(data);
  }

  resetPassword(data) {
    return passwordService.resetPassword(data);
  }

  changePassword(data) {
    return passwordService.changePassword(data);
  }
}

export const authService = new AuthService();
export default authService;