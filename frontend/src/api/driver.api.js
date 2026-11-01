import api from '@/services/api';

/**
 * Fetch Driver Dashboard summary (profile, active trip, today's trips, stats)
 */
export const getDriverDashboardApi = async () => {
  const { data } = await api.get('/driver/dashboard');
  return data;
};

/**
 * Fetch trips assigned to authenticated driver
 */
export const getDriverTripsApi = async (params = {}) => {
  const { data } = await api.get('/driver/trips', { params });
  return data;
};

/**
 * Fetch details of an assigned trip
 */
export const getDriverTripDetailsApi = async (tripId) => {
  const { data } = await api.get(`/driver/trips/${tripId}`);
  return data;
};

/**
 * Start an assigned trip (status -> IN_TRANSIT)
 */
export const startDriverTripApi = async (tripId) => {
  const { data } = await api.post(`/driver/trips/${tripId}/start`);
  return data;
};

/**
 * Complete an in-transit trip (status -> COMPLETED)
 */
export const completeDriverTripApi = async (tripId) => {
  const { data } = await api.post(`/driver/trips/${tripId}/complete`);
  return data;
};

/**
 * Report an operational problem during a trip
 * @param {string} tripId
 * @param {{ type: string, description: string }} payload
 */
export const reportDriverProblemApi = async (tripId, payload) => {
  const { data } = await api.post(`/driver/trips/${tripId}/problems`, payload);
  return data;
};

/**
 * Fetch historical problem reports submitted by driver
 */
export const getDriverProblemsApi = async () => {
  const { data } = await api.get('/driver/problems');
  return data;
};

/**
 * Fetch authenticated driver's profile
 */
export const getDriverProfileApi = async () => {
  const { data } = await api.get('/driver/me');
  return data;
};

