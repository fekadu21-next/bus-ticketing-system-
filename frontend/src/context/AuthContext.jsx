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

  /** Helper to get dashboard route based on user roles */
  const getDashboardPath = useCallback((userData) => {
    const targetUser = userData || user;
    if (!targetUser) return '/portal';
    const roles = Array.isArray(targetUser.roles) ? targetUser.roles : [];
    if (
      roles.includes(ROLES.ADMIN) ||
      roles.includes('PLATFORM_ADMIN') ||
      roles.includes(ROLES.BOOKING_COORDINATOR) ||
      roles.includes('OPERATIONAL_MANAGER')
    ) {
      return '/portal';
    }
    return '/dashboard';
  }, [user]);

  /** Helper to attach locally cached avatar if available */
  const attachCachedAvatar = (userData) => {
    if (!userData) return null;
    try {
      const cached = localStorage.getItem(`user_avatar_${userData.id}`);
      if (cached && !userData.avatarUrl) {
        return { ...userData, avatarUrl: cached };
      }
    } catch {
      // ignore
    }
    return userData;
  };

  /** Update profile avatar in state and persist to local storage (optional to all roles) */
  const updateUserAvatar = useCallback((avatarUrl) => {
    setUser((prev) => {
      if (!prev) return prev;
      try {
        if (avatarUrl) {
          localStorage.setItem(`user_avatar_${prev.id}`, avatarUrl);
        } else {
          localStorage.removeItem(`user_avatar_${prev.id}`);
        }
      } catch (e) {
        console.warn('Could not cache avatar:', e);
      }
      return { ...prev, avatarUrl: avatarUrl || null };
    });
  }, []);

  // Session initialization — silently tries to refresh on every app load
  const checkAuth = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await refreshApi();
      if (result.success && result.data?.accessToken) {
        updateAccessToken(result.data.accessToken);
        if (result.data.user) {
          setUser(attachCachedAvatar(result.data.user));
        } else {
          // Fetch full user profile if not in refresh payload
          const meResult = await getMeApi();
          if (meResult.success && meResult.data?.user) {
            setUser(attachCachedAvatar(meResult.data.user));
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
        const userWithAvatar = attachCachedAvatar(response.data.user);
        setUser(userWithAvatar);
        const redirectPath = getDashboardPath(userWithAvatar);
        return { success: true, user: userWithAvatar, redirectPath };
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
      let userWithAvatar = null;
      if (response.success && response.data?.accessToken) {
        updateAccessToken(response.data.accessToken);
        userWithAvatar = attachCachedAvatar(response.data.user);
        setUser(userWithAvatar);
      }
      return {
        success: true,
        message: response.message,
        data: response.data,
        user: userWithAvatar || response.data?.user,
      };
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
      if (user?.id) {
        try {
          localStorage.removeItem(`user_avatar_${user.id}`);
        } catch {
          // ignore
        }
      }
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
    updateUserAvatar,
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
