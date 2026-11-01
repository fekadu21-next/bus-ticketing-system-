import api from '@/services/api';

/**
 * Fetch assigned trips for verifier's organization
 */
export const getVerifierTripsApi = async (params = {}) => {
  const { data } = await api.get('/verifier/trips', { params });
  return data;
};

/**
 * Fetch passenger manifest and verification summary for a specific trip
 */
export const getVerifierTripManifestApi = async (tripId) => {
  const { data } = await api.get(`/verifier/trips/${tripId}`);
  return data;
};

/**
 * Verify a boarding ticket by QR token or ticket number
 * @param {{ qrToken: string, tripId?: string }} payload
 */
export const verifyTicketApi = async (payload) => {
  const { data } = await api.post('/verifier/tickets/verify', payload);
  return data;
};

/**
 * Fetch recent ticket verification audit records for verifier
 */
export const getVerifierHistoryApi = async () => {
  const { data } = await api.get('/verifier/history');
  return data;
};

