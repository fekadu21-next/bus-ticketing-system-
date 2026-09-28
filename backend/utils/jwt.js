import jwt from 'jsonwebtoken';
import env from '../Config/env.js';
import { generateUUID } from './crypto.js';


export function generateAccessToken(userId) {
  if (!userId) {
    throw new Error('User ID is required to generate an access token');
  }

  const payload = {
    sub: userId,
    jti: generateUUID(),
    type: 'access',
  };

  return jwt.sign(payload, env.jwt.accessSecret, {
    expiresIn: env.jwt.accessExpiresIn,
  });
}

export function verifyAccessToken(token) {
  if (!token) {
    throw new Error('Token is required for verification');
  }

  return jwt.verify(token, env.jwt.accessSecret);
}

export default {
  generateAccessToken,
  verifyAccessToken,
};