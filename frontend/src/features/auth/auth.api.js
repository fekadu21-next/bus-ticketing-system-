import api from '../../services/api.js';

export const registerApi = async (payload) => {
  const response = await api.post('/auth/register', payload);
  return response.data;
};

export const loginApi = async (payload) => {
  const response = await api.post('/auth/login', payload);
  return response.data;
};

export const logoutApi = async () => {
  const response = await api.post('/auth/logout');
  return response.data;
};

export const refreshApi = async () => {
  const response = await api.post('/auth/refresh');
  return response.data;
};

export const getMeApi = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};

export const verifyEmailApi = async (payload) => {
  const response = await api.post('/auth/verify-email', payload);
  return response.data;
};

export const resendVerificationApi = async (payload) => {
  const response = await api.post('/auth/resend-verification', payload);
  return response.data;
};

export const forgotPasswordApi = async (payload) => {
  const response = await api.post('/auth/forgot-password', payload);
  return response.data;
};

export const resetPasswordApi = async (payload) => {
  const response = await api.post('/auth/reset-password', payload);
  return response.data;
};

export const changePasswordApi = async (payload) => {
  const response = await api.post('/auth/change-password', payload);
  return response.data;
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
