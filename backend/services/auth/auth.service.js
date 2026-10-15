import authRepository from '../../repository/auth.repository.js';
import { hashPassword } from '../../utils/password.js';
import { generateSecureToken, hashToken } from '../../utils/crypto.js';
import { sendVerificationEmail } from '../../utils/email.js';
import { logAuditEvent, AuditAction } from '../../utils/auditLogger.js';
import ApiError from '../../utils/apiError.js';
import { formatSafeUser } from './utils/formatSafeUser.js';
import { ROLES } from '../../constants/index.js';
import prisma from '../../Config/db.js';

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
      roles: [ROLES.PASSENGER],
    };
  }

  /**
   * Register a new partner organization & coordinator/operator user
   */
  async registerPartner({
    orgName,
    orgType,
    orgEmail,
    orgPhone,
    city,
    regNumber,
    address,
    repFullName,
    repPosition,
    repPhone,
    repEmail,
    firstName,
    lastName,
    email,
    phone,
    password,
    clientIp,
    userAgent,
  }) {
    const normalizedEmail = (email || repEmail || orgEmail).trim().toLowerCase();

    const existingUser = await authRepository.findUserByEmail(normalizedEmail);
    if (existingUser) {
      const isAlreadyCoordinator = existingUser.user_roles?.some(
        (ur) => ur.organization_id && ur.roles?.name === ROLES.BOOKING_COORDINATOR
      );
      if (isAlreadyCoordinator) {
        throw new ApiError(400, 'This email is already registered as an organization operator');
      }
    }

    const trimmedOrgName = orgName.trim();
    const existingOrg = await prisma.organizations.findFirst({
      where: { name: { equals: trimmedOrgName, mode: 'insensitive' } },
    });
    if (existingOrg) {
      throw new ApiError(400, 'An organization with this name already exists');
    }

    const hashedPassword = await hashPassword(password);

    let fName = (firstName || '').trim();
    let lName = (lastName || '').trim();
    if (!fName && repFullName) {
      const parts = repFullName.trim().split(' ');
      fName = parts[0] || 'Representative';
      lName = parts.slice(1).join(' ') || 'Manager';
    }
    if (!fName) fName = 'Operations';
    if (!lName) lName = 'Manager';

    let coordinatorRole = await prisma.roles.findUnique({
      where: { name: ROLES.BOOKING_COORDINATOR },
    });
    if (!coordinatorRole) {
      coordinatorRole = await prisma.roles.create({
        data: {
          name: ROLES.BOOKING_COORDINATOR,
          description: 'Manager for organization bus schedules, trips, fleet, and bookings',
        },
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      const organization = await tx.organizations.create({
        data: {
          name: trimmedOrgName,
          type: orgType ? orgType.trim() : 'COMPANY',
          status: 'PENDING',
          is_active: true,
        },
      });

      let user;
      if (existingUser) {
        user = await tx.users.update({
          where: { id: existingUser.id },
          data: {
            password_hash: hashedPassword,
            phone: (phone || repPhone || orgPhone) ? (phone || repPhone || orgPhone).trim() : existingUser.phone,
            email_verified: true,
            is_active: true,
          },
        });

        await tx.user_roles.create({
          data: {
            user_id: user.id,
            role_id: coordinatorRole.id,
            organization_id: organization.id,
          },
        });
      } else {
        user = await tx.users.create({
          data: {
            first_name: fName,
            last_name: lName,
            email: normalizedEmail,
            phone: (phone || repPhone || orgPhone) ? (phone || repPhone || orgPhone).trim() : null,
            password_hash: hashedPassword,
            is_active: true,
            email_verified: true, // Auto-verified for seamless operator login
            user_roles: {
              create: {
                role_id: coordinatorRole.id,
                organization_id: organization.id,
              },
            },
          },
        });
      }

      return { user, organization };
    });

    await logAuditEvent({
      userId: result.user.id,
      action: AuditAction.REGISTER,
      details: {
        email: result.user.email,
        organizationId: result.organization.id,
        organizationName: result.organization.name,
        role: ROLES.BOOKING_COORDINATOR,
      },
      ipAddress: clientIp,
      userAgent,
    });

    return {
      user: {
        id: result.user.id,
        firstName: result.user.first_name,
        lastName: result.user.last_name,
        email: result.user.email,
        phone: result.user.phone,
        emailVerified: result.user.email_verified,
        isActive: result.user.is_active,
        roles: [ROLES.BOOKING_COORDINATOR],
        organizationContext: [
          {
            organizationId: result.organization.id,
            organizationName: result.organization.name,
            role: ROLES.BOOKING_COORDINATOR,
          },
        ],
      },
      organization: result.organization,
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