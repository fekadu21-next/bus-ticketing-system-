import crypto from 'node:crypto';

export function generateSecureToken() {
  return crypto.randomBytes(32).toString('hex');
}


export function hashToken(token) {
  if (!token || typeof token !== 'string') {
    throw new Error('Token must be a non-empty string');
  }
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function generateUUID() {
  return crypto.randomUUID();
}

export default {
  generateSecureToken,
  hashToken,
  generateUUID,
};
