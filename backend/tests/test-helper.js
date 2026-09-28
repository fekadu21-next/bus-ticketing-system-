process.env.NODE_ENV = 'test';
import app from '../app.js';
import prisma, { connectDB, disconnectDB } from '../Config/db.js';
import http from 'http';

let server;
let baseUrl;

export async function startTestServer() {
  await connectDB();
  return new Promise((resolve) => {
    server = http.createServer(app);
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

  let data = null;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  // Extract set-cookie headers
  const setCookie = response.headers.get('set-cookie');

  return {
    status: response.status,
    ok: response.ok,
    headers: response.headers,
    cookie: setCookie,
    data,
  };
}

export { prisma, baseUrl };
