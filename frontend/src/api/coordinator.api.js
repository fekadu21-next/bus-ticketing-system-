/**
 * Coordinator API — wraps all /organizations/:orgId/* endpoints
 * exposed by the backend for BOOKING_COORDINATOR role.
 */
import api from '@/services/api';

// ─── Buses ───────────────────────────────────────────────────────────────────

export const getBusesApi = async (orgId, params = {}) => {
  const { data } = await api.get(`/organizations/${orgId}/buses`, { params });
  return data;
};

export const getBusByIdApi = async (orgId, busId) => {
  const { data } = await api.get(`/organizations/${orgId}/buses/${busId}`);
  return data;
};

export const createBusApi = async (orgId, payload) => {
  const { data } = await api.post(`/organizations/${orgId}/buses`, payload);
  return data;
};

export const updateBusApi = async (orgId, busId, payload) => {
  const { data } = await api.patch(`/organizations/${orgId}/buses/${busId}`, payload);
  return data;
};

export const deleteBusApi = async (orgId, busId) => {
  const { data } = await api.delete(`/organizations/${orgId}/buses/${busId}`);
  return data;
};

// ─── Routes ──────────────────────────────────────────────────────────────────

export const getRoutesApi = async (orgId, params = {}) => {
  const { data } = await api.get(`/organizations/${orgId}/routes`, { params });
  return data;
};

export const getRouteByIdApi = async (orgId, routeId) => {
  const { data } = await api.get(`/organizations/${orgId}/routes/${routeId}`);
  return data;
};

export const createRouteApi = async (orgId, payload) => {
  const { data } = await api.post(`/organizations/${orgId}/routes`, payload);
  return data;
};

export const updateRouteApi = async (orgId, routeId, payload) => {
  const { data } = await api.patch(`/organizations/${orgId}/routes/${routeId}`, payload);
  return data;
};

export const deleteRouteApi = async (orgId, routeId) => {
  const { data } = await api.delete(`/organizations/${orgId}/routes/${routeId}`);
  return data;
};

// ─── Trips ───────────────────────────────────────────────────────────────────

export const getTripsApi = async (orgId, params = {}) => {
  const { data } = await api.get(`/organizations/${orgId}/trips`, { params });
  return data;
};

export const getTripByIdApi = async (orgId, tripId) => {
  const { data } = await api.get(`/organizations/${orgId}/trips/${tripId}`);
  return data;
};

export const createTripApi = async (orgId, payload) => {
  const { data } = await api.post(`/organizations/${orgId}/trips`, payload);
  return data;
};

export const updateTripApi = async (orgId, tripId, payload) => {
  const { data } = await api.patch(`/organizations/${orgId}/trips/${tripId}`, payload);
  return data;
};

export const cancelTripApi = async (orgId, tripId) => {
  // Backend route is POST /organizations/:orgId/trips/:tripId/cancel
  const { data } = await api.post(`/organizations/${orgId}/trips/${tripId}/cancel`);
  return data;
};

export const getTripSeatsApi = async (orgId, tripId) => {
  const { data } = await api.get(`/organizations/${orgId}/trips/${tripId}/seats`);
  return data;
};

export const updateSeatStatusApi = async (orgId, tripId, seatId, status) => {
  const { data } = await api.patch(
    `/organizations/${orgId}/trips/${tripId}/seats/${seatId}`,
    { status }
  );
  return data;
};

export const batchUpdateSeatsApi = async (orgId, tripId, seatNumbers, status) => {
  const { data } = await api.patch(
    `/organizations/${orgId}/trips/${tripId}/seats/batch`,
    { seatNumbers, status }
  );
  return data;
};

// ─── Bookings ────────────────────────────────────────────────────────────────

export const getBookingsApi = async (orgId, params = {}) => {
  const { data } = await api.get(`/organizations/${orgId}/bookings`, { params });
  return data;
};

export const getBookingByIdApi = async (orgId, bookingId) => {
  const { data } = await api.get(`/organizations/${orgId}/bookings/${bookingId}`);
  return data;
};

// ─── Payments ────────────────────────────────────────────────────────────────

export const getPaymentsApi = async (orgId, params = {}) => {
  const { data } = await api.get(`/organizations/${orgId}/payments`, { params });
  return data;
};

export const getPaymentByIdApi = async (orgId, paymentId) => {
  const { data } = await api.get(`/organizations/${orgId}/payments/${paymentId}`);
  return data;
};

// ─── Reports & Operational Statistics ───────────────────────────────────────

export const getOperationalStatsApi = async (orgId) => {
  const { data } = await api.get(`/organizations/${orgId}/reports`);
  return data;
};

// Alias for backward compatibility
export const getDashboardReportApi = async (orgId) => {
  return getOperationalStatsApi(orgId);
};

// ─── Staff (Drivers & Verifiers) ─────────────────────────────────────────────

export const getStaffApi = async (orgId, params = {}) => {
  const { data } = await api.get(`/organizations/${orgId}/staff`, { params });
  return data;
};

export const createStaffApi = async (orgId, payload) => {
  const { data } = await api.post(`/organizations/${orgId}/staff`, payload);
  return data;
};

// ─── Ticket Verification ─────────────────────────────────────────────────────

export const verifyTicketApi = async (orgId, payload) => {
  const { data } = await api.post(`/organizations/${orgId}/verify-ticket`, payload);
  return data;
};

export default {
  getStaffApi,
  createStaffApi,
  getBusesApi,
  getBusByIdApi,
  createBusApi,
  updateBusApi,
  deleteBusApi,
  getRoutesApi,
  getRouteByIdApi,
  createRouteApi,
  updateRouteApi,
  deleteRouteApi,
  getTripsApi,
  getTripByIdApi,
  createTripApi,
  updateTripApi,
  cancelTripApi,
  getTripSeatsApi,
  updateSeatStatusApi,
  batchUpdateSeatsApi,
  getBookingsApi,
  getBookingByIdApi,
  getPaymentsApi,
  getPaymentByIdApi,
  getOperationalStatsApi,
  getDashboardReportApi,
  verifyTicketApi,
};
