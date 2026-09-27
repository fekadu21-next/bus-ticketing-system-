import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  loginApi,
  registerApi,
  logoutApi,
  refreshApi,
  changePasswordApi,
  getMeApi,
} from '@/api/auth.api';
import { setAccessToken, clearAccessToken, setAuthFailureHandler } from '@/services/api';
import { ROLES } from '@/constants/roles';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [accessToken, setTokenState] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  /** Sync token to both React state and the Axios in-memory store */
  const updateAccessToken = useCallback((token) => {
    setAccessToken(token);
    setTokenState(token);
  }, []);

  /** Wipe all auth state on logout or expired session */
  const resetAuthState = useCallback(() => {
    clearAccessToken();
    setTokenState(null);
    setUser(null);
  }, []);

  /** Helper to get role-appropriate dashboard route */
  const getDashboardPath = useCallback((currentUser = user) => {
    if (!currentUser?.roles) return '/dashboard';
    if (currentUser.roles.includes(ROLES.ADMIN)) return '/admin';
    if (currentUser.roles.includes(ROLES.BOOKING_COORDINATOR)) return '/coordinator';
    if (currentUser.roles.includes(ROLES.TICKET_VERIFIER)) return '/verifier';
    if (currentUser.roles.includes(ROLES.PASSENGER)) return '/passenger';
    return '/dashboard';
  }, [user]);

  // Session initialization — silently tries to refresh on every app load
  const checkAuth = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await refreshApi();
      if (result.success && result.data?.accessToken) {
        updateAccessToken(result.data.accessToken);
        if (result.data.user) {
          setUser(result.data.user);
        } else {
          // Fetch full user profile if not in refresh payload
          const meResult = await getMeApi();
          if (meResult.success && meResult.data?.user) {
            setUser(meResult.data.user);
          }
        }
      }
    } catch {
      resetAuthState();
    } finally {
      setIsLoading(false);
    }
  }, [updateAccessToken, resetAuthState]);

  useEffect(() => {
    setAuthFailureHandler(resetAuthState);
    checkAuth();
  }, [checkAuth, resetAuthState]);

  // Public actions
  const login = async (email, password) => {
    setError(null);
    try {
      const response = await loginApi({ email, password });
      if (response.success && response.data) {
        updateAccessToken(response.data.accessToken);
        setUser(response.data.user);
        return { success: true, user: response.data.user, redirectPath: getDashboardPath(response.data.user) };
      }
      throw new Error(response.message || 'Login failed');
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Failed to login';
      setError(message);
      return { success: false, error: message };
    }
  };

  const register = async (userData) => {
    setError(null);
    try {
      const response = await registerApi(userData);
      return { success: true, message: response.message, data: response.data };
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Registration failed';
      const errors = err.response?.data?.errors || [];
      setError(message);
      return { success: false, error: message, errors };
    }
  };

  const logout = async () => {
    try {
      await logoutApi();
    } catch {
      // Ignore network errors on logout — always clear local state
    } finally {
      resetAuthState();
    }
  };

  const changePassword = async ({ currentPassword, newPassword, confirmPassword }) => {
    try {
      const response = await changePasswordApi({ currentPassword, newPassword, confirmPassword });
      if (response.success && response.data?.accessToken) {
        updateAccessToken(response.data.accessToken);
      }
      return { success: true, message: response.message };
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Failed to change password';
      return { success: false, error: message };
    }
  };

  const clearError = () => setError(null);

  // Role & Permission checking helpers
  const hasRole = (role) => {
    if (!user?.roles) return false;
    if (user.roles.includes(ROLES.ADMIN)) return true;
    return user.roles.includes(role);
  };

  const hasPermission = (permission) => {
    if (!user?.permissions) return false;
    if (user.roles?.includes(ROLES.ADMIN)) return true;
    return user.permissions.includes(permission);
  };

  const isAdmin = () => user?.roles?.includes(ROLES.ADMIN) || false;
  const isBookingCoordinator = () => user?.roles?.includes(ROLES.BOOKING_COORDINATOR) || false;
  const isTicketVerifier = () => user?.roles?.includes(ROLES.TICKET_VERIFIER) || false;
  const isPassenger = () => user?.roles?.includes(ROLES.PASSENGER) || false;

  // Backwards-compatible aliases
  const isPlatformAdmin = isAdmin;
  const isOperationalManager = isBookingCoordinator;

  const value = {
    user,
    accessToken,
    isAuthenticated: Boolean(user && accessToken),
    isLoading,
    error,
    // Actions
    login,
    register,
    logout,
    checkAuth,
    changePassword,
    clearError,
    getDashboardPath,
    // Authorization helpers
    hasRole,
    hasPermission,
    isAdmin,
    isBookingCoordinator,
    isTicketVerifier,
    isPassenger,
    isPlatformAdmin,
    isOperationalManager,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
