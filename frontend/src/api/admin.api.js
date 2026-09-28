import api from '@/services/api';

/**
 * Platform Admin Dashboard Statistics
 */
export const getAdminDashboardStatsApi = async () => {
  const { data } = await api.get('/admin/dashboard');
  return data;
};

/**
 * List organizations for Admin with status, pagination, and search
 */
export const getAdminOrganizationsApi = async (params = {}) => {
  const { data } = await api.get('/admin/organizations', { params });
  return data;
};

/**
 * Get organization details by ID
 */
export const getAdminOrganizationByIdApi = async (id) => {
  const { data } = await api.get(`/admin/organizations/${id}`);
  return data;
};

/**
 * Approve pending organization
 */
export const approveOrganizationApi = async (id) => {
  const { data } = await api.patch(`/admin/organizations/${id}/approve`);
  return data;
};

/**
 * Reject organization with reason
 */
export const rejectOrganizationApi = async (id, reason) => {
  const { data } = await api.patch(`/admin/organizations/${id}/reject`, { reason });
  return data;
};

/**
 * Suspend organization with reason
 */
export const suspendOrganizationApi = async (id, reason) => {
  const { data } = await api.patch(`/admin/organizations/${id}/suspend`, { reason });
  return data;
};

/**
 * Reactivate suspended organization
 */
export const activateOrganizationApi = async (id) => {
  const { data } = await api.patch(`/admin/organizations/${id}/activate`);
  return data;
};

/**
 * List platform users (Admin only)
 */
export const getUsersApi = async (params = {}) => {
  const { data } = await api.get('/users', { params });
  return data;
};

/**
 * Create user (Admin only)
 */
export const createUserApi = async (payload) => {
  const { data } = await api.post('/users', payload);
  return data;
};

/**
 * Update user (Admin only)
 */
export const updateUserApi = async (id, payload) => {
  const { data } = await api.patch(`/users/${id}`, payload);
  return data;
};

/**
 * Toggle user active/suspended status (Admin only)
 */
export const toggleUserStatusApi = async (id, isActive) => {
  const { data } = await api.patch(`/users/${id}/status`, { isActive });
  return data;
};

/**
 * RBAC: Get all roles
 */
export const getRolesApi = async () => {
  const { data } = await api.get('/rbac/roles');
  return data;
};

/**
 * RBAC: Get all permissions
 */
export const getPermissionsApi = async () => {
  const { data } = await api.get('/rbac/permissions');
  return data;
};

/**
 * Admin Monitor: Platform-wide Buses
 */
export const getAdminBusesApi = async (params = {}) => {
  const { data } = await api.get('/admin/buses', { params });
  return data;
};

/**
 * Admin Monitor: Platform-wide Routes
 */
export const getAdminRoutesApi = async (params = {}) => {
  const { data } = await api.get('/admin/routes', { params });
  return data;
};

/**
 * Admin Monitor: Platform-wide Trips
 */
export const getAdminTripsApi = async (params = {}) => {
  const { data } = await api.get('/admin/trips', { params });
  return data;
};

/**
 * Admin Monitor: Platform-wide Bookings
 */
export const getAdminBookingsApi = async (params = {}) => {
  const { data } = await api.get('/admin/bookings', { params });
  return data;
};

/**
 * Admin Monitor: Platform-wide Payments
 */
export const getAdminPaymentsApi = async (params = {}) => {
  const { data } = await api.get('/admin/payments', { params });
  return data;
};

/**
 * Admin Monitor: Platform Audit Logs
 */
export const getAdminAuditLogsApi = async (params = {}) => {
  const { data } = await api.get('/admin/audit-logs', { params });
  return data;
};

/**
 * Admin Monitor: Platform Reports
 */
export const getAdminReportsApi = async () => {
  const { data } = await api.get('/admin/reports');
  return data;
};

/**
 * Admin Monitor: Platform Route Stations
 */
export const getAdminStationsApi = async () => {
  const { data } = await api.get('/admin/stations');
  return data;
};

export default {
  getAdminDashboardStatsApi,
  getAdminOrganizationsApi,
  getAdminOrganizationByIdApi,
  approveOrganizationApi,
  rejectOrganizationApi,
  suspendOrganizationApi,
  activateOrganizationApi,
  getUsersApi,
  createUserApi,
  updateUserApi,
  toggleUserStatusApi,
  getRolesApi,
  getPermissionsApi,
  getAdminBusesApi,
  getAdminRoutesApi,
  getAdminTripsApi,
  getAdminBookingsApi,
  getAdminPaymentsApi,
  getAdminAuditLogsApi,
  getAdminReportsApi,
  getAdminStationsApi,
};
