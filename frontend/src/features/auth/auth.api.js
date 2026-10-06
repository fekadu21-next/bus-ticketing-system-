import api from '@/services/api';

/**
 * Register a new passenger account.
 * @param {{ firstName, lastName, email, phone, password, confirmPassword }} payload
 */
export const registerApi = async (payload) => {
  const { data } = await api.post('/auth/register', payload);
  return data;
};

/**
 * Authenticate with email and password.
 * Returns accessToken + user object. Refresh token set as HttpOnly cookie.
 * @param {{ email, password }} payload
 */
export const loginApi = async (payload) => {
  const { data } = await api.post('/auth/login', payload);
  return data;
};

/**
 * Invalidate the current session.
 * Clears the HttpOnly refresh token cookie on the server.
 */
export const logoutApi = async () => {
  const { data } = await api.post('/auth/logout');
  return data;
};

/**
 * Silently exchange the HttpOnly refresh cookie for a new access token.
 * Called on app load to restore an existing session.
 */
export const refreshApi = async () => {
  const { data } = await api.post('/auth/refresh', {});
  return data;
};

/**
 * Fetch the current authenticated user's full profile.
 */
export const getMeApi = async () => {
  const { data } = await api.get('/auth/me');
  return data;
};

/**
 * Verify an email address using the token from the verification email link.
 * @param {{ token: string }} payload
 */
export const verifyEmailApi = async (payload) => {
  const { data } = await api.post('/auth/verify-email', payload);
  return data;
};

/**
 * Request a new email verification link for the given address.
 * @param {{ email: string }} payload
 */
export const resendVerificationApi = async (payload) => {
  const { data } = await api.post('/auth/resend-verification', payload);
  return data;
};

/**
 * Request a password reset email.
 * Errors are intentionally swallowed by the caller to prevent account enumeration.
 * @param {{ email: string }} payload
 */
export const forgotPasswordApi = async (payload) => {
  const { data } = await api.post('/auth/forgot-password', payload);
  return data;
};

/**
 * Set a new password using the one-time reset token from the email link.
 * @param {{ token: string, newPassword: string, confirmPassword: string }} payload
 */
export const resetPasswordApi = async (payload) => {
  const { data } = await api.post('/auth/reset-password', payload);
  return data;
};

/**
 * Change the password for the currently authenticated user.
 * Returns a new accessToken on success.
 * @param {{ currentPassword: string, newPassword: string, confirmPassword: string }} payload
 */
export const changePasswordApi = async (payload) => {
  const { data } = await api.post('/auth/change-password', payload);
  return data;
};

export default {
  registerApi,
  loginApi,
  logoutApi,
  refreshApi,
  getMeApi,
  verifyEmailApi,
  resendVerificationApi,
  forgotPasswordApi,
  resetPasswordApi,
  changePasswordApi,
};
