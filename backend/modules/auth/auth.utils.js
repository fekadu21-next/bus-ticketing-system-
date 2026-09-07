import env from '../../Config/env.js';

export const REFRESH_COOKIE_NAME = 'refreshToken';

export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.nodeEnv === 'production',
  sameSite: 'lax',
  path: '/api/v1/auth',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
};


export function setRefreshTokenCookie(res, token) {
  res.cookie(REFRESH_COOKIE_NAME, token, COOKIE_OPTIONS);
}


export function clearRefreshTokenCookie(res) {
  res.clearCookie(REFRESH_COOKIE_NAME, {
    httpOnly: true,
    secure: env.nodeEnv === 'production',
    sameSite: 'lax',
    path: '/api/v1/auth',
  });
}

export function getRefreshTokenFromRequest(req) {
  if (req.cookies && req.cookies[REFRESH_COOKIE_NAME]) {
    return req.cookies[REFRESH_COOKIE_NAME];
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
