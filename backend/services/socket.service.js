import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import env from '../Config/env.js';
import prisma from '../Config/db.js';

let io = null;

export class SocketService {
  /**
   * Initialize Socket.IO with HTTP Server
   */
  init(httpServer) {
    if (io) return io;

    const allowedOrigins = [
      env.clientUrl,
      process.env.FRONTEND_URL,
      process.env.CLIENT_URL,
      'http://localhost:5173',
      'http://127.0.0.1:5173',
    ].filter(Boolean);

    io = new Server(httpServer, {
      cors: {
        origin: (origin, callback) => {
          if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true);
          }
          return callback(null, true); // Allow client connections
        },
        credentials: true,
      },
      transports: ['websocket', 'polling'],
      pingTimeout: 30000,
      pingInterval: 25000,
    });

    // Authentication middleware for Socket.IO
    io.use(async (socket, next) => {
      try {
        const rawToken =
          socket.handshake.auth?.token ||
          socket.handshake.headers?.authorization?.replace(/^Bearer\s+/i, '') ||
          socket.handshake.query?.token;

        if (!rawToken) {
          return next(new Error('Authentication token required'));
        }

        const decoded = jwt.verify(rawToken, env.jwt.accessSecret);
        const userId = decoded?.sub || decoded?.id;
        if (!userId) {
          return next(new Error('Invalid token payload'));
        }

        // Fetch user roles and organizations for room subscription
        const user = await prisma.users.findUnique({
          where: { id: userId },
          include: {
            user_roles: {
              include: {
                roles: true,
                organizations: true,
              },
            },
          },
        });

        if (!user || !user.is_active) {
          return next(new Error('User inactive or not found'));
        }

        socket.user = {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          roles: user.user_roles.map((ur) => ur.roles.name),
          orgRoles: user.user_roles.map((ur) => ({
            role: ur.roles.name,
            organizationId: ur.organization_id,
          })),
        };

        return next();
      } catch (err) {
        return next(new Error(`Authentication failed: ${err.message}`));
      }
    });

    io.on('connection', (socket) => {
      const user = socket.user;
      if (!user) return;

      // 1. Join private user room for 1-to-1 notifications
      const userRoom = `user:${user.id}`;
      socket.join(userRoom);

      // 2. Join role rooms (e.g. role:ADMIN, role:PASSENGER)
      for (const role of user.roles) {
        socket.join(`role:${role}`);
      }

      // 3. Join organization rooms (e.g. org:XYZ, org:XYZ:BOOKING_COORDINATOR)
      for (const orgRole of user.orgRoles) {
        if (orgRole.organizationId) {
          socket.join(`org:${orgRole.organizationId}`);
          socket.join(`org:${orgRole.organizationId}:${orgRole.role}`);
        }
      }

      console.log(`🔌 [SOCKET.IO] Connected: ${user.email} (${user.id}) | Rooms:`, Array.from(socket.rooms));

      // Handle client acknowledgement / ping
      socket.on('ping', () => {
        socket.emit('pong', { timestamp: Date.now() });
      });

      socket.on('disconnect', (reason) => {
        // Disconnected
      });
    });

    return io;
  }

  getIO() {
    return io;
  }

  /**
   * Send real-time notification to a specific user
   */
  sendToUser(userId, event, payload) {
    if (!io || !userId) return false;
    io.to(`user:${userId}`).emit(event, payload);
    return true;
  }

  /**
   * Send real-time notification to multiple users
   */
  sendToUsers(userIds, event, payload) {
    if (!io || !Array.isArray(userIds) || userIds.length === 0) return false;
    userIds.forEach((userId) => {
      io.to(`user:${userId}`).emit(event, payload);
    });
    return true;
  }

  /**
   * Send to all users possessing a specific platform role (e.g. ADMIN)
   */
  sendToRole(role, event, payload) {
    if (!io || !role) return false;
    io.to(`role:${role}`).emit(event, payload);
    return true;
  }

  /**
   * Send to all members of an organization
   */
  sendToOrg(organizationId, event, payload) {
    if (!io || !organizationId) return false;
    io.to(`org:${organizationId}`).emit(event, payload);
    return true;
  }

  /**
   * Send to users with a specific role within an organization (e.g. BOOKING_COORDINATOR)
   */
  sendToOrgRole(organizationId, role, event, payload) {
    if (!io || !organizationId || !role) return false;
    io.to(`org:${organizationId}:${role}`).emit(event, payload);
    return true;
  }

  /**
   * Broadcast to all connected clients
   */
  broadcast(event, payload) {
    if (!io) return false;
    io.emit(event, payload);
    return true;
  }
}

export const socketService = new SocketService();
export default socketService;
