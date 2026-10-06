import api from '@/services/api';

/**
 * Passenger registration
 */
export const registerApi = async (payload) => {
  const { data } = await api.post('/auth/register', payload);
  return data;
};

/**
 * User login
 */
export const loginApi = async (payload) => {
  const { data } = await api.post('/auth/login', payload);
  return data;
};

/**
 * Invalidate session and logout
 */
export const logoutApi = async () => {
  const { data } = await api.post('/auth/logout');
  return data;
};

/**
 * Refresh access token
 */
export const refreshApi = async () => {
  const { data } = await api.post('/auth/refresh', {});
  return data;
};

/**
 * Fetch current user profile
 */
export const getMeApi = async () => {
  const { data } = await api.get('/auth/me');
  return data;
};

/**
 * Verify email token
 */
export const verifyEmailApi = async (payload) => {
  const { data } = await api.post('/auth/verify-email', payload);
  return data;
};

/**
 * Resend email verification
 */
export const resendVerificationApi = async (payload) => {
  const { data } = await api.post('/auth/resend-verification', payload);
  return data;
};

/**
 * Request forgot password email
 */
export const forgotPasswordApi = async (payload) => {
  const { data } = await api.post('/auth/forgot-password', payload);
  return data;
};

/**
 * Reset password with token
 */
export const resetPasswordApi = async (payload) => {
  const { data } = await api.post('/auth/reset-password', payload);
  return data;
};

/**
 * Change password
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
