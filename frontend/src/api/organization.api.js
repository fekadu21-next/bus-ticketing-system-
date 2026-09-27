import api from '@/services/api';

/**
 * List organizations (authenticated)
 */
export const getOrganizationsApi = async (params = {}) => {
  const { data } = await api.get('/organizations', { params });
  return data;
};

/**
 * Get organization by ID (Admin or Member)
 */
export const getOrganizationByIdApi = async (orgId) => {
  const { data } = await api.get(`/organizations/${orgId}`);
  return data;
};

/**
 * Create organization (Admin only)
 */
export const createOrganizationApi = async (payload) => {
  const { data } = await api.post('/organizations', payload);
  return data;
};

/**
 * List users (Admin only)
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
 * List system roles (Authenticated)
 */
export const getRolesApi = async () => {
  const { data } = await api.get('/rbac/roles');
  return data;
};

/**
 * List system permissions (Authenticated)
 */
export const getPermissionsApi = async () => {
  const { data } = await api.get('/rbac/permissions');
  return data;
};

export default {
  getOrganizationsApi,
  getOrganizationByIdApi,
  createOrganizationApi,
  getUsersApi,
  createUserApi,
  getRolesApi,
  getPermissionsApi,
};
