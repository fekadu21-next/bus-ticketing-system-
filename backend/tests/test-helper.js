process.env.NODE_ENV = 'test';
import app from '../app.js';
import prisma, { connectDB, disconnectDB } from '../Config/db.js';
import http from 'http';
import socketService from '../services/socket.service.js';
import bcrypt from 'bcryptjs';

let server;
let baseUrl;

const ADMIN_HASH = bcrypt.hashSync('Admin@123456', 10);
const COORD_HASH = bcrypt.hashSync('Coordinator@123456', 10);
const DRIVER_HASH = bcrypt.hashSync('Driver@123456', 10);
const VERIFIER_HASH = bcrypt.hashSync('Verifier@123456', 10);

export async function startTestServer() {
  await connectDB();

  // Ensure seeded test users have exact passwords and are unlocked
  await Promise.all([
    prisma.users.updateMany({
      where: { email: 'admin@busticket.com' },
      data: { password_hash: ADMIN_HASH, failed_login_attempts: 0, locked_until: null, is_active: true },
    }).catch(() => {}),
    prisma.users.updateMany({
      where: { email: 'coordinator@busticket.com' },
      data: { password_hash: COORD_HASH, failed_login_attempts: 0, locked_until: null, is_active: true },
    }).catch(() => {}),
    prisma.users.updateMany({
      where: { email: 'driver@busticket.com' },
      data: { password_hash: DRIVER_HASH, failed_login_attempts: 0, locked_until: null, is_active: true },
    }).catch(() => {}),
    prisma.users.updateMany({
      where: { email: 'driver2@busticket.com' },
      data: { password_hash: DRIVER_HASH, failed_login_attempts: 0, locked_until: null, is_active: true },
    }).catch(() => {}),
    prisma.users.updateMany({
      where: { email: 'verifier@busticket.com' },
      data: { password_hash: VERIFIER_HASH, failed_login_attempts: 0, locked_until: null, is_active: true },
    }).catch(() => {}),
  ]);

  return new Promise((resolve) => {
    server = http.createServer(app);
    socketService.init(server);
    server.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}/api/v1`;
      resolve({ server, baseUrl, port });
    });
  });
}

export async function stopTestServer() {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
  await disconnectDB();
}

export async function apiRequest(endpoint, { method = 'GET', body = null, token = null, cookie = null, headers = {} } = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
  const reqHeaders = {
    'Content-Type': 'application/json',
    ...headers,
  };

  if (token) {
    reqHeaders['Authorization'] = `Bearer ${token}`;
  }

  if (cookie) {
    reqHeaders['Cookie'] = cookie;
  }

  const response = await fetch(url, {
    method,
    headers: reqHeaders,
    body: body ? JSON.stringify(body) : undefined,
  });

  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json')
    ? await response.json()
    : await response.text();

  // Extract set-cookie headers
  const setCookie = response.headers.get('set-cookie');

  return {
    status: response.status,
    headers: response.headers,
    data,
    cookie: setCookie,
  };
}

export { prisma };
export default { startTestServer, stopTestServer, apiRequest, prisma };
