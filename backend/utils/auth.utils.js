import env from '../Config/env.js';

export const REFRESH_COOKIE_NAME = 'refreshToken';

export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.nodeEnv === 'production', // Only secure in production
  sameSite: env.nodeEnv === 'production' ? 'none' : 'lax', // lax for local dev, none for production
  path: '/', // Cookie is sent with all requests
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days in milliseconds
};


export function setRefreshTokenCookie(res, token) {
  res.cookie(REFRESH_COOKIE_NAME, token, COOKIE_OPTIONS);
}


export function clearRefreshTokenCookie(res) {
  res.clearCookie(REFRESH_COOKIE_NAME, {
    httpOnly: true,
    secure: env.nodeEnv === 'production',
    sameSite: env.nodeEnv === 'production' ? 'none' : 'lax',
    path: '/', // Must match the path used when setting the cookie
  });
}

export function getRefreshTokenFromRequest(req) {
  if (req.cookies && req.cookies[REFRESH_COOKIE_NAME]) {
    return req.cookies[REFRESH_COOKIE_NAME];
  }

  const cookieHeader = req.headers?.cookie;
  if (cookieHeader) {
    const parts = cookieHeader.split(';');
    for (const part of parts) {
      const trimmed = part.trim();
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      const name = trimmed.slice(0, eq).trim();
      if (name === REFRESH_COOKIE_NAME) {
        return decodeURIComponent(trimmed.slice(eq + 1));
      }
    }
  }

  if (req.body && req.body.refreshToken) {
    return req.body.refreshToken;
  }
  return null;
}

export default {
  REFRESH_COOKIE_NAME,
  COOKIE_OPTIONS,
  setRefreshTokenCookie,
  clearRefreshTokenCookie,
  getRefreshTokenFromRequest,
};
