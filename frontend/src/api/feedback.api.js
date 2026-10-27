import api from '@/services/api';

/**
 * Platform Feedback APIs
 */
export const submitPlatformFeedbackApi = async (data) => {
  const response = await api.post('/feedback', data);
  return response.data;
};

export const getMyPlatformFeedbacksApi = async () => {
  const response = await api.get('/feedback/my');
  return response.data;
};

export const getAdminPlatformFeedbacksApi = async (params = {}) => {
  const response = await api.get('/feedback/admin', { params });
  return response.data;
};

export const respondToPlatformFeedbackApi = async (feedbackId, data) => {
  const response = await api.patch(`/feedback/admin/${feedbackId}`, data);
  return response.data;
};

/**
 * Trip Ratings & Reviews APIs
 */
export const getCoordinatorTripFeedbackApi = async (orgId, params = {}) => {
  const url = orgId ? `/organizations/${orgId}/feedback` : '/coordinator/feedback';
  const response = await api.get(url, { params });
  return response.data;
};

export const submitPassengerTripFeedbackApi = async (data) => {
  const response = await api.post('/passenger/feedback', data);
  return response.data;
};

export const getPassengerTripFeedbackApi = async (tripId) => {
  const response = await api.get(`/passenger/feedback/trips/${tripId}`);
  return response.data;
};

export const getMyPassengerFeedbacksApi = async () => {
  const response = await api.get('/passenger/feedback');
  return response.data;
};

