import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  loginApi,
  registerApi,
  logoutApi,
  refreshApi,
  getMeApi,
  changePasswordApi,
} from '../features/auth/auth.api.js';
import { setAccessToken, clearAccessToken, setAuthFailureHandler } from '../services/api.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [accessToken, setTokenState] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Updates access token in both React state and Axios memory
  const updateAccessToken = useCallback((token) => {
    setAccessToken(token);
    setTokenState(token);
  }, []);

  // Clears user and auth state
  const resetAuthState = useCallback(() => {
    clearAccessToken();
    setTokenState(null);
    setUser(null);
  }, []);

  // Initializes session: attempts silent refresh via HttpOnly cookie
  const checkAuth = useCallback(async () => {
    setIsLoading(true);
    try {
      const refreshResult = await refreshApi();
      if (refreshResult.success && refreshResult.data?.accessToken) {
        updateAccessToken(refreshResult.data.accessToken);
        setUser(refreshResult.data.user);
      }
    } catch {
      // User is simply not logged in yet
      resetAuthState();
    } finally {
      setIsLoading(false);
    }
  }, [updateAccessToken, resetAuthState]);

  useEffect(() => {
    // Configure global 401 failure handler for Axios interceptor
    setAuthFailureHandler(() => {
      resetAuthState();
    });

    checkAuth();
  }, [checkAuth, resetAuthState]);

  // Login action
  const login = async (email, password) => {
    setError(null);
    try {
      const response = await loginApi({ email, password });
      if (response.success && response.data) {
        updateAccessToken(response.data.accessToken);
        setUser(response.data.user);
        return { success: true, user: response.data.user };
      }
      throw new Error(response.message || 'Login failed');
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Failed to login';
      setError(message);
      return { success: false, error: message };
    }
  };

  // Register action
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

  // Logout action
  const logout = async () => {
    try {
      await logoutApi();
    } catch {
      // Ignore network errors during logout
    } finally {
      resetAuthState();
    }
  };

  // Change password action
  const changePassword = async ({ currentPassword, newPassword, confirmPassword }) => {
    try {
      const response = await changePasswordApi({
        currentPassword,
        newPassword,
        confirmPassword,
      });
      if (response.success && response.data?.accessToken) {
        updateAccessToken(response.data.accessToken);
      }
      return { success: true, message: response.message };
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Failed to change password';
      return { success: false, error: message };
    }
  };

  // Authorization helper methods
  const hasRole = (role) => {
    if (!user || !user.roles) return false;
    if (user.roles.includes('PLATFORM_ADMIN')) return true;
    return user.roles.includes(role);
  };

  const hasPermission = (permission) => {
    if (!user || !user.permissions) return false;
    if (user.roles?.includes('PLATFORM_ADMIN')) return true;
    return user.permissions.includes(permission);
  };

  const isPlatformAdmin = () => hasRole('PLATFORM_ADMIN');
  const isOperationalManager = () => user?.roles?.includes('OPERATIONAL_MANAGER') || false;
  const isTicketVerifier = () => user?.roles?.includes('TICKET_VERIFIER') || false;
  const isPassenger = () => user?.roles?.includes('PASSENGER') || false;

  const value = {
    user,
    accessToken,
    isAuthenticated: Boolean(user && accessToken),
    isLoading,
    error,
    login,
    register,
    logout,
    checkAuth,
    changePassword,
    hasRole,
    hasPermission,
    isPlatformAdmin,
    isOperationalManager,
    isTicketVerifier,
    isPassenger,
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
