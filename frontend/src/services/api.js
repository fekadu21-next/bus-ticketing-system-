import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

// ---------------------------------------------------------------------------
// In-memory access token — never stored in localStorage or sessionStorage
// to protect against XSS attacks.
// ---------------------------------------------------------------------------
let inMemoryAccessToken = null;

/** Store a new access token in memory */
export const setAccessToken = (token) => {
  inMemoryAccessToken = token;
};

/** Read the current in-memory access token */
export const getAccessToken = () => inMemoryAccessToken;

/** Remove the in-memory access token */
export const clearAccessToken = () => {
  inMemoryAccessToken = null;
};

// ---------------------------------------------------------------------------
// Axios instance — withCredentials sends the HttpOnly refresh cookie on every
// request so the /auth/refresh endpoint can silently rotate tokens.
// ---------------------------------------------------------------------------
export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// ---------------------------------------------------------------------------
// Token-refresh queue — prevents multiple concurrent refresh calls when
// several 401s arrive simultaneously.
// ---------------------------------------------------------------------------
let isRefreshing = false;
let refreshSubscribers = [];

const subscribeTokenRefresh = (callback) => {
  refreshSubscribers.push(callback);
};

const onRefreshed = (token) => {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
};

// ---------------------------------------------------------------------------
// Global auth-failure callback — set by AuthContext so it can clear state
// when an unrecoverable 401 occurs (e.g. refresh token has expired).
// ---------------------------------------------------------------------------
let onAuthFailureCallback = null;

/** Register a callback to be invoked when authentication fails unrecoverably. */
export const setAuthFailureHandler = (callback) => {
  onAuthFailureCallback = callback;
};

// ---------------------------------------------------------------------------
// Request interceptor — attaches the Bearer token to every outgoing request.
// ---------------------------------------------------------------------------
api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ---------------------------------------------------------------------------
// Response interceptor — transparently refreshes access tokens on 401 and
// retries the original request. Auth endpoints are excluded to avoid loops.
// ---------------------------------------------------------------------------
const AUTH_ENDPOINTS = [
  '/auth/login',
  '/auth/register',
  '/auth/refresh',
  '/auth/verify-email',
  '/auth/forgot-password',
  '/auth/reset-password',
];

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isAuthEndpoint = AUTH_ENDPOINTS.some((ep) =>
      originalRequest.url?.includes(ep)
    );

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isAuthEndpoint
    ) {
      // Queue subsequent 401s while a refresh is already in-flight
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          subscribeTokenRefresh((newToken) => {
            if (newToken) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              resolve(api(originalRequest));
            } else {
              reject(error);
            }
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );
        const newToken = data.data.accessToken;
        setAccessToken(newToken);
        onRefreshed(newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        clearAccessToken();
        onRefreshed(null);
        if (onAuthFailureCallback) onAuthFailureCallback();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;