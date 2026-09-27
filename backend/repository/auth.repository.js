import prisma from '../Config/db.js';
import { ROLES } from '../constants/index.js';

export class AuthRepository {
  /**
   * Finds a user by email with their roles, permissions, and organizations
   * @param {string} email
   */
  async findUserByEmail(email) {
    return prisma.users.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        user_roles: {
          include: {
            roles: {
              include: {
                role_permissions: {
                  include: {
                    permissions: true,
                  },
                },
              },
            },
            organizations: true,
          },
        },
      },
    });
  }

  /**
   * Finds a user by ID with their roles, permissions, and organizations
   * @param {string} id
   */
  async findUserById(id) {
    return prisma.users.findUnique({
      where: { id },
      include: {
        user_roles: {
          include: {
            roles: {
              include: {
                role_permissions: {
                  include: {
                    permissions: true,
                  },
                },
              },
            },
            organizations: true,
          },
        },
      },
    });
  }

  /**
   * Creates a public passenger user with the PASSENGER role
   */
  async createPassengerUser({ firstName, lastName, email, phone, passwordHash }) {
    let passengerRole = await prisma.roles.findUnique({
      where: { name: ROLES.PASSENGER },
    });

    if (!passengerRole) {
      passengerRole = await prisma.roles.create({
        data: {
          name: ROLES.PASSENGER,
          description: 'Public passenger who books and manages tickets',
        },
      });
    }

    return prisma.users.create({
      data: {
        first_name: firstName,
        last_name: lastName,
        email: email.toLowerCase(),
        phone: phone || null,
        password_hash: passwordHash,
        is_active: true,
        email_verified: false,
        user_roles: {
          create: {
            role_id: passengerRole.id,
            organization_id: null,
          },
        },
      },
    });
  }

  /**
   * Updates user by ID
   */
  async updateUser(id, data) {
    return prisma.users.update({
      where: { id },
      data,
    });
  }

  /**
   * Refresh Token Operations
   */
  async createRefreshToken({ userId, tokenHash, expiresAt, userAgent = null, ipAddress = null }) {
    return prisma.refresh_tokens.create({
      data: {
        user_id: userId,
        token_hash: tokenHash,
        expires_at: expiresAt,
        user_agent: userAgent,
        ip_address: ipAddress,
      },
    });
  }

  async findRefreshTokenByHash(tokenHash) {
    return prisma.refresh_tokens.findUnique({
      where: { token_hash: tokenHash },
      include: {
        users: {
          include: {
            user_roles: {
              include: {
                roles: true,
                organizations: true,
              },
            },
          },
        },
      },
    });
  }

  async revokeRefreshToken(id, replacedByTokenId = null) {
    return prisma.refresh_tokens.update({
      where: { id },
      data: {
        revoked_at: new Date(),
        replaced_by_token_id: replacedByTokenId,
      },
    });
  }

  async revokeAllUserRefreshTokens(userId) {
    return prisma.refresh_tokens.updateMany({
      where: {
        user_id: userId,
        revoked_at: null,
      },
      data: {
        revoked_at: new Date(),
      },
    });
  }

  /**
   * Email Verification Token Operations
   */
  async createEmailVerificationToken({ userId, tokenHash, expiresAt }) {
    return prisma.email_verification_tokens.create({
      data: {
        user_id: userId,
        token_hash: tokenHash,
        expires_at: expiresAt,
      },
    });
  }

  async findEmailVerificationTokenByHash(tokenHash) {
    return prisma.email_verification_tokens.findUnique({
      where: { token_hash: tokenHash },
      include: {
        users: true,
      },
    });
  }

  async markEmailVerificationTokenUsed(id) {
    return prisma.email_verification_tokens.update({
      where: { id },
      data: {
        used_at: new Date(),
      },
    });
  }

  /**
   * Password Reset Token Operations
   */
  async createPasswordResetToken({ userId, tokenHash, expiresAt }) {
    return prisma.password_reset_tokens.create({
      data: {
        user_id: userId,
        token_hash: tokenHash,
        expires_at: expiresAt,
      },
    });
  }

  async findPasswordResetTokenByHash(tokenHash) {
    return prisma.password_reset_tokens.findUnique({
      where: { token_hash: tokenHash },
      include: {
        users: true,
      },
    });
  }

  async markPasswordResetTokenUsed(id) {
    return prisma.password_reset_tokens.update({
      where: { id },
      data: {
        used_at: new Date(),
      },
    });
  }
}

export const authRepository = new AuthRepository();
export default authRepository;
